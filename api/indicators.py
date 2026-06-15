from __future__ import annotations

from math import sqrt
from statistics import mean, pstdev
from typing import Optional


def summarize_bars(bars: list[dict]) -> dict:
    closes = [float(bar["c"]) for bar in bars if bar.get("c") is not None]
    highs = [float(bar["h"]) for bar in bars if bar.get("h") is not None]
    lows = [float(bar["l"]) for bar in bars if bar.get("l") is not None]
    if not closes:
        return {"bars": 0}

    return {
        "bars": len(closes),
        "last_close": closes[-1],
        "sma20": _sma(closes, 20),
        "sma50": _sma(closes, 50),
        "sma200": _sma(closes, 200),
        "high52w": max(highs or closes),
        "low52w": min(lows or closes),
        "momentum3m": _momentum(closes, 63),
        "momentum6m": _momentum(closes, 126),
        "momentum12m": _momentum(closes, min(252, len(closes) - 1)),
        "volatility": _annualized_volatility(closes),
    }


def _sma(values: list[float], window: int) -> Optional[float]:
    if len(values) < window:
        return None
    return mean(values[-window:])


def _momentum(values: list[float], lookback: int) -> Optional[float]:
    if lookback <= 0 or len(values) <= lookback:
        return None
    start = values[-lookback - 1]
    return (values[-1] - start) / start if start else None


def _annualized_volatility(values: list[float]) -> Optional[float]:
    if len(values) < 3:
        return None
    returns = [
        (values[index] - values[index - 1]) / values[index - 1]
        for index in range(1, len(values))
        if values[index - 1]
    ]
    return pstdev(returns) * sqrt(252) if len(returns) > 1 else None
