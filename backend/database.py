"""SQLAlchemy engine + session. Uses DATABASE_URL or local SQLite."""

from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL:
    # Neon / Render sometimes provide postgres:// — SQLAlchemy wants postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
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


def init_db() -> None:
    # Import models so metadata is registered
    from backend import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
