"""Public booking and lookup contracts."""

from __future__ import annotations

import re
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.errors import ValidationError

_EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_PHONE_PATTERN = re.compile(r"^\+?[0-9()\s-]{7,20}$")
_REFERENCE_PATTERN = re.compile(r"^MM-[0-9]{8}-[A-Z0-9]{6}$")


def _normalise_datetime(value: str) -> str:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValidationError("Datetime must be a valid ISO-8601 value.") from exc
    if parsed.tzinfo is None:
        raise ValidationError("Datetime must include a timezone offset.")
    return parsed.astimezone(timezone.utc).isoformat()


class BookingCreate(BaseModel):
    service_id: int = Field(gt=0)
    start_at: str
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=7, max_length=20)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("start_at")
    @classmethod
    def validate_start_at(cls, value: str) -> str:
        return _normalise_datetime(value)

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValidationError("Please enter your full name.")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not _EMAIL_PATTERN.match(cleaned):
            raise ValidationError("Please enter a valid email address.")
        return cleaned

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned = value.strip()
        if not _PHONE_PATTERN.match(cleaned):
            raise ValidationError("Please enter a valid phone number.")
        digit_count = sum(character.isdigit() for character in cleaned)
        if digit_count < 7:
            raise ValidationError("Please enter a phone number with at least 7 digits.")
        return cleaned


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reference: str
    status: str
    start_at: str
    end_at: str
    service_name: str
    service_category: str
    service_duration_minutes: int
    price_ghs: float
    client_name: str
    client_email_masked: str
    client_phone_masked: str
    snapshot_backfilled: bool = False
    message: str = "Demo booking created. No payment has been taken."


def mask_email(value: str) -> str:
    """Partially mask an email address for client-facing responses."""

    local, _, domain = value.partition("@")
    if not domain:
        return "***"
    head = local[:1] if local else "*"
    return f"{head}{'*' * max(len(local) - 1, 1)}@{domain}"


def mask_phone(value: str) -> str:
    """Show only the last four digits of a phone number."""

    digits = "".join(character for character in value if character.isdigit())
    if len(digits) <= 4:
        return "***"
    return f"***{digits[-4:]}"


class LookupOut(BaseModel):
    reference: str
    status: str
    start_at: str
    end_at: str
    service_name: str
    duration_minutes: int
    client_name: str
    client_email_masked: str
    client_phone_masked: str
    snapshot_backfilled: bool = False


def validate_reference(reference: str) -> str:
    """Validate a booking reference shape before querying the database."""

    cleaned = reference.strip().upper()
    if not _REFERENCE_PATTERN.match(cleaned):
        raise ValidationError("That booking reference format is not valid.")
    return cleaned
