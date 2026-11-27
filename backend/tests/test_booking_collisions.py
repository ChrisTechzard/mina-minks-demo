"""Acceptance tests for server-side double-booking prevention."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Any

from fastapi.testclient import TestClient

from app.core.time import add_minutes, local_datetime, parse_business_date, parse_utc


def _slot(client: TestClient, day: str, hour: str, service_id: int = 4) -> str:
    response = client.get(
        "/api/availability", params={"date": day, "service_id": service_id}
    )
    assert response.status_code == 200
    candidate = local_datetime(parse_business_date(day), hour).isoformat()
    assert candidate in response.json()["slots"]
    return candidate


def test_first_booking_then_duplicate_is_rejected(
    client: TestClient, booking_payload: dict[str, Any]
) -> None:
    first = client.post("/api/bookings", json=booking_payload)
    assert first.status_code == 201, first.text
    assert first.json()["reference"].startswith("MM-")
    assert first.json()["status"] == "pending"

    second = client.post("/api/bookings", json=booking_payload)
    assert second.status_code == 409
    assert second.json()["code"] == "slot_taken"


def test_overlapping_appointment_is_rejected_and_nonoverlap_succeeds(
    client: TestClient, booking_day: str, booking_payload: dict[str, Any]
) -> None:
    long_payload = {**booking_payload, "service_id": 3, "start_at": _slot(client, booking_day, "10:00", 3)}
    first = client.post("/api/bookings", json=long_payload)
    assert first.status_code == 201, first.text

    overlap_start = add_minutes(parse_utc(long_payload["start_at"]), 30).isoformat()
    overlap = client.post("/api/bookings", json={**booking_payload, "start_at": overlap_start})
    assert overlap.status_code == 409

    nonoverlap_start = add_minutes(parse_utc(long_payload["start_at"]), 180).isoformat()
    nonoverlap = client.post(
        "/api/bookings", json={**booking_payload, "start_at": nonoverlap_start}
    )
    assert nonoverlap.status_code == 201, nonoverlap.text


def test_simultaneous_conflicting_requests_yield_exactly_one_booking(
    client: TestClient, booking_payload: dict[str, Any]
) -> None:
    with ThreadPoolExecutor(max_workers=8) as pool:
        responses = list(
            pool.map(
                lambda index: client.post(
                    "/api/bookings",
                    json={**booking_payload, "full_name": f"Client {index}"},
                ),
                range(8),
            )
        )

    statuses = sorted(response.status_code for response in responses)
    assert statuses.count(201) == 1, statuses
    assert statuses.count(409) == 7, statuses


def test_cancellation_releases_the_slot(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_payload: dict[str, Any],
) -> None:
    created = client.post("/api/bookings", json=booking_payload)
    assert created.status_code == 201
    reference = created.json()["reference"]

    bookings = client.get("/api/admin/bookings", headers=admin_headers)
    assert bookings.status_code == 200
    booking_id = next(
        item["id"] for item in bookings.json() if item["reference"] == reference
    )

    availability_before = client.get(
        "/api/availability",
        params={"date": booking_payload["start_at"][:10], "service_id": 4},
    )
    assert booking_payload["start_at"] not in availability_before.json()["slots"]

    cancelled = client.post(
        f"/api/admin/bookings/{booking_id}/cancel", headers=admin_headers
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    availability_after = client.get(
        "/api/availability",
        params={"date": booking_payload["start_at"][:10], "service_id": 4},
    )
    assert booking_payload["start_at"] in availability_after.json()["slots"]

    rebooked = client.post("/api/bookings", json=booking_payload)
    assert rebooked.status_code == 201, rebooked.text


def test_past_slot_cannot_be_booked(
    client: TestClient, booking_payload: dict[str, Any]
) -> None:
    yesterday = (datetime.now(tz=parse_utc(booking_payload["start_at"]).tzinfo) - timedelta(days=1)).date()
    past_start = local_datetime(yesterday, "10:00").isoformat()
    response = client.post("/api/bookings", json={**booking_payload, "start_at": past_start})
    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"
