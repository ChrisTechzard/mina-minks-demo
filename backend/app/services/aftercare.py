"""Clearly-labelled sample aftercare guidance awaiting Mina's approval."""

from __future__ import annotations

from app.schemas.aftercare import AftercareOut, AftercareSection

SAMPLE_AFTERCARE: AftercareOut = AftercareOut(
    label="SAMPLE INFORMATION — PENDING MINA'S APPROVAL",
    disclaimer=(
        "This guidance is demonstration content only. It is not professional, "
        "medical or safety advice. Follow Mina's personal instructions for your "
        "appointment instead."
    ),
    sections=[
        AftercareSection(
            title="First 24 hours",
            items=[
                "Sample guidance: avoid getting the lashes wet for the first day.",
                "Sample guidance: avoid steam, saunas and heavy exercise immediately after your appointment.",
                "Sample guidance: try not to touch or rub the lash line.",
            ],
        ),
        AftercareSection(
            title="Daily care",
            items=[
                "Sample guidance: brush gently with a clean spoolie once dry.",
                "Sample guidance: use an oil-free cleanser around the eyes.",
                "Sample guidance: avoid oil-based makeup remover on extensions.",
            ],
        ),
        AftercareSection(
            title="Between appointments",
            items=[
                "Sample guidance: book a refill before the lashes look sparse.",
                "Sample guidance: tell Mina about any irritation before your next visit.",
                "Sample guidance: do not attempt to remove extensions yourself.",
            ],
        ),
    ],
    rebooking_note=(
        "Returning clients can look up a booking with their reference and the "
        "email or phone used at booking, then rebook from the confirmation view."
    ),
)


def get_aftercare() -> AftercareOut:
    """Return the static, clearly-labelled sample guidance."""

    return SAMPLE_AFTERCARE
