"""Atomic booking creation with database-level write locking.

SQLite serialises writers with BEGIN IMMEDIATE. The in-process reentrant lock
keeps requests in this worker orderly as well; the SQL lock still protects
bookings made by a second process against the same database file.
"""

from __future__ import annotations

import secrets
import string
import threading
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError, BookingConflictError, ValidationError
from app.core.time import add_minutes, parse_utc, utc_now
from app.models import Booking, Client
from app.schemas.booking import BookingCreate, BookingOut, mask_email, mask_phone
from app.services.availability import get_service, has_conflict, is_bookable_slot

BOOKING_WRITE_LOCK = threading.RLock()
_REFERENCE_ALPHABET = string.ascii_uppercase + string.digits


def _new_reference(db: Session) -> str:
    """Generate a collision-checked, human-readable booking reference."""

    day_text = utc_now().strftime("%Y%m%d")
    for _ in range(10):
        suffix = "".join(secrets.choice(_REFERENCE_ALPHABET) for _ in range(6))
        candidate = f"MM-{day_text}-{suffix}"
        if db.scalar(select(Booking.id).where(Booking.reference == candidate)) is None:
            return candidate
    raise AppError("Unable to allocate a booking reference. Please retry.")


def _find_or_create_client(db: Session, payload: BookingCreate) -> Client:
    client = db.scalar(
        select(Client).where(
            Client.email == payload.email,
            Client.phone == payload.phone,
        )
    )
    if client is None:
        client = Client(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
        )
        db.add(client)
        db.flush()
    elif client.full_name != payload.full_name:
        client.full_name = payload.full_name
    return client


def booking_to_out(booking: Booking, client: Client) -> BookingOut:
    """Build the confirmation DTO from booking-time snapshots, not live prices."""

    return BookingOut(
        reference=booking.reference,
        status=booking.status,
        start_at=booking.start_at,
        end_at=booking.end_at,
        service_name=booking.service_name or booking.service.name,
        service_category=booking.service_category or booking.service.category,
        service_duration_minutes=(
            booking.duration_minutes
            if booking.duration_minutes is not None
            else booking.service.duration_minutes
        ),
        price_ghs=(
            booking.price_ghs
            if booking.price_ghs is not None
            else booking.service.price_ghs
        ),
        client_name=client.full_name,
        client_email_masked=mask_email(client.email),
        client_phone_masked=mask_phone(client.phone),
        snapshot_backfilled=bool(booking.snapshot_backfilled),
    )


def create_booking(db: Session, payload: BookingCreate) -> BookingOut:
    """Reserve a slot and persist the booking, rejecting any overlap with 409."""

    with BOOKING_WRITE_LOCK:
        db.execute(text("BEGIN IMMEDIATE"))
        try:
            service = get_service(db, payload.service_id)
            start = parse_utc(payload.start_at)
            end = add_minutes(start, service.duration_minutes)

            if start < add_minutes(utc_now(), settings.booking_lead_time_minutes):
                raise ValidationError("That appointment time is too soon. Please choose a later slot.")
            if not is_bookable_slot(db, service, start):
                if has_conflict(db, start, end):
                    raise BookingConflictError(
                        "That slot has just been taken. Please refresh availability and choose another time."
                    )
                raise BookingConflictError(
                    "That time is no longer available. Please refresh availability and choose another slot."
                )
            if has_conflict(db, start, end):
                raise BookingConflictError(
                    "That slot has just been taken. Please refresh availability and choose another time."
                )

            client = _find_or_create_client(db, payload)
            booking = Booking(
                reference=_new_reference(db),
                client_id=client.id,
                service_id=service.id,
                start_at=start.isoformat(),
                end_at=end.isoformat(),
                status="pending",
                notes=payload.notes,
                service_name=service.name,
                service_category=service.category,
                price_ghs=service.price_ghs,
                duration_minutes=service.duration_minutes,
                snapshot_backfilled=False,
            )
            db.add(booking)
            try:
                db.commit()
            except IntegrityError as exc:
                db.rollback()
                raise BookingConflictError(
                    "That slot could not be reserved. Please refresh and try again."
                ) from exc
            return booking_to_out(booking, client)
        except Exception:
            if db.in_transaction():
                db.rollback()
            raise
