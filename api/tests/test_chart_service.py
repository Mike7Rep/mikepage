from datetime import date

import pytest

from api import chart_service


@pytest.mark.asyncio
async def test_asset_chart_refreshes_postgres_cache_on_miss(monkeypatch):
    raw_bar = {
        "t": "2026-06-17T00:00:00Z",
        "o": 10,
        "h": 12,
        "l": 9,
        "c": 11,
        "v": 1000,
    }
    cached_bar = {
        "date": "2026-06-17",
        "open": 10,
        "high": 12,
        "low": 9,
        "close": 11,
        "volume": 1000,
        "updatedAt": "2026-06-17T12:00:00+00:00",
    }
    cache_reads = []
    upserts = []

    def fake_cached(symbol, start, end):
        cache_reads.append((symbol, start, end))
        return [] if len(cache_reads) == 1 else [cached_bar]

    def fake_upsert(symbol, bars):
        upserts.append((symbol, bars))

    monkeypatch.setattr(chart_service, "get_cached_asset_bars", fake_cached)
    monkeypatch.setattr(chart_service, "upsert_asset_bars", fake_upsert)
    monkeypatch.setattr(chart_service, "datetime", FixedDatetime)

    result = await chart_service.get_asset_chart("aapl", FakeClient(raw_bar))

    assert result.symbol == "AAPL"
    assert result.bars[0].close == 11
    assert upserts == [("AAPL", [raw_bar])]


@pytest.mark.asyncio
async def test_asset_chart_calculates_fifo_average_entry_price_series(monkeypatch):
    cached_bars = [_cached_bar(day, close) for day, close in [
        ("2026-06-13", 100),
        ("2026-06-14", 150),
        ("2026-06-15", 200),
        ("2026-06-16", 175),
        ("2026-06-17", 50),
    ]]
    fills = [
        _fill("buy-1", "buy", "2026-06-13T10:00:00Z", "10", "100"),
        _fill("buy-2", "buy", "2026-06-14T10:00:00Z", "10", "200"),
        _fill("sell-1", "sell", "2026-06-15T10:00:00Z", "10", "250"),
        _fill("sell-2", "sell", "2026-06-16T10:00:00Z", "10", "260"),
        _fill("buy-3", "buy", "2026-06-17T10:00:00Z", "5", "50"),
    ]

    monkeypatch.setattr(chart_service, "get_cached_asset_bars", lambda *_: cached_bars)
    monkeypatch.setattr(chart_service, "upsert_asset_bars", lambda *_: None)
    monkeypatch.setattr(chart_service, "datetime", FixedDatetime)

    result = await chart_service.get_asset_chart(
        "aapl", FakeClient(raw_bars=[], fills=fills, avg_entry_price=None)
    )

    assert [bar.averageEntryPrice for bar in result.bars] == [100, 150, 200, None, 50]
    assert result.averageEntryPrice == 50


class FixedDatetime:
    @classmethod
    def now(cls, tz=None):
        from datetime import datetime

        return datetime(2026, 6, 17, tzinfo=tz)

    @classmethod
    def fromisoformat(cls, value):
        from datetime import datetime

        return datetime.fromisoformat(value)


class FakeClient:
    def __init__(self, raw_bar=None, raw_bars=None, fills=None, avg_entry_price="10"):
        self.raw_bars = raw_bars if raw_bars is not None else [raw_bar]
        self.fills = fills or []
        self.avg_entry_price = avg_entry_price

    async def get_account(self):
        return {"currency": "USD"}

    async def get_positions(self):
        if self.avg_entry_price is None:
            return []
        return [{"symbol": "AAPL", "avg_entry_price": str(self.avg_entry_price)}]

    async def get_asset(self, symbol):
        return {"name": f"{symbol} Inc."}

    async def get_stock_bars(self, symbols, start, end=None):
        assert symbols == ["AAPL"]
        assert start == date(2024, 6, 17).isoformat()
        assert end == date(2026, 6, 17).isoformat()
        return {"bars": {"AAPL": self.raw_bars}}

    async def get_fill_activities(self, symbol, after):
        return self.fills


def _cached_bar(day, close):
    return {
        "date": day,
        "open": close,
        "high": close,
        "low": close,
        "close": close,
        "volume": 1000,
        "updatedAt": "2026-06-17T12:00:00+00:00",
    }


def _fill(fill_id, side, timestamp, qty, price):
    return {
        "id": fill_id,
        "order_id": fill_id,
        "side": side,
        "transaction_time": timestamp,
        "qty": qty,
        "price": price,
    }
