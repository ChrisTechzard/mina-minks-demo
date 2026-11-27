"""Demonstration aftercare content contract."""

from __future__ import annotations

from pydantic import BaseModel


class AftercareSection(BaseModel):
    title: str
    items: list[str]


class AftercareOut(BaseModel):
    label: str
    disclaimer: str
    sections: list[AftercareSection]
    rebooking_note: str
