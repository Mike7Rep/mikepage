from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Optional

from .alpaca import AlpacaClient
from .schemas import AssetChartBar, AssetChartData, AssetChartFill
from .storage import get_cached_asset_bars, upsert_asset_bars


async def get_asset_chart(symbol: str, client: Optional[AlpacaClient] = None) -> AssetChartData:
    client = client or AlpacaClient()
    symbol = symbol.upper()
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=730)
    account = await client.get_account()
    positions = await client.get_positions()
    asset = await client.get_asset(symbol)
    bars = await _bars(symbol, start, end, client)
    fills = await client.get_fill_activities(symbol, start.isoformat())
    position = next((item for item in positions if item.get("symbol") == symbol), None)
    chart_fills = [fill for item in fills if (fill := _fill(item))]
    chart_bars = _bars_with_average_entry_price([_bar(item) for item in bars], chart_fills)
    position_average = _optional_num((position or {}).get("avg_entry_price"))
    latest_average = _latest_average_entry_price(chart_bars)
    if latest_average is None and position_average is not None:
        for bar in chart_bars:
            bar.averageEntryPrice = position_average
        latest_average = position_average
    return AssetChartData(
        symbol=symbol,
        name=asset.get("name") or symbol,
        currency=(account.get("currency") or "USD").upper(),
        periodStart=start.isoformat(),
        periodEnd=end.isoformat(),
        averageEntryPrice=latest_average,
        bars=chart_bars,
        fills=chart_fills,
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


async def _bars(symbol: str, start, end, client: AlpacaClient) -> list[dict]:
    cached = get_cached_asset_bars(symbol, start, end)
    if cached and not _cache_stale(cached, end):
        return [_cached_bar(item) for item in cached]

    bars_data = await client.get_stock_bars([symbol], start.isoformat(), end.isoformat())
    fresh = bars_data.get("bars", {}).get(symbol, [])
    upsert_asset_bars(symbol, fresh)
    cached = get_cached_asset_bars(symbol, start, end)
    return [_cached_bar(item) for item in cached] if cached else fresh


def _cache_stale(cached: list[dict], end) -> bool:
    latest = max(datetime.fromisoformat(item["date"]).date() for item in cached)
    newest_update = max(_aware_datetime(item["updatedAt"]) for item in cached)
    return latest < end - timedelta(days=3) or newest_update < datetime.now(timezone.utc) - timedelta(hours=24)


def _cached_bar(raw: dict) -> dict:
    return {
        "t": raw["date"],
        "o": raw["open"],
        "h": raw["high"],
        "l": raw["low"],
        "c": raw["close"],
        "v": raw["volume"],
    }


def _aware_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


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


def _bars_with_average_entry_price(
    bars: list[AssetChartBar], fills: list[AssetChartFill]
) -> list[AssetChartBar]:
    sorted_bars = sorted(bars, key=lambda item: item.date)
    sorted_fills = sorted(fills, key=lambda item: item.transactionTime or item.date)
    lots: list[list[Decimal]] = []
    fill_index = 0

    for bar in sorted_bars:
        while fill_index < len(sorted_fills) and sorted_fills[fill_index].date <= bar.date:
            _apply_fill(lots, sorted_fills[fill_index])
            fill_index += 1
        bar.averageEntryPrice = _average_lots(lots)

    return sorted_bars


def _apply_fill(lots: list[list[Decimal]], fill: AssetChartFill) -> None:
    qty = _decimal_num(fill.qty)
    price = _decimal_num(fill.price)
    if qty <= 0 or price <= 0:
        return

    if fill.side == "buy":
        lots.append([qty, price])
        return

    remaining = qty
    while remaining > 0 and lots:
        lot_qty = lots[0][0]
        if lot_qty <= remaining:
            remaining -= lot_qty
            lots.pop(0)
        else:
            lots[0][0] = lot_qty - remaining
            remaining = Decimal("0")


def _average_lots(lots: list[list[Decimal]]) -> Optional[float]:
    quantity = sum((lot[0] for lot in lots), Decimal("0"))
    if quantity <= 0:
        return None

    cost = sum((lot[0] * lot[1] for lot in lots), Decimal("0"))
    return round(float(cost / quantity), 6)


def _latest_average_entry_price(bars: list[AssetChartBar]) -> Optional[float]:
    return next(
        (bar.averageEntryPrice for bar in reversed(bars) if bar.averageEntryPrice),
        None,
    )


def _optional_num(value: object) -> Optional[float]:
    number = _num(value)
    return number if number > 0 else None


def _decimal_num(value: object) -> Decimal:
    try:
        return Decimal(str(value or "0"))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal("0")


def _num(value: object) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0
