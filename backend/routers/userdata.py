"""Cloud workspace: portfolio, settings, watchlist, cash, investment plans."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.deps import get_current_user
from backend.models import User, UserWorkspace

router = APIRouter(prefix="/api/user", tags=["user"])

_DEFAULT_CASH = {"balance": 0, "accounts": [], "transactions": []}
_DEFAULT_PLANS: dict[str, Any] = {}


class WorkspacePayload(BaseModel):
    portfolio: list[Any] = Field(default_factory=list)
    settings: dict[str, Any] = Field(default_factory=dict)
    watchlist: list[Any] = Field(default_factory=list)
    cash: dict[str, Any] = Field(default_factory=dict)
    plans: dict[str, Any] = Field(default_factory=dict)


def _workspace_response(ws: UserWorkspace) -> WorkspacePayload:
    return WorkspacePayload(
        portfolio=ws.portfolio or [],
        settings=ws.settings or {},
        watchlist=ws.watchlist or [],
        cash=ws.cash or dict(_DEFAULT_CASH),
        plans=getattr(ws, "plans", None) or dict(_DEFAULT_PLANS),
    )


def _get_or_create_workspace(db: Session, user: User) -> UserWorkspace:
    ws = db.query(UserWorkspace).filter(UserWorkspace.user_id == user.id).first()
    if ws:
        return ws
    ws = UserWorkspace(
        user_id=user.id,
        portfolio=[],
        settings={"currency": "USD", "forecastYears": 5},
        watchlist=[],
        cash=dict(_DEFAULT_CASH),
        plans=dict(_DEFAULT_PLANS),
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


@router.get("/workspace", response_model=WorkspacePayload)
def get_workspace(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ws = _get_or_create_workspace(db, user)
    return _workspace_response(ws)


@router.put("/workspace", response_model=WorkspacePayload)
def put_workspace(
    body: WorkspacePayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ws = _get_or_create_workspace(db, user)
    ws.portfolio = body.portfolio
    ws.settings = body.settings
    ws.watchlist = body.watchlist
    ws.cash = body.cash
    ws.plans = body.plans or {}
    db.commit()
    db.refresh(ws)
    return _workspace_response(ws)
