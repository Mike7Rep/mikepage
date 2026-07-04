import pytest

from api.schemas import AssetAnalysis, OrderDecision, OrderResult
from api import trading_service
from api.trading_service import PreparedReview, _best_candidate, _deviation_note


def test_one_shot_prefers_best_policy_candidate():
    weak = _review("AAPL", rating=80, confidence=0.9, risk=0.2)
    strong = _review("NVDA", rating=91, confidence=0.8, risk=0.3)
    blocked = _review("TSLA", rating=99, confidence=0.99, risk=0.1, should_buy=False)

    assert _best_candidate([weak, strong, blocked]) == strong


@pytest.mark.asyncio
async def test_prepare_asset_adds_strategy_and_review_history(monkeypatch):
    seen_context = {}

    async def fake_context(symbol, client):
        return {"symbol": symbol, "technicals": {}}

    async def fake_ai(context):
        seen_context.update(context)
        return _analysis("AAPL")

    monkeypatch.setattr(trading_service, "build_asset_context", fake_context)
    monkeypatch.setattr(trading_service, "latest_strategy_version", lambda: {"version": 2})
    monkeypatch.setattr(trading_service, "review_history", lambda symbol, limit=3: [{"action": "buy"}])
    monkeypatch.setattr(trading_service, "analyze_with_ai", fake_ai)
    monkeypatch.setattr(
        trading_service,
        "decide_buy",
        lambda *_, **__: OrderDecision(should_buy=False, reason="hold"),
    )

    prepared = await trading_service._prepare_asset("aapl", object())

    assert prepared.symbol == "AAPL"
    assert seen_context["strategy"] == {"version": 2}
    assert seen_context["previous_reviews"] == [{"action": "buy"}]


@pytest.mark.asyncio
async def test_weekly_run_returns_strategy_version(monkeypatch):
    review = _review("AAPL", rating=80, confidence=0.8, risk=0.2, should_buy=False)

    async def fake_analyze_asset(symbol, execute, run_id, spent):
        return review.result(OrderResult(submitted=False, skipped_reason="test"))

    monkeypatch.setattr(trading_service, "existing_run", lambda *_: None)
    monkeypatch.setattr(trading_service, "create_run", lambda *_: 42)
    monkeypatch.setattr(trading_service, "finish_run", lambda *_: None)
    monkeypatch.setattr(trading_service, "AlpacaClient", lambda: object())
    monkeypatch.setattr(trading_service, "_symbols", lambda client: _async(["AAPL"]))
    monkeypatch.setattr(trading_service, "analyze_asset", fake_analyze_asset)
    monkeypatch.setattr(trading_service, "_evolve_run_strategy", lambda *_: _async(7))

    result = await trading_service.evaluate_weekly(execute=False, force=True)

    assert result.runId == 42
    assert result.strategyVersion == 7


def test_deviation_note_thresholds():
    assert _deviation_note("buy", 0.03) == "buy entwickelte sich positiv"
    assert _deviation_note("buy", -0.04) == "buy entwickelte sich negativ"
    assert _deviation_note("hold", 0.06) == "hold hatte auffaellige Bewegung"
    assert _deviation_note("avoid", 0.06) == "avoid stieg stark und sollte geprueft werden"
    assert _deviation_note("hold", 0.02) is None


def _review(
    symbol,
    rating,
    confidence,
    risk,
    should_buy=True,
):
    return PreparedReview(
        symbol=symbol,
        analysis=AssetAnalysis(
            symbol=symbol,
            rating=rating,
            action="buy",
            confidence=confidence,
            market_outlook="positive",
            undervaluation_score=0.8,
            risk_score=risk,
            target_notional_pct=0.15,
            rationale="Test.",
        ),
        decision=OrderDecision(should_buy=should_buy, reason="ok", notional=25),
    )


def _analysis(symbol):
    return AssetAnalysis(
        symbol=symbol,
        rating=72,
        action="hold",
        confidence=0.68,
        market_outlook="neutral",
        undervaluation_score=0.52,
        risk_score=0.38,
        target_notional_pct=0,
        rationale="Test.",
    )


async def _async(value):
    return value
