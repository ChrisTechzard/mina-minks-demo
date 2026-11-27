"""Public booking creation and returning-client lookup endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import NotFoundError, RateLimitError, ValidationError
from app.core.rate_limit import InMemoryRateLimiter
from app.database import get_db
from app.models import Booking, Client
from app.schemas.booking import BookingCreate, BookingOut, LookupOut, mask_email, mask_phone, validate_reference
from app.services.booking import create_booking

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])
booking_limiter = InMemoryRateLimiter(settings.max_booking_requests_per_minute)
lookup_limiter = InMemoryRateLimiter(settings.max_booking_requests_per_minute * 2)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("", response_model=BookingOut, status_code=201, summary="Create a booking")
def create(payload: BookingCreate, request: Request, db: Session = Depends(get_db)) -> BookingOut:
    if not booking_limiter.check(f"book:{_client_ip(request)}"):
        raise RateLimitError("Too many booking attempts. Please wait a moment and try again.")
    return create_booking(db, payload)


@router.get("/lookup/{reference}", response_model=LookupOut, summary="Look up a booking with client verification")
def lookup(
    reference: str,
    request: Request,
    email: str | None = Query(default=None),
    phone: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> LookupOut:
    if not lookup_limiter.check(f"lookup:{_client_ip(request)}"):
        raise RateLimitError("Too many lookup attempts. Please wait a moment and try again.")

    normalised_reference = validate_reference(reference)
    if not email and not phone:
        raise ValidationError("Provide the email or phone number used for this booking.")

    booking = db.scalar(select(Booking).where(Booking.reference == normalised_reference))
    if booking is None:
        raise NotFoundError("No booking matched those details.")

    client = db.scalar(select(Client).where(Client.id == booking.client_id))
    supplied_email = email.strip().lower() if email else None
    supplied_phone = "".join(character for character in (phone or "") if character.isdigit())
    expected_phone = "".join(character for character in client.phone if character.isdigit())
    if supplied_email != client.email and (not supplied_phone or supplied_phone != expected_phone):
        # Deliberately generic: do not reveal whether the reference exists.
        raise NotFoundError("No booking matched those details.")

    return LookupOut(
        reference=booking.reference,
        status=booking.status,
        start_at=booking.start_at,
        end_at=booking.end_at,
        service_name=booking.service_name or booking.service.name,
        duration_minutes=(
            booking.duration_minutes
            if booking.duration_minutes is not None
            else booking.service.duration_minutes
        ),
        client_name=client.full_name,
        client_email_masked=mask_email(client.email),
        client_phone_masked=mask_phone(client.phone),
        snapshot_backfilled=bool(booking.snapshot_backfilled),
    )
