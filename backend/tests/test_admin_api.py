"""Admin authentication, dashboard and configuration endpoints."""

from __future__ import annotations

from datetime import timedelta

from fastapi.testclient import TestClient

from app.core.time import utc_now


def test_admin_login_and_session_guard(client: TestClient) -> None:
    wrong = client.post(
        "/api/admin/login",
        json={"email": "test.admin@example.com", "password": "wrong-password"},
    )
    assert wrong.status_code == 401
    assert wrong.json()["code"] == "unauthorized"

    signed_in = client.post(
        "/api/admin/login",
        json={"email": "test.admin@example.com", "password": "test-admin-password"},
    )
    assert signed_in.status_code == 200
    token = signed_in.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    assert client.get("/api/admin/dashboard").status_code == 401
    assert client.get("/api/admin/me", headers=headers).status_code == 200
    assert client.post("/api/admin/logout", headers=headers).status_code in (200, 204)
    assert client.get("/api/admin/me", headers=headers).status_code == 401


def test_dashboard_and_booking_management(
    client: TestClient,
    admin_headers: dict[str, str],
    booking_payload: dict[str, object],
) -> None:
    created = client.post("/api/bookings", json=booking_payload)
    assert created.status_code == 201
    reference = created.json()["reference"]

    dashboard = client.get("/api/admin/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["total_bookings"] >= 2  # seeded demo + new booking

    search = client.get(
        "/api/admin/bookings",
        headers=admin_headers,
        params={"search": reference},
    )
    assert search.status_code == 200
    assert len(search.json()) == 1

    booking_id = search.json()[0]["id"]
    detail = client.get(f"/api/admin/bookings/{booking_id}", headers=admin_headers)
    assert detail.status_code == 200
    assert detail.json()["client_email"] == booking_payload["email"]

    patched = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers=admin_headers,
        json={"status": "confirmed", "notes": "Reviewed by Mina (demo)"},
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "confirmed"
    assert patched.json()["notes"] == "Reviewed by Mina (demo)"


def test_working_hours_blocked_dates_and_service_toggle(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    updated_hour = client.post(
        "/api/admin/availability",
        headers=admin_headers,
        json={"weekday": 0, "start_time": "08:00", "end_time": "17:00", "is_active": True},
    )
    assert updated_hour.status_code == 200
    assert updated_hour.json()["start_time"] == "08:00"

    closed_day = (utc_now() + timedelta(days=13)).date().isoformat()
    blocked = client.post(
        "/api/admin/blocked-dates",
        headers=admin_headers,
        json={"date": closed_day, "reason": "Demo closure", "is_full_day": True},
    )
    assert blocked.status_code == 201

    duplicate = client.post(
        "/api/admin/blocked-dates",
        headers=admin_headers,
        json={"date": closed_day, "is_full_day": True},
    )
    assert duplicate.status_code == 409

    all_availability = client.get("/api/admin/availability", headers=admin_headers)
    assert all_availability.status_code == 200
    assert any(item["date"] == closed_day for item in all_availability.json()["blocked_dates"])

    remove = client.delete(
        f"/api/admin/blocked-dates/{blocked.json()['id']}", headers=admin_headers
    )
    assert remove.status_code in (200, 204)

    disabled = client.patch(
        "/api/admin/services/6",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert disabled.status_code == 200
    assert disabled.json()["is_active"] is False
    public = client.get("/api/services")
    assert all(service["id"] != 6 for service in public.json())
