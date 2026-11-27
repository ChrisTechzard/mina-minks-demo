"""Service menu contracts."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    price_ghs: float
    duration_minutes: int
    category: str
    image_url: str | None = None
    is_active: bool
    sort_order: int = 0
