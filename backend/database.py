"""SQLAlchemy engine + session. Uses DATABASE_URL or local SQLite."""

from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

def _normalize_database_url(url: str) -> str:
    """Force the psycopg2 driver we ship in requirements.txt.

    Neon / SQLAlchemy may hand out postgres:// or postgresql+psycopg:// (v3).
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql+psycopg://"):
        url = "postgresql+psycopg2://" + url[len("postgresql+psycopg://") :]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://") :]
    return url


DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL:
    DATABASE_URL = _normalize_database_url(DATABASE_URL)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
    )
else:
    # Local / free-dev fallback (file next to project)
    sqlite_path = os.getenv("SQLITE_PATH", "./whealth.db")
    engine = create_engine(
        f"sqlite:///{sqlite_path}",
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_workspace_plans_column() -> None:
    """Add plans JSON column on existing DBs (create_all won't alter tables)."""
    from sqlalchemy import inspect, text

    insp = inspect(engine)
    if "user_workspaces" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("user_workspaces")}
    if "plans" in cols:
        return
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(
                text(
                    "ALTER TABLE user_workspaces "
                    "ADD COLUMN plans JSON NOT NULL DEFAULT '{}'::json"
                )
            )
        else:
            conn.execute(text("ALTER TABLE user_workspaces ADD COLUMN plans JSON"))


def init_db() -> None:
    # Import models so metadata is registered
    from backend import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_workspace_plans_column()
