"""Wealth projector — risk profiles, 10y backtest, income & future outlook."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from backend.services import markets
from backend.services.yahoo import _history_sync, _quote_sync, _run

# Assumed high-yield savings rate (cash sleeve)
SAVINGS_ANNUAL_RATE = 0.042

PROFILES: dict[str, dict[str, Any]] = {
    "safe": {
        "id": "safe",
        "name": "Safe",
        "riskLevel": 1,
        "tagline": "Protect capital, steady income",
        "description": "Mostly savings and dividend ETFs. Lower swings, reliable cash flow.",
        "allocations": {
            "stocks": 0.10,
            "etfs": 0.40,
            "savings": 0.50,
        },
        "holdings": {
            "stocks": [
                {"symbol": "JNJ", "weight": 0.50, "role": "Dividend blue-chip"},
                {"symbol": "PG", "weight": 0.50, "role": "Defensive consumer"},
            ],
            "etfs": [
                {"symbol": "SCHD", "weight": 0.50, "role": "Dividend ETF"},
                {"symbol": "BND", "weight": 0.30, "role": "Bond cushion"},
                {"symbol": "VOO", "weight": 0.20, "role": "Broad market"},
            ],
        },
        "expectedIncomeHint": "Aims for ~3–5% yearly income from yields + savings interest.",
    },
    "balanced": {
        "id": "balanced",
        "name": "Balanced",
        "riskLevel": 2,
        "tagline": "Growth with a safety net",
        "description": "Mix of index ETFs, quality stocks, and cash for flexibility.",
        "allocations": {
            "stocks": 0.25,
            "etfs": 0.50,
            "savings": 0.25,
        },
        "holdings": {
            "stocks": [
                {"symbol": "AAPL", "weight": 0.40, "role": "Quality growth"},
                {"symbol": "MSFT", "weight": 0.40, "role": "Quality growth"},
                {"symbol": "JPM", "weight": 0.20, "role": "Financials"},
            ],
            "etfs": [
                {"symbol": "VOO", "weight": 0.45, "role": "S&P 500"},
                {"symbol": "VXUS", "weight": 0.25, "role": "International"},
                {"symbol": "SCHD", "weight": 0.20, "role": "Dividends"},
                {"symbol": "BND", "weight": 0.10, "role": "Bonds"},
            ],
        },
        "expectedIncomeHint": "Aims for ~4–7% total return with moderate income.",
    },
    "growth": {
        "id": "growth",
        "name": "Growth",
        "riskLevel": 3,
        "tagline": "Build wealth over time",
        "description": "Heavier in growth stocks and tech ETFs. More upside, more swings.",
        "allocations": {
            "stocks": 0.40,
            "etfs": 0.50,
            "savings": 0.10,
        },
        "holdings": {
            "stocks": [
                {"symbol": "NVDA", "weight": 0.30, "role": "High growth"},
                {"symbol": "AAPL", "weight": 0.25, "role": "Mega-cap"},
                {"symbol": "MSFT", "weight": 0.25, "role": "Mega-cap"},
                {"symbol": "GOOGL", "weight": 0.20, "role": "Mega-cap"},
            ],
            "etfs": [
                {"symbol": "QQQ", "weight": 0.40, "role": "Nasdaq growth"},
                {"symbol": "VGT", "weight": 0.30, "role": "Tech sector"},
                {"symbol": "VTI", "weight": 0.30, "role": "Total market"},
            ],
        },
        "expectedIncomeHint": "Lower cash yield; returns mainly from price growth (~8–12% hist.).",
    },
    "aggressive": {
        "id": "aggressive",
        "name": "Aggressive",
        "riskLevel": 4,
        "tagline": "Maximize long-term upside",
        "description": "Concentrated growth. Highest volatility — for long horizons only.",
        "allocations": {
            "stocks": 0.50,
            "etfs": 0.45,
            "savings": 0.05,
        },
        "holdings": {
            "stocks": [
                {"symbol": "NVDA", "weight": 0.35, "role": "High growth"},
                {"symbol": "TSLA", "weight": 0.20, "role": "High volatility"},
                {"symbol": "AMZN", "weight": 0.25, "role": "Growth"},
                {"symbol": "META", "weight": 0.20, "role": "Growth"},
            ],
            "etfs": [
                {"symbol": "QQQ", "weight": 0.40, "role": "Nasdaq"},
                {"symbol": "SMH", "weight": 0.35, "role": "Semiconductors"},
                {"symbol": "VGT", "weight": 0.25, "role": "Tech"},
            ],
        },
        "expectedIncomeHint": "Minimal income yield; focus is capital appreciation.",
    },
}


def list_profiles() -> list[dict[str, Any]]:
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "riskLevel": p["riskLevel"],
            "tagline": p["tagline"],
            "description": p["description"],
            "allocations": p["allocations"],
            "expectedIncomeHint": p["expectedIncomeHint"],
        }
        for p in PROFILES.values()
    ]


def _monthly_closes(symbol: str, years: int = 10) -> list[tuple[str, float]]:
    data = _history_sync(symbol, years)
    out = []
    for row in data.get("history") or []:
        if row.get("price"):
            out.append((row["date"][:7], float(row["price"])))
    return out


def _align_series(
    series_map: dict[str, list[tuple[str, float]]],
) -> list[str]:
    """Return sorted month keys present in all series."""
    if not series_map:
        return []
    sets = [set(m for m, _ in s) for s in series_map.values() if s]
    if not sets:
        return []
    common = set.intersection(*sets)
    return sorted(common)


def _backtest_portfolio(
    capital: float,
    sleeves: list[dict[str, Any]],
    savings_rate: float,
) -> dict[str, Any]:
    """
    sleeves: [{symbol, amount, kind}] where kind is stock|etf|savings
    Buy-and-hold from earliest common month; savings compounds monthly.
    """
    market = [s for s in sleeves if s["kind"] != "savings"]
    savings_amount = sum(s["amount"] for s in sleeves if s["kind"] == "savings")

    series_map: dict[str, list[tuple[str, float]]] = {}
    for s in market:
        try:
            series_map[s["symbol"]] = _monthly_closes(s["symbol"], 10)
        except Exception:
            series_map[s["symbol"]] = []

    months = _align_series(series_map)
    if len(months) < 24:
        # Fall back to any overlapping months from available series
        all_months = sorted(
            set(m for series in series_map.values() for m, _ in series)
        )
        months = all_months[-120:] if len(all_months) > 24 else all_months

    if len(months) < 2:
        return {
            "points": [],
            "cagr": None,
            "totalReturnPercent": None,
            "startValue": capital,
            "endValue": capital,
            "years": 0,
            "maxDrawdownPercent": None,
            "worstRolling1YPercent": None,
            "worstRolling5YCagrPercent": None,
            "troughValue": None,
            "troughDate": None,
        }

    # Shares bought at first month
    price_lookup = {
        sym: {m: p for m, p in series} for sym, series in series_map.items()
    }
    start_month = months[0]
    shares: dict[str, float] = {}
    invested_market = 0.0
    for s in market:
        px = price_lookup.get(s["symbol"], {}).get(start_month)
        if not px or px <= 0:
            continue
        sh = s["amount"] / px
        shares[s["symbol"]] = sh
        invested_market += s["amount"]

    # If some symbols missing at start, park leftover in savings
    leftover = sum(s["amount"] for s in market) - invested_market
    cash = savings_amount + max(0.0, leftover)
    monthly_savings_rate = (1 + savings_rate) ** (1 / 12) - 1

    points = []
    peak = capital
    max_dd = 0.0
    trough_value = None
    trough_date = None
    for i, month in enumerate(months):
        market_val = 0.0
        for sym, sh in shares.items():
            px = price_lookup.get(sym, {}).get(month)
            if px:
                market_val += sh * px
        # Compound savings from start
        cash_val = cash * ((1 + monthly_savings_rate) ** i)
        total = market_val + cash_val
        peak = max(peak, total)
        if peak > 0:
            dd = (peak - total) / peak
            if dd >= max_dd:
                max_dd = dd
                trough_value = total
                trough_date = f"{month}-01"
        points.append(
            {
                "date": f"{month}-01",
                "value": round(total, 2),
                "isForecast": False,
            }
        )

    start_val = points[0]["value"]
    end_val = points[-1]["value"]
    years = max((len(points) - 1) / 12.0, 0.01)
    cagr = (end_val / start_val) ** (1 / years) - 1 if start_val > 0 else None
    total_ret = (end_val / start_val - 1) if start_val > 0 else None

    # Worst rolling 1y total return and 5y CAGR from the equity curve
    worst_1y = None
    worst_5y_cagr = None
    values = [p["value"] for p in points]
    for i in range(len(values)):
        if i + 12 < len(values) and values[i] > 0:
            r1 = values[i + 12] / values[i] - 1
            worst_1y = r1 if worst_1y is None else min(worst_1y, r1)
        if i + 60 < len(values) and values[i] > 0:
            r5 = (values[i + 60] / values[i]) ** (1 / 5) - 1
            worst_5y_cagr = r5 if worst_5y_cagr is None else min(worst_5y_cagr, r5)

    return {
        "points": points,
        "cagr": round(cagr * 100, 2) if cagr is not None else None,
        "totalReturnPercent": round(total_ret * 100, 2) if total_ret is not None else None,
        "startValue": round(start_val, 2),
        "endValue": round(end_val, 2),
        "years": round(years, 1),
        "maxDrawdownPercent": round(max_dd * 100, 1),
        "worstRolling1YPercent": round(worst_1y * 100, 2) if worst_1y is not None else None,
        "worstRolling5YCagrPercent": round(worst_5y_cagr * 100, 2)
        if worst_5y_cagr is not None
        else None,
        "troughValue": round(trough_value, 2) if trough_value is not None else None,
        "troughDate": trough_date,
    }


def _estimate_yield(symbol: str) -> float:
    """
    Return annual yield as a fraction (0.004 = 0.4%).

    Yahoo's `dividendYield` is often percent-points (0.32 means 0.32%), while
    `trailingAnnualDividendYield` / `yield` are usually true fractions.
    Prefer rate÷price when available.
    """
    try:
        import yfinance as yf

        info = yf.Ticker(symbol).info or {}
        price = float(info.get("regularMarketPrice") or info.get("currentPrice") or 0)

        def sane(y: float) -> float | None:
            if y is None:
                return None
            y = float(y)
            # Reject nonsense (e.g. 32% on AAPL from mis-scaled fields)
            if 0 < y <= 0.20:
                return y
            return None

        # 1) Trailing yield — usually a true fraction
        tay = info.get("trailingAnnualDividendYield")
        if tay is not None:
            got = sane(float(tay))
            if got is not None:
                return got

        # 2) Annual dividend $ / price
        rate = info.get("dividendRate") or info.get("trailingAnnualDividendRate")
        if rate and price > 0:
            got = sane(float(rate) / price)
            if got is not None:
                return got

        # 3) ETF-style `yield` — usually a true fraction (0.03 = 3%)
        raw_yield = info.get("yield")
        if raw_yield is not None:
            y = float(raw_yield)
            if y > 1:
                y /= 100.0
            got = sane(y)
            if got is not None:
                return got

        # 4) Yahoo `dividendYield` is typically percent-points (0.32 = 0.32%, 3 = 3%)
        dy = info.get("dividendYield")
        if dy is not None:
            got = sane(float(dy) / 100.0)
            if got is not None:
                return got

        return 0.0
    except Exception:
        return 0.0


def _looks_like_ticker(symbol: str | None) -> bool:
    """True for tradeable tickers like AAPL, VUAA.DE — not phrases like Tagesgeld."""
    import re

    if not symbol:
        return False
    s = symbol.strip().upper()
    return bool(re.fullmatch(r"[A-Z0-9]{1,6}(\.[A-Z]{1,3})?", s))


def _enrich_alternate_quote(row: dict[str, Any]) -> None:
    """Attach price / yield / income for an alternate onto the row for inline display."""
    access = row.get("access") or {}
    alt = access.get("alternative")
    if not alt:
        return

    amount = float(row.get("amount") or 0)
    alt_symbol = alt.get("symbol")
    # Prefer alternate when original is hard to buy, or for local cash products
    prefer = access.get("status") in ("unavailable", "limited") or (
        row.get("kind") == "savings" and bool(alt_symbol)
    )

    if not _looks_like_ticker(alt_symbol):
        alt["tradeable"] = False
        row["displaySymbol"] = alt_symbol
        row["displayName"] = alt.get("name") or alt_symbol
        row["displayPrice"] = None
        row["displayShares"] = None
        row["displayYieldPercent"] = row.get("expectedYieldPercent")
        row["displayAnnualIncome"] = row.get("expectedAnnualIncome")
        row["usingAlternate"] = prefer
        return

    try:
        quote = _quote_sync(alt_symbol)
        price = float(quote.get("price") or 0)
        name = quote.get("name") or alt.get("name") or alt_symbol
        yld = _estimate_yield(alt_symbol)
        income = amount * yld
        alt.update(
            {
                "tradeable": True,
                "name": name,
                "price": price,
                "shares": round(amount / price, 4) if price else None,
                "expectedYieldPercent": round(yld * 100, 2),
                "expectedAnnualIncome": round(income, 2),
            }
        )
        if prefer:
            row["displaySymbol"] = alt_symbol
            row["displayName"] = name
            row["displayPrice"] = price or None
            row["displayShares"] = alt["shares"]
            row["displayYieldPercent"] = alt["expectedYieldPercent"]
            row["displayAnnualIncome"] = alt["expectedAnnualIncome"]
            row["usingAlternate"] = True
            row["originalSymbol"] = row.get("symbol")
            row["originalName"] = row.get("name")
        else:
            row["usingAlternate"] = False
    except Exception:
        alt["tradeable"] = False
        if prefer:
            row["displaySymbol"] = alt_symbol
            row["displayName"] = alt.get("name") or alt_symbol
            row["displayPrice"] = None
            row["displayShares"] = None
            row["displayYieldPercent"] = row.get("expectedYieldPercent")
            row["displayAnnualIncome"] = row.get("expectedAnnualIncome")
            row["usingAlternate"] = True
            row["originalSymbol"] = row.get("symbol")
            row["originalName"] = row.get("name")


def _forward_projection(
    capital: float,
    annual_return: float,
    years: int = 5,
) -> list[dict[str, Any]]:
    points = []
    value = capital
    now = datetime.now(timezone.utc)
    monthly = (1 + annual_return) ** (1 / 12) - 1
    for i in range(0, years * 12 + 1):
        year = now.year + (now.month - 1 + i) // 12
        month = (now.month - 1 + i) % 12 + 1
        points.append(
            {
                "date": f"{year:04d}-{month:02d}-01",
                "value": round(value, 2),
                "isForecast": i > 0,
            }
        )
        value *= 1 + monthly
    return points


def _project_sync(
    capital: float, profile_id: str, country_code: str = "US"
) -> dict[str, Any]:
    if capital <= 0:
        raise ValueError("Capital must be greater than 0")
    profile = PROFILES.get(profile_id.lower())
    if not profile:
        raise ValueError(f"Unknown profile: {profile_id}")

    country_code = (country_code or "US").upper()
    country_meta = next(
        (c for c in markets.list_countries() if c["code"] == country_code),
        None,
    )
    if country_meta is None:
        country_code = "US"
        country_meta = next(c for c in markets.list_countries() if c["code"] == "US")

    alloc = profile["allocations"]
    stock_budget = capital * alloc["stocks"]
    etf_budget = capital * alloc["etfs"]
    savings_budget = capital * alloc["savings"]

    allocation_plan: list[dict[str, Any]] = []
    sleeves: list[dict[str, Any]] = []

    dividend_income = 0.0
    interest_income = 0.0

    # Savings sleeve → interest
    if savings_budget > 0:
        annual_income_savings = savings_budget * SAVINGS_ANNUAL_RATE
        interest_income += annual_income_savings
        access = markets.resolve_access("HYSA", country_code)
        allocation_plan.append(
            {
                "kind": "savings",
                "symbol": "HYSA",
                "name": "High-yield savings",
                "role": "Cash / emergency buffer",
                "amount": round(savings_budget, 2),
                "percent": round(alloc["savings"] * 100, 1),
                "expectedYieldPercent": round(SAVINGS_ANNUAL_RATE * 100, 2),
                "expectedAnnualIncome": round(annual_income_savings, 2),
                "incomeType": "interest",
                "access": access,
            }
        )
        sleeves.append(
            {"symbol": "HYSA", "amount": savings_budget, "kind": "savings"}
        )

    for kind, budget in (("stocks", stock_budget), ("etfs", etf_budget)):
        for h in profile["holdings"][kind]:
            amount = budget * h["weight"]
            if amount <= 0:
                continue
            try:
                quote = _quote_sync(h["symbol"])
                name = quote.get("name") or h["symbol"]
                price = quote.get("price") or 0
            except Exception:
                name = h["symbol"]
                price = 0
            yld = _estimate_yield(h["symbol"])
            income = amount * yld
            dividend_income += income
            access = markets.resolve_access(h["symbol"], country_code)
            allocation_plan.append(
                {
                    "kind": kind[:-1] if kind.endswith("s") else kind,  # stock/etf
                    "symbol": h["symbol"],
                    "name": name,
                    "role": h["role"],
                    "amount": round(amount, 2),
                    "percent": round((amount / capital) * 100, 1),
                    "price": price,
                    "shares": round(amount / price, 4) if price else None,
                    "expectedYieldPercent": round(yld * 100, 2),
                    "expectedAnnualIncome": round(income, 2),
                    "incomeType": "dividend",
                    "access": access,
                }
            )
            sleeves.append({"symbol": h["symbol"], "amount": amount, "kind": kind[:-1]})

    # Enrich alternates with live price / yield so the UI can show them inline
    for row in allocation_plan:
        _enrich_alternate_quote(row)

    backtest = _backtest_portfolio(capital, sleeves, SAVINGS_ANNUAL_RATE)

    # Use backtest CAGR when available, else blend profile defaults
    default_returns = {
        "safe": 0.05,
        "balanced": 0.08,
        "growth": 0.11,
        "aggressive": 0.14,
    }
    hist_cagr = (backtest["cagr"] / 100.0) if backtest.get("cagr") is not None else None
    # Cap forward expectation for sanity
    expected_return = hist_cagr if hist_cagr is not None else default_returns[profile["id"]]
    expected_return = max(-0.05, min(0.25, expected_return))

    total_income = dividend_income + interest_income
    income_percent = (total_income / capital) * 100 if capital else 0
    dividend_percent = (dividend_income / capital) * 100 if capital else 0
    interest_percent = (interest_income / capital) * 100 if capital else 0

    # Total expected return = income yield + price appreciation
    # Appreciation is residual after cash income (floored at 0 for display clarity
    # when income yield exceeds modeled total return).
    appreciation_percent = max(0.0, expected_return * 100 - income_percent)
    appreciation_dollars = capital * (appreciation_percent / 100.0)
    total_return_dollars = expected_return * capital

    # "Extra income" narrative: total expected dollars vs parking 100% in savings
    all_savings_income = capital * SAVINGS_ANNUAL_RATE
    growth_premium = total_return_dollars - all_savings_income

    forward = _forward_projection(capital, expected_return, years=5)
    forward_end = forward[-1]["value"] if forward else capital

    # --- Worst-case scenario (stress) ---
    # Take the more pessimistic of: profile floor, worst rolling 5Y CAGR,
    # and a drawdown-haircut on the base return. Always keep it below base.
    max_dd_pct = backtest.get("maxDrawdownPercent") or 0
    default_worst_returns = {
        "safe": -0.02,
        "balanced": -0.05,
        "growth": -0.10,
        "aggressive": -0.15,
    }
    worst_hist = backtest.get("worstRolling5YCagrPercent")
    dd_haircut = expected_return - (max(max_dd_pct, 15) / 100.0) * 0.45
    candidates = [default_worst_returns[profile["id"]], dd_haircut]
    if worst_hist is not None:
        candidates.append(worst_hist / 100.0)
    worst_return = min(candidates)
    # Cap: not above base minus 2pp, not below -35%
    worst_return = max(-0.35, min(expected_return - 0.02, worst_return))

    # Stress income: dividends cut ~40%, savings rate falls to 1.5%
    STRESSED_SAVINGS_RATE = 0.015
    DIVIDEND_CUT = 0.60
    worst_dividend = dividend_income * DIVIDEND_CUT
    worst_interest = savings_budget * STRESSED_SAVINGS_RATE
    worst_income = worst_dividend + worst_interest
    worst_income_percent = (worst_income / capital) * 100 if capital else 0
    worst_appreciation_percent = worst_return * 100 - worst_income_percent
    # In deep stress, appreciation can be largely negative
    worst_appreciation_dollars = capital * (worst_appreciation_percent / 100.0)
    worst_total_dollars = capital * worst_return

    crash_value = capital * (1 - max_dd_pct / 100.0)
    worst_1y = backtest.get("worstRolling1YPercent")

    worst_forward = _forward_projection(capital, worst_return, years=5)
    worst_forward_end = worst_forward[-1]["value"] if worst_forward else capital

    # Merge base + worst into chart points (dual series for UI)
    for i, pt in enumerate(forward):
        if i < len(worst_forward):
            pt["worstValue"] = worst_forward[i]["value"]
    for pt in backtest.get("points") or []:
        pt["worstValue"] = None

    plain_summary = (
        f"With ${capital:,.0f} in the {profile['name']} profile, expected yearly cash income is "
        f"about ${total_income:,.0f} ({income_percent:.1f}%): "
        f"${dividend_income:,.0f} from dividends and ${interest_income:,.0f} from savings interest. "
        f"On top of that, price appreciation is estimated around ${appreciation_dollars:,.0f}/year "
        f"({appreciation_percent:.1f}%), for a total expected return near {expected_return * 100:.1f}% "
        f"(~${total_return_dollars:,.0f}/year). "
        f"Over the last {backtest.get('years') or 10} years this mix’s CAGR was "
        f"{backtest.get('cagr', 'n/a')}%. In 5 years at that pace, value could reach about "
        f"${forward_end:,.0f}. "
        f"Worst case: a similar historical rough patch showed about "
        f"{worst_return * 100:.1f}%/year, with cash income stressed to ~${worst_income:,.0f}/year "
        f"and a peak-to-trough dip near {max_dd_pct}%."
    )

    unavailable = [
        row
        for row in allocation_plan
        if row.get("access", {}).get("status") == "unavailable"
    ]
    limited = [
        row
        for row in allocation_plan
        if row.get("access", {}).get("status") == "limited"
    ]

    return {
        "capital": capital,
        "country": country_meta,
        "profile": {
            "id": profile["id"],
            "name": profile["name"],
            "riskLevel": profile["riskLevel"],
            "tagline": profile["tagline"],
            "description": profile["description"],
            "allocations": {
                "stocks": round(alloc["stocks"] * 100, 1),
                "etfs": round(alloc["etfs"] * 100, 1),
                "savings": round(alloc["savings"] * 100, 1),
            },
            "expectedIncomeHint": profile["expectedIncomeHint"],
        },
        "summary": {
            "plainLanguage": plain_summary,
            "expectedAnnualIncome": round(total_income, 2),
            "expectedIncomePercent": round(income_percent, 2),
            "dividendIncome": round(dividend_income, 2),
            "dividendIncomePercent": round(dividend_percent, 2),
            "interestIncome": round(interest_income, 2),
            "interestIncomePercent": round(interest_percent, 2),
            "appreciationDollars": round(appreciation_dollars, 2),
            "appreciationPercent": round(appreciation_percent, 2),
            "expectedTotalReturnPercent": round(expected_return * 100, 2),
            "expectedAnnualGrowthDollars": round(total_return_dollars, 2),
            "vsAllSavingsPremium": round(growth_premium, 2),
            "projectedValue5Y": round(forward_end, 2),
            "returnBreakdown": {
                "incomePercent": round(income_percent, 2),
                "appreciationPercent": round(appreciation_percent, 2),
                "totalPercent": round(expected_return * 100, 2),
                "incomeDollars": round(total_income, 2),
                "appreciationDollars": round(appreciation_dollars, 2),
                "totalDollars": round(total_return_dollars, 2),
            },
        },
        "worstCase": {
            "label": "Worst case",
            "description": (
                "Stress path using the worst historical 5-year stretch for this mix "
                "(or a profile floor), with dividends cut ~40% and savings rates at 1.5%."
            ),
            "annualReturnPercent": round(worst_return * 100, 2),
            "annualReturnDollars": round(worst_total_dollars, 2),
            "annualIncome": round(worst_income, 2),
            "annualIncomePercent": round(worst_income_percent, 2),
            "dividendIncome": round(worst_dividend, 2),
            "interestIncome": round(worst_interest, 2),
            "appreciationDollars": round(worst_appreciation_dollars, 2),
            "appreciationPercent": round(worst_appreciation_percent, 2),
            "maxDrawdownPercent": max_dd_pct,
            "crashPortfolioValue": round(crash_value, 2),
            "worstRolling1YPercent": worst_1y,
            "worstRolling5YCagrPercent": backtest.get("worstRolling5YCagrPercent"),
            "troughValue": backtest.get("troughValue"),
            "troughDate": backtest.get("troughDate"),
            "projectedValue5Y": round(worst_forward_end, 2),
            "returnBreakdown": {
                "incomePercent": round(worst_income_percent, 2),
                "appreciationPercent": round(worst_appreciation_percent, 2),
                "totalPercent": round(worst_return * 100, 2),
                "incomeDollars": round(worst_income, 2),
                "appreciationDollars": round(worst_appreciation_dollars, 2),
                "totalDollars": round(worst_total_dollars, 2),
            },
        },
        "allocationPlan": sorted(
            allocation_plan, key=lambda x: x["amount"], reverse=True
        ),
        "accessSummary": {
            "unavailableCount": len(unavailable),
            "limitedCount": len(limited),
            "unavailableSymbols": [r["symbol"] for r in unavailable],
            "limitedSymbols": [r["symbol"] for r in limited],
            "hint": country_meta.get("notes"),
            "savingsNote": country_meta.get("savingsNote"),
        },
        "backtest": backtest,
        "forecast": {
            "years": 5,
            "points": forward,
            "assumedAnnualReturnPercent": round(expected_return * 100, 2),
            "worstAssumedAnnualReturnPercent": round(worst_return * 100, 2),
        },
        "disclaimer": (
            "Educational estimate only. Past performance does not guarantee future results. "
            "Income = dividends + savings interest; appreciation is the rest of expected total return. "
            "Worst case is a stress estimate, not a guarantee of the floor. "
            "Broker availability is guidance only — confirm with your broker before buying. "
            "Not financial advice."
        ),
    }


async def get_profiles() -> list[dict[str, Any]]:
    return list_profiles()


async def get_countries() -> list[dict[str, Any]]:
    return markets.list_countries()


async def project_wealth(
    capital: float, profile_id: str, country_code: str = "US"
) -> dict[str, Any]:
    return await _run(_project_sync, capital, profile_id, country_code)
