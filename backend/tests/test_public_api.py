"""Public catalogue, availability, aftercare and lookup behaviour."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_services_availability_and_aftercare(client: TestClient, booking_day: str) -> None:
    services = client.get("/api/services")
    assert services.status_code == 200
    assert len(services.json()) == 6
    assert all(service["is_active"] for service in services.json())

    availability = client.get(
        "/api/availability", params={"date": booking_day, "service_id": 4}
    )
    assert availability.status_code == 200
    body = availability.json()
    assert body["service_id"] == 4
    assert len(body["slots"]) > 0
    assert body["timezone"] == "Africa/Accra"

    aftercare = client.get("/api/aftercare")
    assert aftercare.status_code == 200
    assert "SAMPLE" in aftercare.json()["label"]


def test_invalid_availability_input(client: TestClient) -> None:
    response = client.get(
        "/api/availability", params={"date": "27/11/2026", "service_id": 1}
    )
    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"


def test_lookup_requires_client_verification(
    client: TestClient, booking_payload: dict[str, object]
) -> None:
    created = client.post("/api/bookings", json=booking_payload)
    assert created.status_code == 201, created.text
    reference = created.json()["reference"]

    missing_verification = client.get(f"/api/bookings/lookup/{reference}")
    assert missing_verification.status_code == 422

    wrong_details = client.get(
        f"/api/bookings/lookup/{reference}", params={"email": "other@example.com"}
    )
    assert wrong_details.status_code == 404

    matched = client.get(
        f"/api/bookings/lookup/{reference}", params={"email": booking_payload["email"]}
    )
    assert matched.status_code == 200
    assert matched.json()["client_name"] == "Ama Test Client"
    assert "*" in matched.json()["client_email_masked"]
    assert "example.com" in matched.json()["client_email_masked"]
