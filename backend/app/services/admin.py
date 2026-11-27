"""Administrative queries and mutations over bookings and configuration."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError, ValidationError
from app.core.time import BUSINESS_TZ, add_minutes, local_datetime, parse_business_date, parse_utc, utc_now
from app.models import ACTIVE_STATUSES, Booking, Client, Service
from app.schemas.admin import AdminBookingOut, DashboardOut
from app.services.availability import get_service, has_conflict, is_bookable_slot


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
        select(func.coalesce(func.sum(Service.price_ghs), 0.0))
        .select_from(Booking)
        .join(Service, Service.id == Booking.service_id)
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
    db: Session,
    booking: Booking,
    *,
    status: str | None,
    start_at: str | None,
    notes: str | None,
) -> Booking:
    """Update status/notes and validate any reschedule or reactivation."""

    if start_at is not None:
        service = get_service(db, booking.service_id, include_inactive=True)
        new_start = parse_utc(start_at)
        new_end = add_minutes(new_start, service.duration_minutes)
        if not is_bookable_slot(db, service, new_start, exclude_booking_id=booking.id):
            if has_conflict(db, new_start, new_end, exclude_booking_id=booking.id):
                raise ValidationError("Another appointment already occupies that time.")
            raise ValidationError("That time is outside the configured working hours.")
        booking.start_at = new_start.isoformat()
        booking.end_at = new_end.isoformat()

    next_status = status if status is not None else booking.status
    if next_status != "cancelled" and booking.status == "cancelled" and start_at is None:
        service = get_service(db, booking.service_id, include_inactive=True)
        start = parse_utc(booking.start_at)
        if not is_bookable_slot(db, service, start, exclude_booking_id=booking.id):
            raise ValidationError("This cancelled slot is no longer free; choose a new time.")

    if status is not None:
        booking.status = status
    if notes is not None:
        booking.notes = notes

    db.commit()
    db.refresh(booking)
    return booking
