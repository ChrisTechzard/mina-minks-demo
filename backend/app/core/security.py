"""Password and session-token primitives using only the standard library."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from typing import Final

PBKDF2_ITERATIONS: Final[int] = 240_000
_ALGORITHM: Final[str] = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    """Hash a password with a fresh random salt (PBKDF2-HMAC-SHA256)."""

    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return f"{_ALGORITHM}${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    """Verify a password in constant time; malformed hashes are rejected."""

    try:
        algorithm, iterations_text, salt_hex, digest_hex = encoded.split("$")
        if algorithm != _ALGORITHM:
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations_text),
        )
        return hmac.compare_digest(candidate.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def hash_token(token: str) -> str:
    """Create the value stored for a bearer token (never store raw tokens)."""

    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_session_token() -> str:
    """Generate a hard-to-guess bearer token."""

    return secrets.token_urlsafe(32)
