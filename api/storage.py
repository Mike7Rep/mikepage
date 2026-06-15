from __future__ import annotations

import json
import sqlite3
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Optional

from .config import Settings, get_settings


def connect(settings: Optional[Settings] = None) -> sqlite3.Connection:
    settings = settings or get_settings()
    Path(settings.db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(settings: Optional[Settings] = None) -> None:
    with connect(settings) as conn:
        conn.executescript(
            """
            create table if not exists runs (
              id integer primary key autoincrement,
              run_date text not null,
              kind text not null,
              status text not null,
              created_at text not null,
              finished_at text,
              unique(run_date, kind)
            );
            create table if not exists reviews (
              id integer primary key autoincrement,
              run_id integer,
              symbol text not null,
              analysis_json text not null,
              decision_json text not null,
              order_json text not null,
              created_at text not null
            );
            """
        )


def create_run(kind: str, run_date: date) -> int:
    now = _now()
    with connect() as conn:
        cur = conn.execute(
            "insert into runs(run_date, kind, status, created_at) values (?, ?, ?, ?)",
            (run_date.isoformat(), kind, "running", now),
        )
        return int(cur.lastrowid)


def existing_run(kind: str, run_date: date) -> Optional[sqlite3.Row]:
    with connect() as conn:
        return conn.execute(
            "select * from runs where run_date = ? and kind = ?",
            (run_date.isoformat(), kind),
        ).fetchone()


def finish_run(run_id: int, status: str) -> None:
    with connect() as conn:
        conn.execute(
            "update runs set status = ?, finished_at = ? where id = ?",
            (status, _now(), run_id),
        )


def save_review(run_id: Optional[int], symbol: str, analysis: Any, decision: Any, order: Any) -> None:
    with connect() as conn:
        conn.execute(
            """
            insert into reviews(run_id, symbol, analysis_json, decision_json, order_json, created_at)
            values (?, ?, ?, ?, ?, ?)
            """,
            (
                run_id,
                symbol,
                _dump(analysis),
                _dump(decision),
                _dump(order),
                _now(),
            ),
        )


def latest_reviews(limit: int = 12) -> list[dict]:
    with connect() as conn:
        rows = conn.execute(
            "select * from reviews order by created_at desc limit ?", (limit,)
        ).fetchall()
    return [_review_row(row) for row in rows]


def _review_row(row: sqlite3.Row) -> dict:
    return {
        "symbol": row["symbol"],
        "analysis": json.loads(row["analysis_json"]),
        "decision": json.loads(row["decision_json"]),
        "order": json.loads(row["order_json"]),
        "createdAt": row["created_at"],
    }


def _dump(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    return json.dumps(value, ensure_ascii=True)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
