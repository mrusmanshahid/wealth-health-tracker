"""Yahoo Finance client via yfinance (handles cookies/crumb reliably)."""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any

import yfinance as yf

SECTOR_LEADERS = {
    "Technology": ["AAPL", "MSFT", "NVDA", "GOOGL"],
    "Healthcare": ["UNH", "JNJ", "LLY", "PFE"],
    "Financial": ["JPM", "BAC", "V", "MA"],
    "Consumer": ["AMZN", "TSLA", "HD", "MCD"],
    "Energy": ["XOM", "CVX", "COP", "SLB"],
    "Industrial": ["CAT", "BA", "HON", "UPS"],
}

_executor = ThreadPoolExecutor(max_workers=8)


def is_crypto(symbol: str) -> bool:
    upper = symbol.upper()
    return (
        "-USD" in upper
        or "BTC" in upper
        or "ETH" in upper
        or "DOGE" in upper
        or "SHIB" in upper
        or "XRP" in upper
        or upper.endswith("USD")
        or len(symbol) > 5
    )


async def _run(fn, *args, **kwargs):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, lambda: fn(*args, **kwargs))


def _history_sync(symbol: str, years: int) -> dict[str, Any]:
    ticker = yf.Ticker(symbol)
    period = f"{years}y" if years <= 10 else "max"
    hist = ticker.history(period=period, interval="1mo", auto_adjust=False)
    if hist is None or hist.empty:
        raise ValueError(f"No data found for {symbol}")

    history = []
    for idx, row in hist.iterrows():
        close = float(row.get("Close") or 0)
        adj = row.get("Adj Close")
        price = float(adj) if adj is not None and adj == adj else close
        if price <= 0:
            continue
        ts = int(idx.timestamp() * 1000) if hasattr(idx, "timestamp") else 0
        history.append(
            {
                "date": idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)[:10],
                "timestamp": ts,
                "price": price,
                "open": float(row.get("Open") or 0),
                "high": float(row.get("High") or 0),
                "low": float(row.get("Low") or 0),
                "volume": int(row.get("Volume") or 0),
            }
        )

    info: dict[str, Any] = {}
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    fast = getattr(ticker, "fast_info", None)
    current = 0.0
    if fast is not None:
        current = float(getattr(fast, "last_price", None) or 0) or 0.0
    if not current:
        current = float(info.get("regularMarketPrice") or info.get("currentPrice") or 0)
    if not current and history:
        current = history[-1]["price"]

    return {
        "symbol": symbol.upper(),
        "name": info.get("longName") or info.get("shortName") or symbol.upper(),
        "currency": info.get("currency") or "USD",
        "currentPrice": current,
        "history": history,
    }


def _quote_sync(symbol: str) -> dict[str, Any]:
    ticker = yf.Ticker(symbol)
    info: dict[str, Any] = {}
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    fast = getattr(ticker, "fast_info", None)
    price = 0.0
    prev_close = 0.0
    if fast is not None:
        price = float(getattr(fast, "last_price", None) or 0) or 0.0
        prev_close = float(getattr(fast, "previous_close", None) or 0) or 0.0

    price = price or float(info.get("regularMarketPrice") or info.get("currentPrice") or 0)
    prev_close = prev_close or float(
        info.get("regularMarketPreviousClose") or info.get("previousClose") or 0
    )
    change = float(info.get("regularMarketChange") or 0)
    change_pct = float(info.get("regularMarketChangePercent") or 0)
    if not change and price and prev_close:
        change = price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0

    if not price:
        raise ValueError(f"Error fetching quote for {symbol}")

    return {
        "symbol": (info.get("symbol") or symbol).upper(),
        "name": info.get("longName") or info.get("shortName") or symbol,
        "price": price,
        "previousClose": prev_close,
        "change": change,
        "changePercent": change_pct,
        "currency": info.get("currency") or "USD",
        "dayHigh": float(info.get("dayHigh") or info.get("regularMarketDayHigh") or 0),
        "dayLow": float(info.get("dayLow") or info.get("regularMarketDayLow") or 0),
        "fiftyTwoWeekHigh": float(info.get("fiftyTwoWeekHigh") or 0),
        "fiftyTwoWeekLow": float(info.get("fiftyTwoWeekLow") or 0),
        "volume": int(info.get("volume") or info.get("regularMarketVolume") or 0),
        "avgVolume": int(
            info.get("averageVolume")
            or info.get("averageDailyVolume10Day")
            or info.get("averageVolume10days")
            or 0
        ),
        "marketCap": int(info.get("marketCap") or 0),
        "peRatio": float(info.get("trailingPE") or info.get("forwardPE") or 0) or 0,
        "exchange": info.get("exchange") or "",
        "quoteType": info.get("quoteType") or "",
    }


