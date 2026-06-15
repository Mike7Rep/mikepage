from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


def _watchlist() -> list[str]:
    raw = os.getenv("AI_WATCHLIST", "")
    return sorted({item.strip().upper() for item in raw.split(",") if item.strip()})


@dataclass(frozen=True)
class Settings:
    alpaca_endpoint: str = os.getenv("ALPACA_ENDPOINT", "").rstrip("/")
    alpaca_key: str = os.getenv("ALPACA_KEY", "")
    alpaca_secret: str = os.getenv("ALPACA_SECRET", "")
    alpaca_data_endpoint: str = os.getenv(
        "ALPACA_DATA_ENDPOINT", "https://data.alpaca.markets"
    ).rstrip("/")
    api_token: str = os.getenv("PYTHON_API_TOKEN", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-5.5")
    ai_mock: bool = _bool("AI_MOCK_RESPONSES", False)
    watchlist: list[str] = None  # type: ignore[assignment]
    trading_enabled: bool = _bool("TRADING_ENABLED", False)
    allow_live_trading: bool = _bool("ALPACA_ALLOW_LIVE_TRADING", False)
    scheduler_enabled: bool = _bool("SCHEDULER_ENABLED", False)
    schedule_timezone: str = os.getenv("SCHEDULE_TIMEZONE", "America/New_York")
    schedule_hour: int = int(os.getenv("SCHEDULE_HOUR", "9"))
    schedule_minute: int = int(os.getenv("SCHEDULE_MINUTE", "45"))
    max_weekly_bp_pct: float = _float("MAX_WEEKLY_BP_PCT", 0.50)
    max_asset_bp_pct: float = _float("MAX_ASSET_BP_PCT", 0.15)
    reserve_bp_pct: float = _float("RESERVE_BP_PCT", 0.05)
    db_path: str = os.getenv("API_DB_PATH", "/data/trading.sqlite3")

    def __post_init__(self) -> None:
        object.__setattr__(self, "watchlist", _watchlist())


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
