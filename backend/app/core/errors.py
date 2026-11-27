"""Domain errors with stable machine-readable codes for the frontend."""

from __future__ import annotations


class AppError(Exception):
    """Base class for expected API failures."""

    status_code: int = 400
    code: str = "app_error"

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class BookingConflictError(AppError):
    status_code = 409
    code = "slot_taken"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class AuthenticationError(AppError):
    status_code = 401
    code = "unauthorized"


class RateLimitError(AppError):
    status_code = 429
    code = "rate_limited"
