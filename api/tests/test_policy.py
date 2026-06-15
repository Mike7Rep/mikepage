from api.config import Settings
from api.policy import decide_buy
from api.schemas import AssetAnalysis


def test_policy_allows_whole_share_buy_when_thresholds_pass():
    analysis = _analysis()
    context = _context(fractionable=True)
    decision = decide_buy(analysis, context, settings=_settings())
    assert decision.should_buy is True
    assert decision.notional == 1500
    assert decision.qty == 15


def test_policy_caps_one_shot_budget_but_still_uses_whole_shares():
    analysis = _analysis()
    context = _context(fractionable=True, price=10)
    decision = decide_buy(analysis, context, max_notional=25, settings=_settings())
    assert decision.should_buy is True
    assert decision.notional == 20
    assert decision.qty == 2


def test_policy_skips_when_capped_budget_cannot_buy_whole_share():
    analysis = _analysis()
    context = _context(fractionable=True, price=100)
    decision = decide_buy(analysis, context, max_notional=25, settings=_settings())
    assert decision.should_buy is False
    assert decision.reason == "integer quantity below 1"


def test_policy_blocks_low_confidence():
    analysis = _analysis(confidence=0.74)
    decision = decide_buy(analysis, _context(), settings=_settings())
    assert decision.should_buy is False
    assert "confidence" in decision.reason


def test_policy_requires_integer_qty_for_non_fractionable():
    analysis = _analysis(target_notional_pct=0.01)
    context = _context(fractionable=False, price=2500)
    decision = decide_buy(analysis, context, settings=_settings())
    assert decision.should_buy is False
    assert decision.reason == "integer quantity below 1"


def _analysis(**overrides):
    data = {
        "symbol": "AAPL",
        "rating": 88,
        "action": "buy",
        "confidence": 0.9,
        "market_outlook": "positive",
        "undervaluation_score": 0.8,
        "risk_score": 0.3,
        "target_notional_pct": 0.15,
        "rationale": "Strong quality and favorable setup.",
        "risks": [],
    }
    data.update(overrides)
    return AssetAnalysis(**data)


def _context(fractionable=True, price=100):
    return {
        "account": {"buying_power": "10000", "trading_blocked": False},
        "asset": {
            "class": "us_equity",
            "tradable": True,
            "status": "active",
            "fractionable": fractionable,
        },
        "position": {"current_price": str(price)},
        "open_buy_orders": [],
        "technicals": {"last_close": price},
    }


def _settings():
    return Settings(
        max_weekly_bp_pct=0.5,
        max_asset_bp_pct=0.15,
        reserve_bp_pct=0.05,
    )
