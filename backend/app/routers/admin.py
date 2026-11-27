"""Protected admin endpoints for appointments and demo configuration."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AuthenticationError, ConflictError, NotFoundError, RateLimitError
from app.core.rate_limit import InMemoryRateLimiter
from app.core.security import hash_token, new_session_token, verify_password
from app.core.time import add_minutes, utc_now
from app.database import get_db
from app.models import AdminSession, AdminUser, BlockedDate, Booking, Service, WorkingHour
from app.schemas.admin import (
    AdminAvailabilityOut,
    AdminBookingOut,
    AdminBookingUpdate,
    AdminIdentityOut,
    AdminLoginIn,
    AdminLoginOut,
    BlockedDateIn,
    BlockedDateOut,
    DashboardOut,
    ServiceAdminOut,
    ServiceUpdate,
    WorkingHourIn,
    WorkingHourOut,
)
from app.services.admin import dashboard, get_booking, list_bookings, update_booking

router = APIRouter(prefix="/api/admin", tags=["Admin"])
bearer_scheme = HTTPBearer(auto_error=False)
login_limiter = InMemoryRateLimiter(settings.max_login_attempts_per_minute)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def require_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Session = Depends(get_db),
) -> AdminSession:
    """Validate a bearer token against persisted, unexpired admin sessions."""

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError("Admin sign-in is required.")
    session = db.scalar(
        select(AdminSession).where(
            AdminSession.token_hash == hash_token(credentials.credentials),
            AdminSession.revoked.is_(False),
        )
    )
    if session is None or datetime.fromisoformat(session.expires_at) <= utc_now():
        raise AuthenticationError("Your session has expired. Please sign in again.")
    return session


AdminDependency = Annotated[AdminSession, Depends(require_admin)]


@router.post("/login", response_model=AdminLoginOut, summary="Sign in as Mina")
def login(payload: AdminLoginIn, request: Request, db: Session = Depends(get_db)) -> AdminLoginOut:
    if not login_limiter.check(f"login:{_client_ip(request)}"):
        raise RateLimitError("Too many sign-in attempts. Please wait a moment.")

    admin = db.scalar(select(AdminUser).where(AdminUser.email == payload.email))
    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise AuthenticationError("Incorrect admin email or password.")

    token = new_session_token()
    expires_at = add_minutes(utc_now(), settings.admin_session_ttl_minutes)
    session = AdminSession(
        admin_id=admin.id,
        token_hash=hash_token(token),
        expires_at=expires_at.isoformat(),
    )
    db.add(session)
    db.commit()
    return AdminLoginOut(
        token=token,
        expires_at=expires_at.isoformat(),
        email=admin.email,
    )


@router.get("/me", response_model=AdminIdentityOut, summary="Check the current admin session")
def me(session: AdminDependency) -> AdminIdentityOut:
    return AdminIdentityOut(
        email=session.admin.email,
        expires_at=session.expires_at,
    )


@router.post("/logout", status_code=204, summary="Revoke the current session")
def logout(session: AdminDependency, db: Session = Depends(get_db)):
    session.revoked = True
    db.commit()


@router.get("/dashboard", response_model=DashboardOut, summary="Booking overview counters")
def get_dashboard(session: AdminDependency, db: Session = Depends(get_db)) -> DashboardOut:
    return dashboard(db)


@router.get("/bookings", response_model=list[AdminBookingOut], summary="Search and filter bookings")
def get_bookings(
    session: AdminDependency,
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[AdminBookingOut]:
    bookings = list_bookings(
        db,
        search=search,
        status=status,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return [AdminBookingOut.from_booking(booking) for booking in bookings]


@router.get("/bookings/{booking_id}", response_model=AdminBookingOut, summary="View one booking")
def get_booking_by_id(booking_id: int, session: AdminDependency, db: Session = Depends(get_db)) -> AdminBookingOut:
    return AdminBookingOut.from_booking(get_booking(db, booking_id))


@router.patch("/bookings/{booking_id}", response_model=AdminBookingOut, summary="Update a booking")
def patch_booking(
    booking_id: int,
    payload: AdminBookingUpdate,
    session: AdminDependency,
) -> AdminBookingOut:
    updated = update_booking(
        booking_id,
        status=payload.status,
        start_at=payload.start_at,
        notes=payload.notes,
    )
    return AdminBookingOut.from_booking(updated)


@router.post("/bookings/{booking_id}/cancel", response_model=AdminBookingOut, summary="Cancel a booking and release its slot")
def cancel_booking(
    booking_id: int,
    session: AdminDependency,
) -> AdminBookingOut:
    updated = update_booking(booking_id, status="cancelled", start_at=None, notes=None)
    return AdminBookingOut.from_booking(updated)


@router.get("/availability", response_model=AdminAvailabilityOut, summary="View working hours and closures")
def get_admin_availability(
    session: AdminDependency,
    db: Session = Depends(get_db),
) -> AdminAvailabilityOut:
    hours = list(db.scalars(select(WorkingHour).order_by(WorkingHour.weekday)).all())
    blocked = list(db.scalars(select(BlockedDate).order_by(BlockedDate.date)).all())
    return AdminAvailabilityOut(
        working_hours=[WorkingHourOut.model_validate(hour) for hour in hours],
        blocked_dates=[BlockedDateOut.model_validate(entry) for entry in blocked],
        timezone=settings.business_timezone,
    )


@router.post("/availability", response_model=WorkingHourOut, summary="Create or replace a working-hour rule")
def save_working_hour(
    payload: WorkingHourIn,
    session: AdminDependency,
    db: Session = Depends(get_db),
) -> WorkingHourOut:
    hour = db.scalar(select(WorkingHour).where(WorkingHour.weekday == payload.weekday))
    if hour is None:
        hour = WorkingHour(**payload.model_dump())
        db.add(hour)
    else:
        for field, value in payload.model_dump().items():
            setattr(hour, field, value)
    db.commit()
    db.refresh(hour)
    return WorkingHourOut.model_validate(hour)


@router.post("/blocked-dates", response_model=BlockedDateOut, status_code=201, summary="Block a date or interval")
def create_blocked_date(
    payload: BlockedDateIn,
    session: AdminDependency,
    db: Session = Depends(get_db),
) -> BlockedDateOut:
    existing = db.scalar(select(BlockedDate).where(BlockedDate.date == payload.date))
    if existing is not None:
        raise ConflictError("A closure already exists for that date. Delete it first.")
    entry = BlockedDate(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return BlockedDateOut.model_validate(entry)


@router.delete("/blocked-dates/{blocked_id}", status_code=204, summary="Remove a closure")
def delete_blocked_date(
    blocked_id: int,
    session: AdminDependency,
    db: Session = Depends(get_db),
):
    entry = db.scalar(select(BlockedDate).where(BlockedDate.id == blocked_id))
    if entry is None:
        raise NotFoundError("Closure not found.")
    db.delete(entry)
    db.commit()


@router.get("/services", response_model=list[ServiceAdminOut], summary="List all services including inactive")
def get_admin_services(
    session: AdminDependency,
    db: Session = Depends(get_db),
) -> list[ServiceAdminOut]:
    services = list(db.scalars(select(Service).order_by(Service.sort_order, Service.id)).all())
    return [ServiceAdminOut.model_validate(service) for service in services]


@router.patch("/services/{service_id}", response_model=ServiceAdminOut, summary="Enable, disable or edit a sample service")
def patch_service(
    service_id: int,
    payload: ServiceUpdate,
    session: AdminDependency,
    db: Session = Depends(get_db),
) -> ServiceAdminOut:
    service = db.scalar(select(Service).where(Service.id == service_id))
    if service is None:
        raise NotFoundError("Service not found.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return ServiceAdminOut.model_validate(service)
