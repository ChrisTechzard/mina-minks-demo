"""Invalid input must return 422, never an unhandled 500."""

from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient


def _assert_validation_error(response: Any) -> None:
    assert response.status_code == 422, response.text
    assert response.json()["code"] == "validation_error"


def test_custom_validator_errors_are_422(
    client: TestClient, booking_payload: dict[str, Any]
) -> None:
    # These values pass field constraints but fail custom validators that raise
    # the project's ValidationError. Pydantic must wrap them as validation errors.
    _assert_validation_error(
        client.post("/api/bookings", json={**booking_payload, "full_name": "  A  "})
    )
    _assert_validation_error(
        client.post("/api/bookings", json={**booking_payload, "email": "not-an-email"})
    )
    _assert_validation_error(
        client.post("/api/bookings", json={**booking_payload, "start_at": "2026-01-01"})
    )


def test_admin_custom_validator_errors_are_422(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    _assert_validation_error(
        client.post(
            "/api/admin/availability",
            headers=admin_headers,
            json={"weekday": 0, "start_time": "99:99", "end_time": "17:00"},
        )
    )


def test_phone_without_meaningful_digits_is_rejected(
    client: TestClient, booking_payload: dict[str, Any]
) -> None:
    _assert_validation_error(
        client.post("/api/bookings", json={**booking_payload, "phone": "------------"})
    )
    _assert_validation_error(
        client.post("/api/bookings", json={**booking_payload, "phone": "(---) ---"})
    )
    _assert_validation_error(
        client.post("/api/bookings", json={**booking_payload, "phone": "+233123"})
    )