def _search_sync(query: str) -> list[dict[str, Any]]:
    try:
        result = yf.Search(query, max_results=10, news_count=0)
    except Exception:
        return []
    quotes = result.quotes or []
    out = []
    for q in quotes:
        qtype = q.get("quoteType")
        if qtype not in ("EQUITY", "ETF", "MUTUALFUND"):
            continue
        out.append(
            {
                "symbol": q.get("symbol"),
                "name": q.get("longname") or q.get("shortname") or q.get("symbol"),
                "exchange": q.get("exchange"),
                "type": qtype,
            }
        )
    return out


def _insights_sync(symbol: str) -> dict[str, Any] | None:
    ticker = yf.Ticker(symbol)
    try:
        info = ticker.info or {}
    except Exception:
        return None
    if not info:
        return None

    def money(val: Any) -> str:
        if val is None:
            return "N/A"
        try:
            return f"${float(val):.2f}"
        except (TypeError, ValueError):
            return "N/A"

    target = info.get("targetMeanPrice")
    recommendation = info.get("recommendationKey") or info.get("averageAnalystRating") or "N/A"

    metrics = {
        "valuation": info.get("quoteType") or "N/A",
        "discount": "N/A",
        "targetPrice": money(target) if target else "N/A",
        "rating": str(recommendation),
        "provider": "Yahoo Finance",
        "support": "N/A",
        "resistance": "N/A",
        "stopLoss": "N/A",
        "innovativeness": "N/A",
        "hiring": "N/A",
        "sustainability": "N/A",
        "insiderSentiment": "N/A",
        "earningsReports": "N/A",
        "dividends": f"{(info.get('dividendYield') or 0) * 100:.2f}%"
        if info.get("dividendYield")
        else "N/A",
        "sector": info.get("sector") or "N/A",
    }

    outlook = {
        "shortTerm": {"direction": "N/A", "score": "N/A", "description": "N/A"},
        "midTerm": {"direction": "N/A", "score": "N/A", "description": "N/A"},
        "longTerm": {"direction": "N/A", "score": "N/A", "description": "N/A"},
    }

    return {
        "symbol": symbol.upper(),
        "metrics": metrics,
        "outlook": outlook,
        "recommendation": {
            "targetPrice": target,
            "rating": recommendation,
            "provider": "Yahoo Finance",
        },
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
    }


def _map_screener_quote(q: dict[str, Any], category: str) -> dict[str, Any]:
    return {
        "symbol": q.get("symbol"),
        "name": q.get("shortName") or q.get("longName") or q.get("symbol"),
        "price": q.get("regularMarketPrice") or 0,
        "change": q.get("regularMarketChange") or 0,
        "changePercent": q.get("regularMarketChangePercent") or 0,
        "volume": q.get("regularMarketVolume") or 0,
        "marketCap": q.get("marketCap") or 0,
        "category": category,
    }


def _screen_quotes(scr_id: str, count: int = 15) -> list[dict[str, Any]]:
    try:
        data = yf.screen(scr_id, count=count)
    except Exception:
        return []
    if not isinstance(data, dict):
        return []
    return data.get("quotes") or []


def _movers_sync() -> dict[str, list[dict[str, Any]]]:
    gainers = [
        _map_screener_quote(q, "gainer")
        for q in _screen_quotes("day_gainers", 15)
        if q.get("symbol") and not is_crypto(q["symbol"]) and q.get("quoteType") == "EQUITY"
    ][:5]
    active = [
        _map_screener_quote(q, "active")
        for q in _screen_quotes("most_actives", 15)
        if q.get("symbol") and not is_crypto(q["symbol"]) and q.get("quoteType") == "EQUITY"
    ][:5]
    return {"gainers": gainers, "active": active}


