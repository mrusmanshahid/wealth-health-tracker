"""Currency conversion rates with in-memory cache."""

from __future__ import annotations

import time
from typing import Any

import httpx

FALLBACK_RATES: dict[str, float] = {
    "EUR": 1.08,
    "GBP": 1.27,
    "JPY": 0.0067,
    "CHF": 1.13,
    "CAD": 0.74,
    "AUD": 0.65,
    "INR": 0.012,
    "CNY": 0.14,
    "HKD": 0.13,
    "SGD": 0.74,
    "SEK": 0.095,
    "NOK": 0.091,
    "DKK": 0.145,
    "KRW": 0.00075,
    "USD": 1.0,
}

CACHE_DURATION_MS = 60 * 60 * 1000

_cached_rates: dict[str, float] = dict(FALLBACK_RATES)
_last_fetch_time: float = 0


async def fetch_exchange_rates() -> dict[str, float]:
    global _cached_rates, _last_fetch_time

    now = time.time() * 1000
    if now - _last_fetch_time < CACHE_DURATION_MS and len(_cached_rates) > 1:
        return _cached_rates

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://api.exchangerate-api.com/v4/latest/USD"
            )
            if response.is_success:
                data: dict[str, Any] = response.json()
                rates = data.get("rates")
                if rates:
                    converted = {"USD": 1.0}
                    for currency, rate in rates.items():
                        if rate:
                            converted[currency] = 1 / rate
                    _cached_rates = converted
                    _last_fetch_time = now
    except Exception:
        pass

    return _cached_rates
