"""Slot generation and conflict detection for the demo booking calendar."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import NotFoundError, ValidationError
from app.core.time import BUSINESS_TZ, add_minutes, local_datetime, parse_business_date, utc_now
from app.models import ACTIVE_STATUSES, BlockedDate, Booking, Service, WorkingHour
from app.schemas.availability import AvailabilityOut


def get_service(db: Session, service_id: int, *, include_inactive: bool = False) -> Service:
    """Return a service or raise a 404 with a stable error code."""

    query = select(Service).where(Service.id == service_id)
    if not include_inactive:
        query = query.where(Service.is_active.is_(True))
    service = db.scalar(query)
    if service is None:
        raise NotFoundError("That service is not available.")
    return service


def _active_working_hour(db: Session, day: date) -> WorkingHour | None:
    return db.scalar(
        select(WorkingHour).where(
            WorkingHour.weekday == day.weekday(),
            WorkingHour.is_active.is_(True),
        )
    )


def _blocked_entry(db: Session, day: date) -> BlockedDate | None:
    return db.scalar(select(BlockedDate).where(BlockedDate.date == day.isoformat()))


def _is_blocked(blocked: BlockedDate | None, start: datetime, end: datetime) -> bool:
    """Check whether an interval touches a full-day or partial closure."""

    if blocked is None:
        return False
    if blocked.is_full_day:
        return True
    if blocked.start_time is None or blocked.end_time is None:
        return False
    business_day = start.astimezone(BUSINESS_TZ).date()
    blocked_start = local_datetime(business_day, blocked.start_time)
    blocked_end = local_datetime(business_day, blocked.end_time)
    return start < blocked_end and end > blocked_start


def has_conflict(
    db: Session,
    start: datetime,
    end: datetime,
    *,
    exclude_booking_id: int | None = None,
) -> bool:
    """Detect any interval overlap with bookings that still reserve time."""

    query = select(Booking.id).where(
        Booking.status.in_(ACTIVE_STATUSES),
        Booking.start_at < end.isoformat(),
        Booking.end_at > start.isoformat(),
    )
    if exclude_booking_id is not None:
        query = query.where(Booking.id != exclude_booking_id)
    return db.scalar(query.limit(1)) is not None


def generate_slots(
    db: Session,
    day: date,
    service: Service,
    *,
    exclude_booking_id: int | None = None,
) -> list[str]:
    """Generate bookable UTC start times for one business day and service."""

    working_hour = _active_working_hour(db, day)
    if working_hour is None:
        return []

    blocked = _blocked_entry(db, day)
    day_start = local_datetime(day, working_hour.start_time)
    day_end = local_datetime(day, working_hour.end_time)
    earliest = add_minutes(utc_now(), settings.booking_lead_time_minutes)
    latest = add_minutes(
        utc_now(),
        settings.booking_horizon_days * 24 * 60,
    )

    cursor = day_start
    increment = timedelta(minutes=settings.slot_increment_minutes)
    duration = timedelta(minutes=service.duration_minutes)
    slots: list[str] = []

    while cursor + duration <= day_end:
        candidate_end = cursor + duration
        if (
            cursor >= earliest
            and cursor <= latest
            and not _is_blocked(blocked, cursor, candidate_end)
            and not has_conflict(db, cursor, candidate_end, exclude_booking_id=exclude_booking_id)
        ):
            slots.append(cursor.isoformat())
        cursor += increment

    return slots


def get_availability(db: Session, date_value: str, service_id: int) -> AvailabilityOut:
    """Return public availability for a date and active service."""

    if service_id <= 0:
        raise ValidationError("A valid service is required.")
    day = parse_business_date(date_value)
    service = get_service(db, service_id)
    slots = generate_slots(db, day, service)
    message = (
        "No available appointments for this date. Try another date."
        if not slots
        else f"{len(slots)} available start time(s). Times are shown in {settings.business_timezone}."
    )
    return AvailabilityOut(
        date=day.isoformat(),
        service_id=service_id,
        timezone=settings.business_timezone,
        slot_duration_minutes=service.duration_minutes,
        slots=slots,
        message=message,
    )


def is_bookable_slot(
    db: Session,
    service: Service,
    start: datetime,
    *,
    exclude_booking_id: int | None = None,
) -> bool:
    """Verify that a requested start is on the generated slot grid and conflict-free."""

    day = start.astimezone(BUSINESS_TZ).date()
    slots = generate_slots(db, day, service, exclude_booking_id=exclude_booking_id)
    return start.isoformat() in set(slots)
