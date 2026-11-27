"""Booking-time commercial snapshots remain stable when the catalogue changes."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.time import local_datetime, parse_business_date
from app.database import SessionLocal
from app.models import Booking, Service


def _signed_in_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/admin/login",
        json={"email": "test.admin@example.com", "password": "test-admin-password"},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_booking_snapshots_are_persisted_and_isolated_from_service_edits(
    client: TestClient,
    booking_day: str,
    booking_payload: dict[str, object],
) -> None:
    created = client.post("/api/bookings", json=booking_payload)
    assert created.status_code == 201, created.text
    confirmation = created.json()
    assert confirmation["service_name"] == "Lash Refill"
    assert confirmation["price_ghs"] == 200.0
    assert confirmation["service_duration_minutes"] == 90
    assert confirmation["snapshot_backfilled"] is False

    reference = confirmation["reference"]
    headers = _signed_in_headers(client)
    service_id = int(booking_payload["service_id"])
    service_change = client.patch(
        f"/api/admin/services/{service_id}",
        json={"name": "Renamed Lash Service", "price_ghs": 999.0, "duration_minutes": 45},
        headers=headers,
    )
    assert service_change.status_code == 200, service_change.text

    lookup = client.get(
        f"/api/bookings/lookup/{reference}",
        params={"email": booking_payload["email"]},
    )
    assert lookup.status_code == 200, lookup.text
    assert lookup.json()["service_name"] == "Lash Refill"
    assert lookup.json()["duration_minutes"] == 90
    assert lookup.json()["snapshot_backfilled"] is False

    admin_list = client.get("/api/admin/bookings", headers=headers)
    assert admin_list.status_code == 200, admin_list.text
    admin_booking = next(
        row for row in admin_list.json() if row["reference"] == reference
    )
    assert admin_booking["service_name"] == "Lash Refill"
    assert admin_booking["price_ghs"] == 200.0
    assert admin_booking["duration_minutes"] == 90
    assert admin_booking["snapshot_backfilled"] is False

    # The edited 45-minute catalogue would fit 17:00, but the booked 90-minute
    # snapshot does not. Reschedule validation must use the booked duration.
    late_start = local_datetime(parse_business_date(booking_day), "17:00").isoformat()
    late_reschedule = client.patch(
        f"/api/admin/bookings/{admin_booking['id']}",
        json={"start_at": late_start},
        headers=headers,
    )
    assert late_reschedule.status_code == 422
    assert late_reschedule.json()["code"] == "validation_error"

    with SessionLocal() as db:
        stored = db.scalar(select(Booking).where(Booking.reference == reference))
        assert stored is not None
        assert stored.service_name == "Lash Refill"
        assert stored.price_ghs == 200.0
        assert stored.duration_minutes == 90
        assert stored.snapshot_backfilled is False

    dashboard = client.get("/api/admin/dashboard", headers=headers)
    assert dashboard.status_code == 200, dashboard.text
    assert dashboard.json()["sample_value_ghs"] == 520.0  # seeded 320 + booked 200

    with SessionLocal() as db:
        service = db.scalar(select(Service).where(Service.id == service_id))
        assert service is not None
        assert service.name == "Renamed Lash Service"
        assert service.price_ghs == 999.0