def _undervalued_sync() -> list[dict[str, Any]]:
    stocks = []
    for q in _screen_quotes("undervalued_large_caps", 10):
        if not q.get("symbol") or is_crypto(q["symbol"]) or q.get("quoteType") != "EQUITY":
            continue
        price = q.get("regularMarketPrice") or 0
        high = q.get("fiftyTwoWeekHigh") or 0
        stocks.append(
            {
                "symbol": q.get("symbol"),
                "name": q.get("shortName") or q.get("longName") or q.get("symbol"),
                "price": price,
                "change": q.get("regularMarketChange") or 0,
                "changePercent": q.get("regularMarketChangePercent") or 0,
                "volume": q.get("regularMarketVolume") or 0,
                "marketCap": q.get("marketCap") or 0,
                "peRatio": q.get("trailingPE") or q.get("forwardPE"),
                "fiftyTwoWeekLow": q.get("fiftyTwoWeekLow") or 0,
                "fiftyTwoWeekHigh": high,
                "category": "undervalued",
                "discountFromHigh": f"{((high - price) / high * 100):.1f}" if high > 0 else 0,
            }
        )
        if len(stocks) >= 6:
            break
    return stocks


def _growth_sync() -> list[dict[str, Any]]:
    return [
        _map_screener_quote(q, "growth")
        for q in _screen_quotes("growth_technology_stocks", 10)
        if q.get("symbol") and not is_crypto(q["symbol"]) and q.get("quoteType") == "EQUITY"
    ][:6]


def _trending_sync() -> list[dict[str, Any]]:
    # Yahoo trending endpoint is flaky; most-actives is a solid stand-in
    quotes = [
        q
        for q in _screen_quotes("most_actives", 20)
        if q.get("symbol") and not is_crypto(q["symbol"]) and len(q["symbol"]) <= 5
    ][:8]
    results = []
    for q in quotes:
        try:
            results.append(_quote_sync(q["symbol"]))
        except Exception:
            results.append(_map_screener_quote(q, "trending"))
    return results


def _sectors_sync() -> list[dict[str, Any]]:
    sectors = []
    for sector, symbols in SECTOR_LEADERS.items():
        try:
            quote = _quote_sync(symbols[0])
            sectors.append({**quote, "sector": sector, "allSymbols": symbols})
        except Exception:
            continue
    return sectors


def _recommendations_sync(symbol: str) -> list[dict[str, Any]]:
    # Use search peers for the symbol name / ticker
    try:
        result = yf.Search(symbol, max_results=8, news_count=0)
        peers = [
            q
            for q in (result.quotes or [])
            if q.get("symbol")
            and q.get("symbol").upper() != symbol.upper()
            and q.get("quoteType") in ("EQUITY", "ETF")
            and not is_crypto(q["symbol"])
        ][:5]
    except Exception:
        peers = []

    out = []
    for i, peer in enumerate(peers):
        try:
            quote = _quote_sync(peer["symbol"])
            out.append({**quote, "score": peer.get("score") or (1 - i * 0.1)})
        except Exception:
            continue
    return out


def _news_article(article: dict[str, Any], symbol: str) -> dict[str, Any]:
    return {**article, "relatedSymbol": symbol}


def _stock_news_sync(symbols: list[str]) -> list[dict[str, Any]]:
    flat: list[dict[str, Any]] = []
    for symbol in symbols[:5]:
        try:
            result = yf.Search(symbol, max_results=0, news_count=5)
            for article in result.news or []:
                flat.append(_news_article(article, symbol))
        except Exception:
            continue

    unique: list[dict[str, Any]] = []
    seen: set[str] = set()
    for article in flat:
        title = article.get("title")
        if title and title not in seen:
            seen.add(title)
            unique.append(article)
    unique.sort(key=lambda a: a.get("providerPublishTime") or 0, reverse=True)
    return unique[:10]


