"""Seed and reset clearly-labelled demonstration data.

Usage: python -m app.seed [--reset]
"""

from __future__ import annotations

import argparse
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.time import add_minutes, local_datetime, utc_now
from app.database import SessionLocal, init_db, reset_schema
from app.models import Booking, Client, Service, WorkingHour

IMAGE_BASE = "https://images.unsplash.com/"

DEMO_SERVICES: tuple[dict[str, object], ...] = (
    {
        "name": "Classic Lash Extensions",
        "description": "A soft, defined lash line using one extension per natural lash. Sample menu item.",
        "price_ghs": 320.0,
        "duration_minutes": 120,
        "category": "Full set",
        "image_url": f"{IMAGE_BASE}photo-1515377905703-c4788e51af15?w=900&q=80",
        "sort_order": 1,
    },
    {
        "name": "Hybrid Lash Extensions",
        "description": "A sample blend of classic and volume fans for balanced texture and depth.",
        "price_ghs": 380.0,
        "duration_minutes": 150,
        "category": "Full set",
        "image_url": f"{IMAGE_BASE}photo-1522335789203-aabd1fc54bc9?w=900&q=80",
        "sort_order": 2,
    },
    {
        "name": "Volume Lash Extensions",
        "description": "A sample multi-lash fan technique for a fuller, more dramatic finish.",
        "price_ghs": 450.0,
        "duration_minutes": 180,
        "category": "Full set",
        "image_url": f"{IMAGE_BASE}photo-1596462502278-27bfdc403348?w=900&q=80",
        "sort_order": 3,
    },
    {
        "name": "Lash Refill",
        "description": "Sample maintenance appointment to fill grown-out areas between full sets.",
        "price_ghs": 200.0,
        "duration_minutes": 90,
        "category": "Maintenance",
        "image_url": f"{IMAGE_BASE}photo-1570172619644-dfd03ed5d881?w=900&q=80",
        "sort_order": 4,
    },
    {
        "name": "Lash Removal",
        "description": "Sample appointment for gentle removal of existing extensions.",
        "price_ghs": 100.0,
        "duration_minutes": 45,
        "category": "Maintenance",
        "image_url": f"{IMAGE_BASE}photo-1487412720507-e7ab37603c6f?w=900&q=80",
        "sort_order": 5,
    },
    {
        "name": "Lash Consultation",
        "description": "Sample discussion of style preferences and aftercare before booking.",
        "price_ghs": 50.0,
        "duration_minutes": 30,
        "category": "Consultation",
        "image_url": f"{IMAGE_BASE}photo-1608248543803-ba4f8c70ae0b?w=900&q=80",
        "sort_order": 6,
    },
)

DEMO_WORKING_HOURS: tuple[tuple[int, str, str, bool], ...] = (
    (0, "09:00", "18:00", True),
    (1, "09:00", "18:00", True),
    (2, "09:00", "18:00", True),
    (3, "09:00", "18:00", True),
    (4, "09:00", "18:00", True),
    (5, "09:00", "16:00", True),
    (6, "10:00", "14:00", False),
)


def seed_if_empty(db: Session) -> None:
    """Populate the database once; never overwrite existing demo edits."""

    service_count = db.scalar(select(func.count(Service.id))) or 0
    if service_count == 0:
        for item in DEMO_SERVICES:
            db.add(Service(**item))
        db.flush()

    hour_count = db.scalar(select(func.count(WorkingHour.id))) or 0
    if hour_count == 0:
        for weekday, start_time, end_time, is_active in DEMO_WORKING_HOURS:
            db.add(
                WorkingHour(
                    weekday=weekday,
                    start_time=start_time,
                    end_time=end_time,
                    is_active=is_active,
                )
            )
        db.flush()

    booking_count = db.scalar(select(func.count(Booking.id))) or 0
    if booking_count == 0:
        demo_day = (utc_now() + timedelta(days=1)).date()
        start = local_datetime(demo_day, "10:00")
        demo_service = db.scalar(select(Service).where(Service.id == 1))
        duration = demo_service.duration_minutes if demo_service is not None else 120
        client = Client(
            full_name="Demo Client",
            email="demo.client@example.com",
            phone="+233200000000",
        )
        db.add(client)
        db.flush()
        db.add(
            Booking(
                reference=f"MM-{demo_day.strftime('%Y%m%d')}-DEMO01",
                client_id=client.id,
                service_id=1,
                start_at=start.isoformat(),
                end_at=add_minutes(start, duration).isoformat(),
                status="confirmed",
                notes="Seeded demonstration appointment - not a real booking.",
                service_name=demo_service.name if demo_service is not None else "Classic Lash Extensions",
                service_category=demo_service.category if demo_service is not None else "Full set",
                price_ghs=demo_service.price_ghs if demo_service is not None else 320.0,
                duration_minutes=duration,
                snapshot_backfilled=False,
            )
        )

    db.commit()


def reset_demo_data() -> None:
    """Delete all data, rebuild the schema and reseed the demonstration state."""

    reset_schema()
    with SessionLocal() as db:
        seed_if_empty(db)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mina Minks demo data utility")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete all bookings/configuration and reseed demo data",
    )
    args = parser.parse_args()
    init_db()
    if args.reset:
        reset_demo_data()
        print("Demo data reset: services, working hours and one sample booking restored.")
    else:
        with SessionLocal() as db:
            seed_if_empty(db)
        print("Demo data verified/seeded without removing existing records.")


if __name__ == "__main__":
    main()
