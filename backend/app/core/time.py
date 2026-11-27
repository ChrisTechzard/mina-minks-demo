"""Timezone-safe datetime helpers. All persistence uses UTC ISO-8601 strings."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.core.errors import ValidationError

BUSINESS_TZ = ZoneInfo(settings.business_timezone)


def parse_utc(value: str) -> datetime:
    """Parse a client-supplied ISO datetime and normalise it to UTC."""

    if not isinstance(value, str):
        raise ValidationError("A valid ISO datetime string is required.")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValidationError("Datetime must be a valid ISO-8601 value.") from exc
    if parsed.tzinfo is None:
        raise ValidationError("Datetime must include a timezone offset.")
    return parsed.astimezone(timezone.utc)


def parse_business_date(value: str) -> date:
    """Parse a strict YYYY-MM-DD business date."""

    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError("Date must use YYYY-MM-DD format.") from exc


def parse_clock(value: str) -> time:
    """Parse a strict HH:MM clock value."""

    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError as exc:
        raise ValidationError("Time must use HH:MM format.") from exc


def local_datetime(day: date, clock: str | time) -> datetime:
    """Combine a business date and clock time into a UTC-aware datetime."""

    parsed_clock = parse_clock(clock) if isinstance(clock, str) else clock
    return datetime.combine(day, parsed_clock, tzinfo=BUSINESS_TZ).astimezone(timezone.utc)


def utc_now() -> datetime:
    """Return the current UTC time."""

    return datetime.now(timezone.utc)


def add_minutes(value: datetime, minutes: int) -> datetime:
    """Add a number of minutes to an aware datetime."""

    return value + timedelta(minutes=minutes)
