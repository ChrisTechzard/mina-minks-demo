"""Admin authentication, management and configuration contracts."""

from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.errors import ValidationError
from app.schemas.booking import _normalise_datetime

_CLOCK_PATTERN = re.compile(r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
_EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class AdminLoginIn(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=200)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not _EMAIL_PATTERN.match(cleaned):
            raise ValidationError("Please enter a valid admin email.")
        return cleaned


class AdminLoginOut(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_at: str
    email: str


class AdminIdentityOut(BaseModel):
    email: str
    expires_at: str


class AdminBookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    status: str
    start_at: str
    end_at: str
    notes: str | None = None
    created_at: str
    client_name: str
    client_email: str
    client_phone: str
    service_id: int
    service_name: str
    price_ghs: float
    duration_minutes: int

    @classmethod
    def from_booking(cls, booking: object) -> "AdminBookingOut":
        """Map an ORM booking with joined client/service into a flat DTO."""

        return cls(
            id=booking.id,  # type: ignore[attr-defined]
            reference=booking.reference,  # type: ignore[attr-defined]
            status=booking.status,  # type: ignore[attr-defined]
            start_at=booking.start_at,  # type: ignore[attr-defined]
            end_at=booking.end_at,  # type: ignore[attr-defined]
            notes=booking.notes,  # type: ignore[attr-defined]
            created_at=booking.created_at.isoformat(),  # type: ignore[attr-defined]
            client_name=booking.client.full_name,  # type: ignore[attr-defined]
            client_email=booking.client.email,  # type: ignore[attr-defined]
            client_phone=booking.client.phone,  # type: ignore[attr-defined]
            service_id=booking.service_id,  # type: ignore[attr-defined]
            service_name=booking.service.name,  # type: ignore[attr-defined]
            price_ghs=booking.service.price_ghs,  # type: ignore[attr-defined]
            duration_minutes=booking.service.duration_minutes,  # type: ignore[attr-defined]
        )


class AdminBookingUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(pending|confirmed|completed|cancelled)$")
    start_at: str | None = None
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("start_at")
    @classmethod
    def validate_start_at(cls, value: str | None) -> str | None:
        return _normalise_datetime(value) if value is not None else None

    @model_validator(mode="after")
    def require_change(self) -> "AdminBookingUpdate":
        if self.status is None and self.start_at is None and self.notes is None:
            raise ValidationError("Provide at least one field to update.")
        return self


class WorkingHourIn(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: str
    end_time: str
    is_active: bool = True

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_clock(cls, value: str) -> str:
        if not _CLOCK_PATTERN.match(value):
            raise ValidationError("Working hours must use HH:MM format.")
        return value

    @model_validator(mode="after")
    def validate_order(self) -> "WorkingHourIn":
        if self.start_time >= self.end_time:
            raise ValidationError("Opening time must be earlier than closing time.")
        return self


class WorkingHourOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    weekday: int
    start_time: str
    end_time: str
    is_active: bool


class BlockedDateIn(BaseModel):
    date: str
    reason: str | None = Field(default=None, max_length=200)
    is_full_day: bool = True
    start_time: str | None = None
    end_time: str | None = None

    @field_validator("date")
    @classmethod
    def validate_date(cls, value: str) -> str:
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:
            raise ValidationError("Date must use YYYY-MM-DD format.") from exc
        return value

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_clock(cls, value: str | None) -> str | None:
        if value is not None and not _CLOCK_PATTERN.match(value):
            raise ValidationError("Blocked times must use HH:MM format.")
        return value

    @model_validator(mode="after")
    def validate_period(self) -> "BlockedDateIn":
        if not self.is_full_day:
            if self.start_time is None or self.end_time is None:
                raise ValidationError("Partial closures need both start and end times.")
            if self.start_time >= self.end_time:
                raise ValidationError("Blocked start time must be earlier than end time.")
        return self


class BlockedDateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: str
    reason: str | None
    is_full_day: bool
    start_time: str | None
    end_time: str | None


class ServiceAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    price_ghs: float
    duration_minutes: int
    category: str
    image_url: str | None
    is_active: bool
    sort_order: int


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, min_length=5, max_length=2000)
    price_ghs: float | None = Field(default=None, ge=0, le=100000)
    duration_minutes: int | None = Field(default=None, ge=15, le=480)
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_change(self) -> "ServiceUpdate":
        if all(value is None for value in (
            self.name, self.description, self.price_ghs,
            self.duration_minutes, self.is_active,
        )):
            raise ValidationError("Provide at least one field to update.")
        return self


class AdminAvailabilityOut(BaseModel):
    working_hours: list[WorkingHourOut]
    blocked_dates: list[BlockedDateOut]
    timezone: str


class DashboardOut(BaseModel):
    total_bookings: int
    today_bookings: int
    upcoming_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    sample_value_ghs: float
    upcoming: list[AdminBookingOut]
