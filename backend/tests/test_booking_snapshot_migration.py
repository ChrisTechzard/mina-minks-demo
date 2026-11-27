"""Temporary-database test for the additive booking-snapshot migration."""

from __future__ import annotations

import sqlite3
import tempfile
import uuid
from pathlib import Path

from sqlalchemy import create_engine, text

from app.migrations import ensure_booking_snapshots

_EXPECTED_COLUMNS = {
    "service_name",
    "service_category",
    "price_ghs",
    "duration_minutes",
    "snapshot_backfilled",
}


def test_legacy_migration_backfills_and_flags_inferred_snapshots() -> None:
    """A legacy row is preserved, flagged as inferred, and never overwritten."""

    db_path = Path(tempfile.gettempdir()) / f"mina_minks_migration_{uuid.uuid4().hex}.db"
    legacy_connection = sqlite3.connect(db_path)
    try:
        legacy_connection.executescript(
            """
            CREATE TABLE services (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price_ghs REAL NOT NULL,
                duration_minutes INTEGER NOT NULL
            );
            CREATE TABLE bookings (
                id INTEGER PRIMARY KEY,
                reference TEXT NOT NULL,
                client_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                start_at TEXT NOT NULL,
                end_at TEXT NOT NULL,
                status TEXT NOT NULL,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT
            );
            INSERT INTO services (id, name, category, price_ghs, duration_minutes)
            VALUES (1, 'Legacy Service', 'Full set', 250.0, 90);
            INSERT INTO bookings (
                id, reference, client_id, service_id, start_at, end_at,
                status, notes, created_at
            ) VALUES (
                1, 'MM-20260101-LEGACY1', 1, 1,
                '2026-12-01T09:00:00+00:00', '2026-12-01T10:30:00+00:00',
                'confirmed', 'Legacy booking', '2026-01-01 09:00:00'
            );
            """
        )
        legacy_connection.commit()
    finally:
        legacy_connection.close()

    engine = create_engine(f"sqlite:///{db_path}")
    try:
        added = ensure_booking_snapshots(engine)
        assert set(added) == _EXPECTED_COLUMNS

        with engine.connect() as connection:
            columns = {row[1] for row in connection.execute(text("PRAGMA table_info(bookings)"))}
            assert _EXPECTED_COLUMNS <= columns
            legacy = connection.execute(
                text(
                    "SELECT reference, service_name, service_category, price_ghs, "
                    "duration_minutes, snapshot_backfilled FROM bookings WHERE id = 1"
                )
            ).mappings().one()
        assert legacy["reference"] == "MM-20260101-LEGACY1"
        assert legacy["service_name"] == "Legacy Service"
        assert legacy["service_category"] == "Full set"
        assert legacy["price_ghs"] == 250.0
        assert legacy["duration_minutes"] == 90
        assert legacy["snapshot_backfilled"] == 1

        assert ensure_booking_snapshots(engine) == []

        # Editing the catalogue after migration must not change legacy values.
        with engine.begin() as connection:
            connection.execute(
                text(
                    "UPDATE services SET name = 'Changed Service', price_ghs = 999.0, "
                    "duration_minutes = 30 WHERE id = 1"
                )
            )
        assert ensure_booking_snapshots(engine) == []
        with engine.connect() as connection:
            after_edit = connection.execute(
                text(
                    "SELECT service_name, price_ghs, duration_minutes, snapshot_backfilled "
                    "FROM bookings WHERE id = 1"
                )
            ).mappings().one()
        assert after_edit["service_name"] == "Legacy Service"
        assert after_edit["price_ghs"] == 250.0
        assert after_edit["duration_minutes"] == 90
        assert after_edit["snapshot_backfilled"] == 1

        # A genuine booking-time snapshot must not be backfilled or overwritten.
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO bookings (
                        id, reference, client_id, service_id, start_at, end_at,
                        status, notes, created_at, service_name, service_category,
                        price_ghs, duration_minutes, snapshot_backfilled
                    ) VALUES (
                        2, 'MM-20260101-CAPTURED', 1, 1,
                        '2026-12-02T09:00:00+00:00', '2026-12-02T10:00:00+00:00',
                        'confirmed', 'Captured snapshot', '2026-01-02 09:00:00',
                        'Captured Service', 'Maintenance', 123.0, 60, 0
                    )
                    """
                )
            )
        assert ensure_booking_snapshots(engine) == []
        with engine.connect() as connection:
            genuine = connection.execute(
                text(
                    "SELECT service_name, price_ghs, duration_minutes, snapshot_backfilled "
                    "FROM bookings WHERE id = 2"
                )
            ).mappings().one()
        assert genuine["service_name"] == "Captured Service"
        assert genuine["price_ghs"] == 123.0
        assert genuine["duration_minutes"] == 60
        assert genuine["snapshot_backfilled"] == 0
    finally:
        engine.dispose()
        db_path.unlink(missing_ok=True)
