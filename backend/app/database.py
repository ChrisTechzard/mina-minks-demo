"""SQLAlchemy engine, session factory and schema initialisation."""

from __future__ import annotations

from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


def _make_engine() -> Engine:
    """Use SQLite locally and a plain SQLAlchemy URL for hosted PostgreSQL."""

    if not settings.database_url.startswith("sqlite:"):
        return create_engine(settings.database_url, pool_pre_ping=True)

    is_memory = settings.database_url.endswith(":memory:")
    connect_args: dict[str, Any] = {"check_same_thread": False}
    if is_memory:
        return create_engine(
            settings.database_url,
            connect_args=connect_args,
            poolclass=StaticPool,
        )
    connect_args["timeout"] = 30
    return create_engine(settings.database_url, connect_args=connect_args)


engine = _make_engine()


@event.listens_for(engine, "connect")
def _configure_sqlite(dbapi_connection: Any, _connection_record: Any) -> None:
    """Enable foreign keys and busy timeouts so concurrent writers wait safely."""

    if engine.dialect.name != "sqlite":
        return
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.execute("PRAGMA journal_mode=WAL")
    finally:
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a request-scoped database session."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables and the environment-configured admin account."""

    from app.core.security import hash_password
    from app.models import AdminUser

    Base.metadata.create_all(bind=engine)
    # Additive, idempotent schema evolution for existing local databases.
    from app.migrations import ensure_booking_snapshots

    ensure_booking_snapshots(engine)
    with SessionLocal() as db:
        admin = db.query(AdminUser).filter(AdminUser.email == settings.admin_email.lower()).first()
        if admin is None:
            admin = AdminUser(
                email=settings.admin_email.lower(),
                password_hash=hash_password(settings.admin_password),
            )
            db.add(admin)
        else:
            # The demo intentionally treats the environment value as source of truth.
            admin.password_hash = hash_password(settings.admin_password)
        db.commit()


def reset_schema() -> None:
    """Drop and recreate all tables (used only by explicit demo reset commands)."""

    Base.metadata.drop_all(bind=engine)
    if engine.dialect.name == "sqlite":
        with engine.begin() as connection:
            has_sequence = connection.exec_driver_sql(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'"
            ).first()
            if has_sequence is not None:
                connection.exec_driver_sql("DELETE FROM sqlite_sequence")
    init_db()
