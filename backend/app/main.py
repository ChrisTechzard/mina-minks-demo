"""FastAPI application entry point for the Mina Minks demo platform."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from app.core.config import settings
from app.core.errors import AppError
from app.database import SessionLocal, init_db
from app.routers import admin, aftercare, availability, bookings, services
from app.seed import seed_if_empty

logger = logging.getLogger("mina_minks")


@asynccontextmanager
async def lifespan(_application: FastAPI) -> AsyncIterator[None]:
    init_db()
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


app = FastAPI(
    title="Mina Minks Demo API",
    version="1.0.0",
    description=(
        "Booking API for the Mina Minks hackathon prototype. All services, prices, "
        "hours and policies are SAMPLE DATA pending business approval."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.frontend_origin.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(AppError)
async def handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(exc.errors()), "code": "validation_error"},
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled API error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again.", "code": "internal_error"},
    )


@app.get("/api/health", tags=["System"], summary="Health check")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}


app.include_router(services.router)
app.include_router(availability.router)
app.include_router(bookings.router)
app.include_router(aftercare.router)
app.include_router(admin.router)
