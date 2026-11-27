"""PostgreSQL URL normalisation must select psycopg 3 without touching data."""

from __future__ import annotations

import pytest

from app.core.config import Settings, normalize_database_url, settings
from app.database import _make_engine


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("postgres://user:pw@host:5432/db", "postgresql+psycopg://user:pw@host:5432/db"),
        ("postgresql://user:pw@host:5432/db", "postgresql+psycopg://user:pw@host:5432/db"),
        ("postgresql+psycopg://user:pw@host:5432/db", "postgresql+psycopg://user:pw@host:5432/db"),
        ("sqlite:////tmp/mina.db", "sqlite:////tmp/mina.db"),
    ],
)
def test_normalize_database_url(raw: str, expected: str) -> None:
    assert normalize_database_url(raw) == expected


def test_settings_normalize_bare_postgres_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://demo:pw@localhost:5432/mina_demo")
    configured = Settings()
    assert configured.database_url == "postgresql+psycopg://demo:pw@localhost:5432/mina_demo"


@pytest.mark.parametrize(
    ("raw", "expected_driver", "expected_dialect"),
    [
        ("postgresql://demo:pw@localhost:5432/mina_demo", "postgresql+psycopg", "postgresql"),
        ("sqlite://", "sqlite", "sqlite"),
    ],
)
def test_engine_uses_expected_driver_without_connecting(
    monkeypatch: pytest.MonkeyPatch,
    raw: str,
    expected_driver: str,
    expected_dialect: str,
) -> None:
    """Creating an engine must not open a connection or mutate a database."""

    monkeypatch.setattr(settings, "database_url", raw)
    engine = _make_engine()
    try:
        assert engine.url.drivername == expected_driver
        assert engine.dialect.name == expected_dialect
    finally:
        engine.dispose()
