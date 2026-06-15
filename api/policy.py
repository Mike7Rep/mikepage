from __future__ import annotations

from math import floor
from typing import Optional

from .config import Settings, get_settings
from .schemas import AssetAnalysis, OrderDecision


MIN_CONFIDENCE = 0.75
MIN_UNDERVALUATION = 0.60
MAX_RISK = 0.45


def decide_buy(
    analysis: AssetAnalysis,
    context: dict,
    run_spent: float = 0,
    max_notional: Optional[float] = None,
    settings: Optional[Settings] = None,
) -> OrderDecision:
    settings = settings or get_settings()
    account = context["account"]
    asset = context["asset"]
    buying_power = _num(account.get("buying_power"))
    price = _current_price(context)

    checks = _basic_checks(analysis, context, buying_power)
    if checks:
        return OrderDecision(should_buy=False, reason=checks)

    budget = _budget(analysis, buying_power, run_spent, settings)
    if max_notional is not None:
        budget = min(budget, max_notional)
    if budget <= 0:
        return OrderDecision(should_buy=False, reason="buying power limit reached")

    if asset.get("fractionable"):
        return OrderDecision(should_buy=True, reason="fractional notional buy", notional=budget)

    qty = floor(budget / price) if price > 0 else 0
    if qty < 1:
        return OrderDecision(should_buy=False, reason="integer quantity below 1")
    return OrderDecision(should_buy=True, reason="integer share buy", notional=qty * price, qty=qty)


def _basic_checks(analysis: AssetAnalysis, context: dict, buying_power: float) -> Optional[str]:
    asset = context["asset"]
    if context["account"].get("trading_blocked"):
        return "account trading blocked"
    if asset.get("class") != "us_equity":
        return "only US equities are supported in v1"
    if not asset.get("tradable") or asset.get("status") != "active":
        return "asset is not tradable and active"
    if any(order.get("symbol") == analysis.symbol for order in context["open_buy_orders"]):
        return "open buy order already exists"
    if buying_power <= 0:
        return "no buying power"
    if analysis.action != "buy":
        return f"AI action is {analysis.action}"
    if analysis.confidence < MIN_CONFIDENCE:
        return "AI confidence below threshold"
    if analysis.market_outlook != "positive":
        return "market outlook is not positive"
    if analysis.undervaluation_score < MIN_UNDERVALUATION:
        return "undervaluation score below threshold"
    if analysis.risk_score > MAX_RISK:
        return "risk score above threshold"
    return None


def _budget(analysis: AssetAnalysis, buying_power: float, run_spent: float, settings: Settings) -> float:
    weekly_left = buying_power * settings.max_weekly_bp_pct - run_spent
    asset_cap = buying_power * settings.max_asset_bp_pct
    reserve_left = buying_power * (1 - settings.reserve_bp_pct) - run_spent
    target = buying_power * analysis.target_notional_pct
    return round(max(0, min(weekly_left, asset_cap, reserve_left, target)), 2)


def _current_price(context: dict) -> float:
    position = context.get("position") or {}
    technicals = context.get("technicals") or {}
    return _num(position.get("current_price") or technicals.get("last_close"))


def _num(value: object) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0
