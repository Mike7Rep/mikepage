from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional

from .alpaca import AlpacaClient
from .schemas import AssetChartBar, AssetChartData, AssetChartFill


async def get_asset_chart(symbol: str, client: Optional[AlpacaClient] = None) -> AssetChartData:
    client = client or AlpacaClient()
    symbol = symbol.upper()
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=730)
    account, positions, asset, bars_data, fills = await asyncio.gather(
        client.get_account(),
        client.get_positions(),
        client.get_asset(symbol),
        client.get_stock_bars([symbol], start.isoformat(), end.isoformat()),
        client.get_fill_activities(symbol, start.isoformat()),
    )
    position = next((item for item in positions if item.get("symbol") == symbol), None)
    return AssetChartData(
        symbol=symbol,
        name=asset.get("name") or symbol,
        currency=(account.get("currency") or "USD").upper(),
        periodStart=start.isoformat(),
        periodEnd=end.isoformat(),
        averageEntryPrice=_optional_num((position or {}).get("avg_entry_price")),
        bars=[_bar(item) for item in bars_data.get("bars", {}).get(symbol, [])],
        fills=[fill for item in fills if (fill := _fill(item))],
    )


def _bar(raw: dict) -> AssetChartBar:
    return AssetChartBar(
        date=str(raw.get("t", ""))[:10],
        open=_num(raw.get("o")),
        high=_num(raw.get("h")),
        low=_num(raw.get("l")),
        close=_num(raw.get("c")),
        volume=_num(raw.get("v")),
    )


def _fill(raw: dict) -> Optional[AssetChartFill]:
    side = str(raw.get("side", "")).lower()
    if side not in {"buy", "sell"}:
        return None
    qty = _num(raw.get("qty"))
    price = _num(raw.get("price"))
    timestamp = str(raw.get("transaction_time") or raw.get("date") or "")
    return AssetChartFill(
        id=str(raw.get("id") or raw.get("order_id") or timestamp),
        orderId=raw.get("order_id"),
        side=side,
        date=timestamp[:10],
        transactionTime=timestamp,
        qty=qty,
        price=price,
        notional=round(abs(qty * price), 2),
    )


def _optional_num(value: object) -> Optional[float]:
    number = _num(value)
    return number if number > 0 else None


def _num(value: object) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0
