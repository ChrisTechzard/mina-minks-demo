"""Public service menu endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Service
from app.schemas.service import ServiceOut
from app.services.availability import get_service

router = APIRouter(prefix="/api/services", tags=["Services"])


@router.get("", response_model=list[ServiceOut], summary="List demonstration services")
def list_services(
    db: Session = Depends(get_db),
    active_only: bool = Query(default=True),
) -> list[ServiceOut]:
    query = select(Service)
    if active_only:
        query = query.where(Service.is_active.is_(True))
    query = query.order_by(Service.sort_order, Service.id)
    return list(db.scalars(query).all())


@router.get("/{service_id}", response_model=ServiceOut, summary="Get one service")
def get_service_by_id(service_id: int, db: Session = Depends(get_db)) -> ServiceOut:
    return get_service(db, service_id, include_inactive=True)
