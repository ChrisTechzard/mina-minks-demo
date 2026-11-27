"""Environment-driven configuration for the Mina Minks demo API."""

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]

# Provider connection strings are often bare ``postgresql://``. SQLAlchemy maps
# that scheme to psycopg2, which is not installed; pin them to psycopg 3.
_BARE_POSTGRES_SCHEMES = ("postgres://", "postgresql://")


def normalize_database_url(value: object) -> object:
    """Map legacy/bare PostgreSQL URLs onto the installed psycopg 3 driver."""

    if isinstance(value, str):
        for scheme in _BARE_POSTGRES_SCHEMES:
            if value.startswith(scheme):
                return f"postgresql+psycopg://{value[len(scheme):]}"
    return value


class Settings(BaseSettings):
    """All deployment-specific values live here; no secrets are committed."""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    environment: str = "demo"
    database_url: str = f"sqlite:///{BACKEND_DIR / 'mina_minks.db'}"
    frontend_origin: str = "http://localhost:5173,http://localhost:5174"
    admin_email: str = "mina@example.com"
    admin_password: str = "demo-password-change-me"
    admin_session_ttl_minutes: int = 480
    slot_increment_minutes: int = 30
    booking_lead_time_minutes: int = 30
    booking_horizon_days: int = 60
    business_timezone: str = "Africa/Accra"
    max_login_attempts_per_minute: int = 10
    max_booking_requests_per_minute: int = 30

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: object) -> object:
        """Accept provider URLs that use a bare or legacy PostgreSQL scheme."""

        return normalize_database_url(value)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached settings instance created from the environment."""

    return Settings()


settings = get_settings()
