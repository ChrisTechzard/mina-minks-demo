"""Availability query and response contracts."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AvailabilityOut(BaseModel):
    date: str
    service_id: int
    timezone: str
    slot_duration_minutes: int
    slots: list[str] = Field(default_factory=list)
    message: str = ""
