"""Wealth projector API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.services import projector

router = APIRouter(prefix="/api/projector", tags=["projector"])


class ProjectRequest(BaseModel):
    capital: float = Field(..., gt=0, description="Total capital to invest")
    profile: str = Field(
        default="balanced",
        description="safe | balanced | growth | aggressive",
    )
    country: str = Field(
        default="US",
        description="Country code for broker availability (US, UK, DE, PK, ...)",
    )


@router.get("/profiles")
async def profiles():
    return await projector.get_profiles()


@router.get("/countries")
async def countries():
    return await projector.get_countries()


@router.post("/project")
async def project(body: ProjectRequest):
    try:
        return await projector.project_wealth(
            body.capital, body.profile, body.country
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/project")
async def project_get(
    capital: float = Query(..., gt=0),
    profile: str = Query(default="balanced"),
    country: str = Query(default="US"),
):
    try:
        return await projector.project_wealth(capital, profile, country)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
