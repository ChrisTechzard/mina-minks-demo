"""Isolated file-backed database fixtures for API tests."""

from __future__ import annotations

import os
import tempfile
import uuid
from collections.abc import Iterator
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

# Environment must be configured before importing application modules.
_TEST_DB_PATH = Path(tempfile.gettempdir()) / f"mina_minks_test_{uuid.uuid4().hex}.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ["ADMIN_EMAIL"] = "test.admin@example.com"
os.environ["ADMIN_PASSWORD"] = "test-admin-password"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:5173"

from app.core.time import local_datetime, parse_business_date, utc_now  # noqa: E402
from app.database import Base, SessionLocal, engine, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.routers import admin as admin_router  # noqa: E402
from app.routers import bookings as booking_router  # noqa: E402
from app.seed import seed_if_empty  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_database() -> Iterator[None]:
    """Rebuild schema and demo data before every test, then clean up."""

    Base.metadata.drop_all(bind=engine)
    init_db()
    with SessionLocal() as db:
        seed_if_empty(db)
    for limiter in (
        booking_router.booking_limiter,
        booking_router.lookup_limiter,
        admin_router.login_limiter,
    ):
        limiter._events.clear()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def booking_day() -> str:
    """A future business date with normal demo working hours."""

    return (utc_now() + timedelta(days=11)).date().isoformat()


@pytest.fixture
def booking_start(booking_day: str) -> str:
    return local_datetime(parse_business_date(booking_day), "10:00").isoformat()


@pytest.fixture
def booking_payload(booking_start: str) -> dict[str, Any]:
    return {
        "service_id": 4,  # 90-minute demo refill
        "start_at": booking_start,
        "full_name": "Ama Test Client",
        "email": "ama.test@example.com",
        "phone": "+233200000111",
        "notes": "Demo test booking",
    }


@pytest.fixture
def admin_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/admin/login",
        json={"email": "test.admin@example.com", "password": "test-admin-password"},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}
