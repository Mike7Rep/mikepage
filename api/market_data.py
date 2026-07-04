from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .alpaca import AlpacaClient
from .indicators import summarize_bars
from .storage import upsert_asset_bars


async def build_asset_context(symbol: str, client: AlpacaClient) -> dict:
    account, positions, asset, open_orders = await _load_core(symbol, client)
    bars = await _load_bars(symbol, asset, client)
    position = next((item for item in positions if item.get("symbol") == symbol), None)
    return {
        "symbol": symbol,
        "account": account,
        "asset": asset,
        "position": position,
        "open_buy_orders": open_orders,
        "technicals": summarize_bars(bars),
    }


async def _load_core(symbol: str, client: AlpacaClient) -> tuple[dict, list, dict, list]:
    account = await client.get_account()
    positions = await client.get_positions()
    asset = await client.get_asset(symbol)
    open_orders = await client.get_open_buy_orders()
    return account, positions, asset, open_orders


async def _load_bars(symbol: str, asset: dict, client: AlpacaClient) -> list[dict]:
    if asset.get("class") != "us_equity":
        return []
    start = (datetime.now(timezone.utc) - timedelta(days=370)).date().isoformat()
    data = await client.get_stock_bars([symbol], start)
    bars = data.get("bars", {}).get(symbol, [])
    upsert_asset_bars(symbol, bars)
    return bars
