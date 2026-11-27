"""Public availability endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.availability import AvailabilityOut
from app.services.availability import get_availability

router = APIRouter(prefix="/api/availability", tags=["Availability"])


@router.get("", response_model=AvailabilityOut, summary="List bookable start times")
def availability(
    date: str = Query(description="Business date in YYYY-MM-DD format"),
    service_id: int = Query(gt=0),
    db: Session = Depends(get_db),
) -> AvailabilityOut:
    return get_availability(db, date, service_id)
