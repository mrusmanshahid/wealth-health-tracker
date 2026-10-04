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
    "PKR": 0.0036,
    "AED": 0.272,
    "USD": 1.0,
}

CACHE_DURATION_MS = 60 * 60 * 1000

_cached_rates: dict[str, float] = dict(FALLBACK_RATES)
_last_fetch_time: float = 0


def normalize_currency(code: str | None) -> str:
    """Normalize Yahoo quirks (GBp/GBX = pence)."""
    if not code:
        return "USD"
    c = str(code).strip()
    if c in ("GBp", "GBX", "gbp", "gbx"):
        return "GBp"
    return c.upper()


def get_rates_sync() -> dict[str, float]:
    """Return last known rates (fallback-safe) for sync code paths."""
    return dict(_cached_rates) if _cached_rates else dict(FALLBACK_RATES)


def to_usd(amount: float | None, currency: str | None) -> float:
    """Convert an amount in `currency` to USD."""
    if amount is None:
        return 0.0
    try:
        value = float(amount)
    except (TypeError, ValueError):
        return 0.0

    code = normalize_currency(currency)
    if code == "USD":
        return value

    # Yahoo London sometimes quotes in pence
    if code == "GBp":
        value = value / 100.0
        code = "GBP"

    rates = get_rates_sync()
    rate = rates.get(code) or FALLBACK_RATES.get(code)
    if not rate:
        return value
    return value * float(rate)


def exchange_rate_to_usd(currency: str | None) -> float:
    code = normalize_currency(currency)
    if code == "USD":
        return 1.0
    if code == "GBp":
        # 1 pence → USD
        gbp = get_rates_sync().get("GBP") or FALLBACK_RATES["GBP"]
        return float(gbp) / 100.0
    rates = get_rates_sync()
    return float(rates.get(code) or FALLBACK_RATES.get(code) or 1.0)


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
                    # Keep pence helper for Yahoo GBp quotes
                    if "GBP" in converted:
                        converted["GBp"] = converted["GBP"] / 100.0
                    _cached_rates = converted
                    _last_fetch_time = now
    except Exception:
        pass

    return _cached_rates
