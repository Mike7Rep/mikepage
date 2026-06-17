from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Optional

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from .config import Settings, get_settings


def connect(settings: Optional[Settings] = None) -> psycopg.Connection:
    settings = settings or get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL missing")
    return psycopg.connect(settings.database_url, row_factory=dict_row)


def init_db(settings: Optional[Settings] = None) -> None:
    with connect(settings) as conn:
        with conn.cursor() as cur:
            cur.execute("select 1")


def create_run(kind: str, run_date: date) -> int:
    with connect() as conn:
        row = conn.execute(
            """
            insert into runs(run_date, kind, status, created_at)
            values (%s, %s, %s, %s)
            returning id
            """,
            (run_date, kind, "running", _now()),
        ).fetchone()
    return int(row["id"])


def existing_run(kind: str, run_date: date) -> Optional[dict]:
    with connect() as conn:
        return conn.execute(
            "select * from runs where run_date = %s and kind = %s",
            (run_date, kind),
        ).fetchone()


def finish_run(run_id: int, status: str) -> None:
    with connect() as conn:
        conn.execute(
            "update runs set status = %s, finished_at = %s where id = %s",
            (status, _now(), run_id),
        )


def save_review(run_id: Optional[int], symbol: str, analysis: Any, decision: Any, order: Any) -> None:
    with connect() as conn:
        conn.execute(
            """
            insert into reviews(run_id, symbol, analysis_json, decision_json, order_json, created_at)
            values (%s, %s, %s, %s, %s, %s)
            """,
            (
                run_id,
                symbol,
                Jsonb(_jsonable(analysis)),
                Jsonb(_jsonable(decision)),
                Jsonb(_jsonable(order)),
                _now(),
            ),
        )


def latest_reviews(limit: int = 12) -> list[dict]:
    with connect() as conn:
        rows = conn.execute(
            "select * from reviews order by created_at desc limit %s", (limit,)
        ).fetchall()
    return [_review_row(row) for row in rows]


def get_cached_asset_bars(symbol: str, start: date, end: date) -> list[dict]:
    with connect() as conn:
        rows = conn.execute(
            """
            select symbol, date, open, high, low, close, volume, updated_at
            from asset_price_bars
            where symbol = %s and date >= %s and date <= %s
            order by date asc
            """,
            (symbol.upper(), start, end),
        ).fetchall()
    return [_bar_row(row) for row in rows]


def upsert_asset_bars(symbol: str, bars: list[dict], source: str = "alpaca") -> None:
    if not bars:
        return

    now = _now()
    values = [
        (
            symbol.upper(),
            _parse_bar_date(item.get("t")),
            _decimal(item.get("o")),
            _decimal(item.get("h")),
            _decimal(item.get("l")),
            _decimal(item.get("c")),
            _decimal(item.get("v")),
            source,
            now,
            now,
        )
        for item in bars
        if item.get("t")
    ]

    if not values:
        return

    with connect() as conn:
        conn.executemany(
            """
            insert into asset_price_bars(
              symbol, date, open, high, low, close, volume, source, created_at, updated_at
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            on conflict (symbol, date) do update set
              open = excluded.open,
              high = excluded.high,
              low = excluded.low,
              close = excluded.close,
              volume = excluded.volume,
              source = excluded.source,
              updated_at = excluded.updated_at
            """,
            values,
        )


def _review_row(row: dict) -> dict:
    return {
        "symbol": row["symbol"],
        "analysis": row["analysis_json"],
        "decision": row["decision_json"],
        "order": row["order_json"],
        "createdAt": _iso(row["created_at"]),
    }


def _bar_row(row: dict) -> dict:
    return {
        "date": row["date"].isoformat(),
        "open": float(row["open"]),
        "high": float(row["high"]),
        "low": float(row["low"]),
        "close": float(row["close"]),
        "volume": float(row["volume"]),
        "updatedAt": _iso(row["updated_at"]),
    }


def _jsonable(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    return value


def _parse_bar_date(value: object) -> date:
    return date.fromisoformat(str(value)[:10])


def _decimal(value: object) -> Decimal:
    try:
        return Decimal(str(value or "0"))
    except Exception:
        return Decimal("0")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: object) -> str:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)
