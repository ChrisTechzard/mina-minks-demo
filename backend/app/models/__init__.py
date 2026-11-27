"""Persistent entities for services, clients, bookings and admin configuration."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    false,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

ACTIVE_STATUSES: tuple[str, ...] = ("pending", "confirmed", "completed")
ALL_STATUSES: tuple[str, ...] = ACTIVE_STATUSES + ("cancelled",)


class Service(Base):
    """A configurable demonstration service offered by the studio."""

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price_ghs: Mapped[float] = mapped_column(nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("price_ghs >= 0", name="ck_services_price_nonnegative"),
        CheckConstraint("duration_minutes > 0", name="ck_services_duration_positive"),
    )


class Client(Base):
    """Contact details supplied by a client during booking."""

    __tablename__ = "clients"
    __table_args__ = (UniqueConstraint("email", "phone", name="uq_client_email_phone"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)


class Booking(Base):
    """An appointment interval; cancelled rows do not reserve availability."""

    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_bookings_interval_status", "start_at", "end_at", "status"),
        CheckConstraint("start_at < end_at", name="ck_booking_interval_order"),
        CheckConstraint(
            "status IN ('pending','confirmed','completed','cancelled')",
            name="ck_booking_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reference: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    start_at: Mapped[str] = mapped_column(String(32), nullable=False)
    end_at: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Commercial details captured at booking time. Nullable so existing rows can
    # be migrated additively; snapshot_backfilled marks inferred legacy values.
    service_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    service_category: Mapped[str | None] = mapped_column(String(60), nullable=True)
    price_ghs: Mapped[float | None] = mapped_column(nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    snapshot_backfilled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    client: Mapped[Client] = relationship(lazy="selectin")
    service: Mapped[Service] = relationship(lazy="selectin")


class WorkingHour(Base):
    """One configurable open interval per weekday (0=Monday ... 6=Sunday)."""

    __tablename__ = "working_hours"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    weekday: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    __table_args__ = (
        CheckConstraint("weekday BETWEEN 0 AND 6", name="ck_working_hour_weekday"),
    )


class BlockedDate(Base):
    """A whole day or a partial interval closed for bookings."""

    __tablename__ = "blocked_dates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_full_day: Mapped[bool] = mapped_column(default=True, nullable=False)
    start_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    end_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)


class AdminUser(Base):
    """A hashed admin credential (one account in the prototype)."""

    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)


class AdminSession(Base):
    """A hashed bearer token with an explicit expiry."""

    __tablename__ = "admin_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    admin_id: Mapped[int] = mapped_column(ForeignKey("admin_users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[str] = mapped_column(String(32), nullable=False)
    revoked: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    admin: Mapped[AdminUser] = relationship(lazy="selectin")


__all__ = [
    "ACTIVE_STATUSES",
    "ALL_STATUSES",
    "AdminSession",
    "AdminUser",
    "BlockedDate",
    "Booking",
    "Client",
    "Service",
    "WorkingHour",
]