def _single_news_sync(symbol: str, count: int) -> list[dict[str, Any]]:
    try:
        result = yf.Search(symbol, max_results=0, news_count=count)
    except Exception:
        return []

    articles = []
    for article in result.news or []:
        published = article.get("providerPublishTime")
        thumbnail = None
        resolutions = (article.get("thumbnail") or {}).get("resolutions") or []
        if resolutions:
            thumbnail = resolutions[0].get("url")
        articles.append(
            {
                "title": article.get("title"),
                "link": article.get("link"),
                "publisher": article.get("publisher"),
                "publishedAt": datetime.fromtimestamp(published, tz=timezone.utc).isoformat()
                if published
                else None,
                "thumbnail": thumbnail,
                "relatedSymbol": symbol,
            }
        )
    return articles


async def fetch_stock_history(symbol: str, years: int = 10) -> dict[str, Any]:
    return await _run(_history_sync, symbol, years)


async def fetch_stock_quote(symbol: str) -> dict[str, Any]:
    return await _run(_quote_sync, symbol)


async def search_stocks(query: str) -> list[dict[str, Any]]:
    return await _run(_search_sync, query)


async def fetch_quarterly_earnings(symbol: str) -> dict[str, Any] | None:
    return await _run(_insights_sync, symbol)


async def fetch_trending_stocks() -> list[dict[str, Any]]:
    return await _run(_trending_sync)


async def fetch_market_movers() -> dict[str, list[dict[str, Any]]]:
    return await _run(_movers_sync)


async def fetch_sector_stocks() -> list[dict[str, Any]]:
    return await _run(_sectors_sync)


async def fetch_undervalued_stocks() -> list[dict[str, Any]]:
    return await _run(_undervalued_sync)


async def fetch_growth_stocks() -> list[dict[str, Any]]:
    return await _run(_growth_sync)


async def fetch_stock_recommendations(symbol: str) -> list[dict[str, Any]]:
    return await _run(_recommendations_sync, symbol)


async def fetch_stock_news(symbols: list[str]) -> list[dict[str, Any]]:
    return await _run(_stock_news_sync, symbols)


async def fetch_single_stock_news(symbol: str, count: int = 5) -> list[dict[str, Any]]:
    return await _run(_single_news_sync, symbol, count)


HIGH_PERFORMING_ETF_UNIVERSE = [
    "VOO",
    "VTI",
    "QQQ",
    "SPY",
    "IVV",
    "VUG",
    "VGT",
    "XLK",
    "SMH",
    "SCHD",
    "VYM",
    "VIG",
    "JEPI",
    "VXUS",
    "VT",
    "IWM",
    "DIA",
    "XLF",
    "VNQ",
    "SOXX",
]


def _cagr_from_history(history: list[dict[str, Any]], years: float) -> float | None:
    if not history or years <= 0:
        return None
    # Approximate N months back
    months = int(years * 12)
    if len(history) < max(months // 2, 3):
        return None
    end = history[-1]["price"]
    start_idx = max(0, len(history) - months)
    start = history[start_idx]["price"]
    if start <= 0 or end <= 0:
        return None
    actual_years = max((len(history) - start_idx) / 12.0, 0.25)
    return (end / start) ** (1 / actual_years) - 1


def _high_performing_etfs_sync() -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for symbol in HIGH_PERFORMING_ETF_UNIVERSE:
        try:
            quote = _quote_sync(symbol)
            hist = _history_sync(symbol, 10)
            history = hist.get("history") or []
            ret_1y = _cagr_from_history(history, 1)
            ret_5y = _cagr_from_history(history, 5)
            ret_10y = _cagr_from_history(history, 10)
            score = ret_5y if ret_5y is not None else ret_1y
            if score is None:
                continue
            results.append(
                {
                    **quote,
                    "category": "etf",
                    "return1Y": round(ret_1y * 100, 2) if ret_1y is not None else None,
                    "return5Y": round(ret_5y * 100, 2) if ret_5y is not None else None,
                    "return10Y": round(ret_10y * 100, 2) if ret_10y is not None else None,
                    "performanceScore": round(score * 100, 2),
                }
            )
        except Exception:
            continue

    results.sort(key=lambda x: x.get("performanceScore") or -999, reverse=True)
    return results[:10]


async def fetch_high_performing_etfs() -> list[dict[str, Any]]:
    return await _run(_high_performing_etfs_sync)
