"""ORM models for auth + user workspace data."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from backend.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    workspace: Mapped[Optional["UserWorkspace"]] = relationship(
        "UserWorkspace",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class UserWorkspace(Base):
    """Portfolio, settings, watchlist, cash, and investment plans (JSON blobs)."""

    __tablename__ = "user_workspaces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    portfolio: Mapped[Any] = mapped_column(JSON, nullable=False, default=list)
    settings: Mapped[Any] = mapped_column(JSON, nullable=False, default=dict)
    watchlist: Mapped[Any] = mapped_column(JSON, nullable=False, default=list)
    cash: Mapped[Any] = mapped_column(JSON, nullable=False, default=dict)
    plans: Mapped[Any] = mapped_column(JSON, nullable=False, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="workspace")
