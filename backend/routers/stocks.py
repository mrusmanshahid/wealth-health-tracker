"""Stock API routes mirroring the previous client-side Yahoo helpers."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.services import yahoo

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/history/{symbol}")
async def stock_history(symbol: str, years: int = Query(default=10, ge=1, le=30)):
    try:
        return await yahoo.fetch_stock_history(symbol, years)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/quote/{symbol}")
async def stock_quote(symbol: str):
    try:
        return await yahoo.fetch_stock_quote(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/search")
async def stock_search(q: str = Query(..., min_length=1)):
    return await yahoo.search_stocks(q)


@router.get("/insights/{symbol}")
async def stock_insights(symbol: str):
    result = await yahoo.fetch_quarterly_earnings(symbol)
    if result is None:
        raise HTTPException(status_code=404, detail="Could not fetch financial data")
    return result


@router.get("/trending")
async def trending():
    return await yahoo.fetch_trending_stocks()


@router.get("/movers")
async def movers():
    return await yahoo.fetch_market_movers()


@router.get("/sectors")
async def sectors():
    return await yahoo.fetch_sector_stocks()


@router.get("/undervalued")
async def undervalued():
    return await yahoo.fetch_undervalued_stocks()


@router.get("/growth")
async def growth():
    return await yahoo.fetch_growth_stocks()


@router.get("/etfs/high-performing")
async def high_performing_etfs():
    return await yahoo.fetch_high_performing_etfs()


@router.get("/recommendations/{symbol}")
async def recommendations(symbol: str):
    return await yahoo.fetch_stock_recommendations(symbol)


@router.get("/analyst/{symbol}")
async def analyst_consensus(symbol: str):
    try:
        return await yahoo.fetch_stock_analyst(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/fundamentals/{symbol}")
async def fundamentals(symbol: str):
    try:
        return await yahoo.fetch_stock_fundamentals(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/news")
async def news_multi(symbols: str = Query(..., description="Comma-separated symbols")):
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    return await yahoo.fetch_stock_news(symbol_list)


@router.get("/news/{symbol}")
async def news_single(symbol: str, count: int = Query(default=5, ge=1, le=20)):
    return await yahoo.fetch_single_stock_news(symbol, count)
