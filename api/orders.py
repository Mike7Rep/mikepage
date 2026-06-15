from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, status

from .alpaca import AlpacaClient
from .config import Settings, get_settings
from .schemas import OrderDecision, OrderResult


def build_buy_order(symbol: str, decision: OrderDecision) -> dict:
    payload = {
        "symbol": symbol,
        "side": "buy",
        "type": "market",
        "time_in_force": "day",
        "client_order_id": _client_order_id(symbol),
    }
    if not decision.qty:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "whole-share qty missing")
    payload["qty"] = str(decision.qty)
    return payload


async def submit_order(
    symbol: str,
    decision: OrderDecision,
    execute: bool,
    client: AlpacaClient,
    settings: Optional[Settings] = None,
) -> OrderResult:
    settings = settings or get_settings()
    if not decision.should_buy:
        return OrderResult(submitted=False, skipped_reason=decision.reason)
    payload = build_buy_order(symbol, decision)
    if not execute:
        return OrderResult(submitted=False, skipped_reason="dry run", payload=payload)
    if not settings.trading_enabled or not settings.allow_live_trading:
        return OrderResult(submitted=False, skipped_reason="live trading guard disabled", payload=payload)
    order = await client.place_order(payload)
    return OrderResult(submitted=True, order_id=order.get("id"), payload=payload)


def _client_order_id(symbol: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"ai-bh-{stamp}-{symbol}-{uuid4().hex[:8]}"[:128]
