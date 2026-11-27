"""Acceptance tests for atomic admin rescheduling and reactivation."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from typing import Any

from fastapi.testclient import TestClient

from app.core.time import add_minutes, local_datetime, parse_business_date, parse_utc, utc_now


def _slots(client: TestClient, day: str, service_id: int = 4) -> list[str]:
    response = client.get(
        "/api/availability", params={"date": day, "service_id": service_id}
    )
    assert response.status_code == 200, response.text
    return response.json()["slots"]


def _booking_id(
    client: TestClient, reference: str, headers: dict[str, str]
) -> int:
    response = client.get(
        "/api/admin/bookings", headers=headers, params={"search": reference}
    )
    assert response.status_code == 200, response.text
    rows = response.json()
    assert len(rows) == 1
    return int(rows[0]["id"])


def _create_booking(
    client: TestClient, payload: dict[str, Any], **overrides: Any
) -> str:
    response = client.post("/api/bookings", json={**payload, **overrides})
    assert response.status_code == 201, response.text
    return str(response.json()["reference"])


def test_admin_can_reschedule_into_a_free_slot(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_day: str,
    booking_payload: dict[str, Any],
) -> None:
    slots = _slots(client, booking_day)
    assert len(slots) >= 5
    original, destination = slots[0], slots[4]

    reference = _create_booking(client, booking_payload, start_at=original)
    booking_id = _booking_id(client, reference, admin_headers)

    patched = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"start_at": destination},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["start_at"] == destination
    assert patched.json()["end_at"] == add_minutes(parse_utc(destination), 90).isoformat()

    after = _slots(client, booking_day)
    assert original in after
    assert destination not in after


def test_admin_reschedule_into_occupied_slot_returns_409(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_day: str,
    booking_payload: dict[str, Any],
) -> None:
    slots = _slots(client, booking_day)
    assert len(slots) >= 5
    occupied, original = slots[0], slots[4]

    occupied_reference = _create_booking(client, booking_payload, start_at=occupied)
    moving_reference = _create_booking(
        client,
        booking_payload,
        start_at=original,
        email="second.client@example.com",
        full_name="Second Client",
    )
    moving_id = _booking_id(client, moving_reference, admin_headers)

    conflict = client.patch(
        f"/api/admin/bookings/{moving_id}",
        headers=admin_headers,
        json={"start_at": occupied},
    )
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "slot_taken"

    unchanged = client.get(f"/api/admin/bookings/{moving_id}", headers=admin_headers)
    assert unchanged.status_code == 200
    assert unchanged.json()["start_at"] == original
    assert occupied_reference != moving_reference


def test_customer_booking_and_admin_reschedule_cannot_both_win_same_slot(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_day: str,
    booking_payload: dict[str, Any],
) -> None:
    slots = _slots(client, booking_day)
    assert len(slots) >= 5
    original, contested = slots[0], slots[4]

    moving_reference = _create_booking(client, booking_payload, start_at=original)
    moving_id = _booking_id(client, moving_reference, admin_headers)

    def customer_books() -> Any:
        return client.post(
            "/api/bookings",
            json={
                **booking_payload,
                "start_at": contested,
                "email": "race.customer@example.com",
                "full_name": "Race Customer",
            },
        )

    def admin_reschedules() -> Any:
        return client.patch(
            f"/api/admin/bookings/{moving_id}",
            headers=admin_headers,
            json={"start_at": contested},
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        customer_future = pool.submit(customer_books)
        admin_future = pool.submit(admin_reschedules)
        customer_response = customer_future.result()
        admin_response = admin_future.result()

    statuses = [customer_response.status_code, admin_response.status_code]
    assert sum(status in (200, 201) for status in statuses) == 1, statuses
    assert statuses.count(409) == 1, statuses
    assert all(response.json().get("code") != "validation_error" for response in (customer_response, admin_response))


def test_reactivation_into_occupied_slot_is_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_day: str,
    booking_payload: dict[str, Any],
) -> None:
    slots = _slots(client, booking_day)
    assert len(slots) >= 5
    occupied, original = slots[0], slots[4]

    _create_booking(client, booking_payload, start_at=occupied)
    cancelled_reference = _create_booking(
        client,
        booking_payload,
        start_at=original,
        email="cancel.client@example.com",
        full_name="Cancel Client",
    )
    cancelled_id = _booking_id(client, cancelled_reference, admin_headers)

    cancelled = client.post(
        f"/api/admin/bookings/{cancelled_id}/cancel", headers=admin_headers
    )
    assert cancelled.status_code == 200, cancelled.text

    conflict = client.patch(
        f"/api/admin/bookings/{cancelled_id}",
        headers=admin_headers,
        json={"status": "confirmed", "start_at": occupied},
    )
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "slot_taken"

    unchanged = client.get(f"/api/admin/bookings/{cancelled_id}", headers=admin_headers)
    assert unchanged.json()["status"] == "cancelled"
    assert unchanged.json()["start_at"] == original


def test_reactivation_into_available_slot_succeeds(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_day: str,
    booking_payload: dict[str, Any],
) -> None:
    slots = _slots(client, booking_day)
    assert len(slots) >= 9
    original, destination = slots[0], slots[8]

    reference = _create_booking(client, booking_payload, start_at=original)
    booking_id = _booking_id(client, reference, admin_headers)
    cancelled = client.post(
        f"/api/admin/bookings/{booking_id}/cancel", headers=admin_headers
    )
    assert cancelled.status_code == 200, cancelled.text

    reactivated = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"status": "confirmed", "start_at": destination},
    )
    assert reactivated.status_code == 200, reactivated.text
    assert reactivated.json()["status"] == "confirmed"
    assert reactivated.json()["start_at"] == destination
    assert destination not in _slots(client, booking_day)


def test_reactivation_without_new_time_rechecks_the_original_slot(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_day: str,
    booking_payload: dict[str, Any],
) -> None:
    slots = _slots(client, booking_day)
    assert len(slots) >= 2
    original = slots[0]

    reference = _create_booking(client, booking_payload, start_at=original)
    booking_id = _booking_id(client, reference, admin_headers)
    cancelled = client.post(
        f"/api/admin/bookings/{booking_id}/cancel", headers=admin_headers
    )
    assert cancelled.status_code == 200, cancelled.text

    taken = _create_booking(
        client,
        booking_payload,
        start_at=original,
        email="rebook.client@example.com",
        full_name="Rebook Client",
    )
    assert taken != reference

    conflict = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"status": "confirmed"},
    )
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "slot_taken"


def test_past_and_too_soon_reschedules_are_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_day: str,
    booking_payload: dict[str, Any],
) -> None:
    reference = _create_booking(client, booking_payload)
    booking_id = _booking_id(client, reference, admin_headers)

    yesterday = (utc_now() - timedelta(days=1)).date()
    past_start = local_datetime(yesterday, "10:00").isoformat()
    past = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"start_at": past_start},
    )
    assert past.status_code == 422
    assert past.json()["code"] == "validation_error"

    too_soon = add_minutes(utc_now(), 10).isoformat()
    soon = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"start_at": too_soon},
    )
    assert soon.status_code == 422
    assert soon.json()["code"] == "validation_error"


def test_invalid_status_transitions_are_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_payload: dict[str, Any],
) -> None:
    reference = _create_booking(client, booking_payload)
    booking_id = _booking_id(client, reference, admin_headers)

    invalid = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"status": "completed"},
    )
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "validation_error"

    confirmed = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"status": "confirmed"},
    )
    assert confirmed.status_code == 200, confirmed.text
    completed = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"status": "completed"},
    )
    assert completed.status_code == 200, completed.text

    from_completed = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"status": "cancelled"},
    )
    assert from_completed.status_code == 422

    second_reference = _create_booking(
        client,
        booking_payload,
        email="transition.client@example.com",
        full_name="Transition Client",
        start_at=add_minutes(parse_utc(booking_payload["start_at"]), 180).isoformat(),
    )
    second_id = _booking_id(client, second_reference, admin_headers)
    cancelled = client.post(
        f"/api/admin/bookings/{second_id}/cancel", headers=admin_headers
    )
    assert cancelled.status_code == 200, cancelled.text
    invalid_reactivation = client.patch(
        f"/api/admin/bookings/{second_id}",
        headers=admin_headers,
        json={"status": "completed"},
    )
    assert invalid_reactivation.status_code == 422


def test_cancellation_releases_availability_for_a_new_customer_booking(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_payload: dict[str, Any],
) -> None:
    reference = _create_booking(client, booking_payload)
    booking_id = _booking_id(client, reference, admin_headers)
    date = booking_payload["start_at"][:10]

    before = client.get("/api/availability", params={"date": date, "service_id": 4})
    assert booking_payload["start_at"] not in before.json()["slots"]

    cancelled = client.post(
        f"/api/admin/bookings/{booking_id}/cancel", headers=admin_headers
    )
    assert cancelled.status_code == 200, cancelled.text

    after = client.get("/api/availability", params={"date": date, "service_id": 4})
    assert booking_payload["start_at"] in after.json()["slots"]

    rebooked = client.post("/api/bookings", json=booking_payload)
    assert rebooked.status_code == 201, rebooked.text
