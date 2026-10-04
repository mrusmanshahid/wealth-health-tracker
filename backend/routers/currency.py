"""Currency rates API."""

from __future__ import annotations

from fastapi import APIRouter

from backend.services.currency import fetch_exchange_rates

router = APIRouter(prefix="/api/currency", tags=["currency"])


@router.get("/rates")
async def rates():
    return await fetch_exchange_rates()
