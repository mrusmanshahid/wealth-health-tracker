"""WHEALTH FastAPI app — stock/currency API + optional static frontend."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load local .env before other backend modules read os.environ
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.routers import auth, currency, projector, stocks, userdata

DIST_DIR = Path(__file__).resolve().parent.parent / "dist"

DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8010",
    "http://127.0.0.1:8010",
]

# Comma-separated list, or "*" for any origin (handy on free hosts)
_cors_env = os.getenv("CORS_ORIGINS", "").strip()
if _cors_env == "*":
    ALLOW_ORIGINS = ["*"]
elif _cors_env:
    ALLOW_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    ALLOW_ORIGINS = DEFAULT_ORIGINS

app = FastAPI(title="WHEALTH API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=ALLOW_ORIGINS != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(currency.router)
app.include_router(projector.router)
app.include_router(auth.router)
app.include_router(userdata.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if DIST_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        # Prefer real files under dist (e.g. favicon.svg), else index.html
        candidate = DIST_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / "index.html")
