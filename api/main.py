from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI

from .chart_service import get_asset_chart
from .portfolio import get_portfolio
from .scheduler import start_scheduler
from .schemas import AnalyzeRequest, EvaluateOnceRequest, WeeklyJobRequest
from .security import require_internal_token
from .storage import init_db
from .trading_service import analyze_asset, evaluate_once, evaluate_weekly


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler = start_scheduler()
    yield
    if scheduler:
        scheduler.shutdown(wait=False)


app = FastAPI(title="mikepage trading api", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/api/portfolio", dependencies=[Depends(require_internal_token)])
async def portfolio():
    return await get_portfolio()


@app.post("/api/assets/{symbol}/analyze", dependencies=[Depends(require_internal_token)])
async def analyze(symbol: str, request: Optional[AnalyzeRequest] = None):
    request = request or AnalyzeRequest()
    return await analyze_asset(symbol, execute=request.execute)


@app.post("/api/jobs/evaluate-weekly", dependencies=[Depends(require_internal_token)])
async def weekly_job(request: Optional[WeeklyJobRequest] = None):
    request = request or WeeklyJobRequest()
    return await evaluate_weekly(execute=request.execute, force=request.force)


@app.post("/api/jobs/evaluate-once", dependencies=[Depends(require_internal_token)])
async def one_shot_job(request: Optional[EvaluateOnceRequest] = None):
    request = request or EvaluateOnceRequest()
    return await evaluate_once(
        execute=request.execute,
        max_notional=request.maxNotional,
        max_orders=request.maxOrders,
    )


@app.get("/api/assets/{symbol}/chart", dependencies=[Depends(require_internal_token)])
async def asset_chart(symbol: str):
    return await get_asset_chart(symbol)
