"""Demonstration aftercare content endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.aftercare import AftercareOut
from app.services.aftercare import get_aftercare

router = APIRouter(prefix="/api/aftercare", tags=["Aftercare"])


@router.get("", response_model=AftercareOut, summary="Get sample aftercare guidance")
def aftercare() -> AftercareOut:
    return get_aftercare()
