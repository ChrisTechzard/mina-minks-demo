"""Administrative queries and mutations over bookings and configuration."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.errors import BookingConflictError, NotFoundError, ValidationError
from app.core.time import BUSINESS_TZ, add_minutes, local_datetime, parse_business_date, parse_utc, utc_now
from app.database import SessionLocal
from app.models import ACTIVE_STATUSES, Booking, Client, Service
from app.schemas.admin import AdminBookingOut, DashboardOut
from app.services.availability import get_service, has_conflict, is_bookable_slot
from app.services.booking import BOOKING_WRITE_LOCK

# Status state machine. Completed appointments are terminal; cancelled ones can
# be reactivated, but only after a full time/conflict check (see _validate_slot).
ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    "pending": frozenset({"confirmed", "cancelled"}),
    "confirmed": frozenset({"completed", "cancelled"}),
    "cancelled": frozenset({"pending", "confirmed"}),
    "completed": frozenset(),
}


def _snapshot_duration(booking: Booking, service: Service) -> int:
    """Use the booked duration, falling back only for legacy rows."""

    duration = (
        booking.duration_minutes
        if booking.duration_minutes is not None
        else service.duration_minutes
    )
    if duration is None or duration <= 0:
        raise ValidationError("The booking duration is invalid and cannot be rescheduled.")
    return duration


def _validate_slot(
    db: Session,
    service: Service,
    booking: Booking,
    start: datetime,
    end: datetime,
    duration_minutes: int,
) -> None:
    """Enforce lead time, working hours and overlap inside the write transaction.

    Slot generation is given the *booked* duration, not the current catalogue
    duration, so later service edits cannot silently change an old appointment.
    """

    if start < add_minutes(utc_now(), settings.booking_lead_time_minutes):
        raise ValidationError("That appointment time is too soon. Please choose a later slot.")
    if has_conflict(db, start, end, exclude_booking_id=booking.id):
        raise BookingConflictError(
            "That slot has just been taken. Please refresh availability and choose another time."
        )
    slot_service = SimpleNamespace(id=service.id, duration_minutes=duration_minutes)
    if not is_bookable_slot(db, slot_service, start, exclude_booking_id=booking.id):  # type: ignore[arg-type]
        raise ValidationError("That time is outside the configured working hours or booking window.")


def get_booking(db: Session, booking_id: int) -> Booking:
    """Fetch a booking by id or raise a 404."""

    booking = db.scalar(select(Booking).where(Booking.id == booking_id))
    if booking is None:
        raise NotFoundError("Booking not found.")
    return booking


def list_bookings(
    db: Session,
    *,
    search: str | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Booking]:
    """Return bookings filtered by client/reference, status and date range."""

    query = (
        select(Booking)
        .join(Client, Client.id == Booking.client_id)
        .order_by(Booking.start_at.desc())
    )
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Booking.reference.like(pattern),
                Client.full_name.like(pattern),
                Client.email.like(pattern),
            )
        )
    if status:
        query = query.where(Booking.status == status)
    if date_from:
        query = query.where(
            Booking.start_at >= local_datetime(parse_business_date(date_from), "00:00").isoformat()
        )
    if date_to:
        end_of_day = add_minutes(local_datetime(parse_business_date(date_to), "00:00"), 24 * 60)
        query = query.where(Booking.start_at < end_of_day.isoformat())
    return list(db.scalars(query.offset(offset).limit(limit)).all())


def dashboard(db: Session) -> DashboardOut:
    """Calculate overview counters and the next five upcoming appointments."""

    total = db.scalar(select(func.count(Booking.id))) or 0
    confirmed = db.scalar(
        select(func.count(Booking.id)).where(Booking.status == "confirmed")
    ) or 0
    cancelled = db.scalar(
        select(func.count(Booking.id)).where(Booking.status == "cancelled")
    ) or 0

    local_now = utc_now().astimezone(BUSINESS_TZ)
    day_start = datetime.combine(local_now.date(), datetime.min.time(), tzinfo=BUSINESS_TZ)
    day_end = day_start + timedelta(days=1)
    today = db.scalar(
        select(func.count(Booking.id)).where(
            Booking.start_at >= day_start.astimezone(timezone.utc).isoformat(),
            Booking.start_at < day_end.astimezone(timezone.utc).isoformat(),
            Booking.status.in_(ACTIVE_STATUSES),
        )
    ) or 0

    now_iso = utc_now().isoformat()
    upcoming_filters = (
        Booking.start_at >= now_iso,
        Booking.status.in_(("pending", "confirmed")),
    )
    upcoming = list(
        db.scalars(
            select(Booking)
            .where(*upcoming_filters)
            .order_by(Booking.start_at.asc())
            .limit(5)
        ).all()
    )
    upcoming_count = db.scalar(
        select(func.count(Booking.id)).where(*upcoming_filters)
    ) or 0

    sample_value = db.scalar(
        select(
            func.coalesce(
                func.sum(func.coalesce(Booking.price_ghs, Service.price_ghs)),
                0.0,
            )
        )
        .select_from(Booking)
        .outerjoin(Service, Service.id == Booking.service_id)
        .where(Booking.status.in_(("pending", "confirmed")))
    ) or 0.0

    return DashboardOut(
        total_bookings=total,
        today_bookings=today,
        upcoming_bookings=upcoming_count,
        confirmed_bookings=confirmed,
        cancelled_bookings=cancelled,
        sample_value_ghs=round(float(sample_value), 2),
        upcoming=[AdminBookingOut.from_booking(booking) for booking in upcoming],
    )


def update_booking(
    booking_id: int,
    *,
    status: str | None = None,
    start_at: str | None = None,
    notes: str | None = None,
) -> Booking:
    """Atomically validate and apply an admin status/notes/reschedule change.

    A dedicated session is used because the request session has already read the
    admin credentials; nesting BEGIN IMMEDIATE on it would be unsafe. The same
    process lock and SQLite write transaction used by customer booking creation
    serialise this mutation against other writers.
    """

    with BOOKING_WRITE_LOCK:
        with SessionLocal() as write_db:
            write_db.execute(text("BEGIN IMMEDIATE"))
            try:
                booking = write_db.scalar(
                    select(Booking)
                    .options(selectinload(Booking.client), selectinload(Booking.service))
                    .where(Booking.id == booking_id)
                )
                if booking is None:
                    raise NotFoundError("Booking not found.")

                current_status = booking.status
                next_status = status if status is not None else current_status
                if status is not None and status != current_status:
                    if status not in ALLOWED_TRANSITIONS.get(current_status, frozenset()):
                        raise ValidationError(
                            f"Cannot change booking status from {current_status} to {status}."
                        )
                if start_at is not None and current_status == "completed":
                    raise ValidationError("Completed appointments cannot be rescheduled.")

                new_start = parse_utc(start_at) if start_at is not None else None
                if new_start is not None:
                    service = get_service(write_db, booking.service_id, include_inactive=True)
                    duration = _snapshot_duration(booking, service)
                    new_end = add_minutes(new_start, duration)
                    _validate_slot(write_db, service, booking, new_start, new_end, duration)
                    booking.start_at = new_start.isoformat()
                    booking.end_at = new_end.isoformat()
                elif (
                    current_status == "cancelled"
                    and next_status in ("pending", "confirmed")
                    and next_status != current_status
                ):
                    # Reactivation without a new time must validate the original
                    # slot again: it may since have been taken or become invalid.
                    service = get_service(write_db, booking.service_id, include_inactive=True)
                    duration = _snapshot_duration(booking, service)
                    existing_start = parse_utc(booking.start_at)
                    existing_end = add_minutes(existing_start, duration)
                    _validate_slot(
                        write_db, service, booking, existing_start, existing_end, duration
                    )

                if status is not None:
                    booking.status = status
                if notes is not None:
                    booking.notes = notes

                write_db.commit()
                return booking
            except Exception:
                if write_db.in_transaction():
                    write_db.rollback()
                raise
