"""Small additive, dialect-aware migrations for the demo database.

No migration framework is used: the only schema evolution needed so far is
adding nullable booking-snapshot columns and backfilling legacy rows. The
operation is idempotent, works with SQLite and PostgreSQL, and never drops or
rewrites existing tables.
"""

from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

# Column definitions must stay in sync with the Booking model. SQLite requires
# a constant default; PostgreSQL accepts the equivalent FALSE literal.
_SQLITE_SNAPSHOT_COLUMNS: dict[str, str] = {
    "service_name": "VARCHAR(120)",
    "service_category": "VARCHAR(60)",
    "price_ghs": "FLOAT",
    "duration_minutes": "INTEGER",
    "snapshot_backfilled": "BOOLEAN NOT NULL DEFAULT 0",
}

_POSTGRES_SNAPSHOT_COLUMNS: dict[str, str] = {
    **_SQLITE_SNAPSHOT_COLUMNS,
    "snapshot_backfilled": "BOOLEAN NOT NULL DEFAULT FALSE",
}


def _column_definitions(engine: Engine) -> dict[str, str]:
    if engine.dialect.name == "postgresql":
        return _POSTGRES_SNAPSHOT_COLUMNS
    return _SQLITE_SNAPSHOT_COLUMNS


def _boolean_literals(engine: Engine) -> tuple[str, str]:
    """Return dialect-safe FALSE/TRUE literals for boolean comparisons."""

    if engine.dialect.name == "postgresql":
        return "FALSE", "TRUE"
    return "0", "1"


def ensure_booking_snapshots(engine: Engine) -> list[str]:
    """Add missing booking snapshot columns and mark inferred legacy values.

    Returns the names of the columns that were added (empty when up to date).
    Legacy rows receive the *current* service details, flagged with
    ``snapshot_backfilled = 1``; those values are inferred, not booking-time
    captures, and must never be presented as genuine historical prices.
    """

    added: list[str] = []
    definitions = _column_definitions(engine)
    false_value, true_value = _boolean_literals(engine)
    with engine.begin() as connection:
        existing = {
            column["name"] for column in inspect(connection).get_columns("bookings")
        }
        for name, definition in definitions.items():
            if name not in existing:
                connection.execute(
                    text(f"ALTER TABLE bookings ADD COLUMN {name} {definition}")
                )
                added.append(name)

        needs_backfill = connection.execute(
            text(
                f"SELECT 1 FROM bookings WHERE snapshot_backfilled = {false_value} "
                "AND (service_name IS NULL OR price_ghs IS NULL "
                "OR duration_minutes IS NULL) LIMIT 1"
            )
        ).first()
        if needs_backfill is not None:
            connection.execute(
                text(
                    f"""
                    UPDATE bookings
                    SET service_name = (
                            SELECT services.name FROM services
                            WHERE services.id = bookings.service_id
                        ),
                        service_category = (
                            SELECT services.category FROM services
                            WHERE services.id = bookings.service_id
                        ),
                        price_ghs = (
                            SELECT services.price_ghs FROM services
                            WHERE services.id = bookings.service_id
                        ),
                        duration_minutes = (
                            SELECT services.duration_minutes FROM services
                            WHERE services.id = bookings.service_id
                        ),
                        snapshot_backfilled = {true_value}
                    WHERE snapshot_backfilled = {false_value}
                      AND (service_name IS NULL OR price_ghs IS NULL
                           OR duration_minutes IS NULL)
                    """
                )
            )
    return added
