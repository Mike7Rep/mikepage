from api.schemas import AssetAnalysis, OrderDecision
from api.trading_service import PreparedReview, _best_candidate


def test_one_shot_prefers_best_policy_candidate():
    weak = _review("AAPL", rating=80, confidence=0.9, risk=0.2)
    strong = _review("NVDA", rating=91, confidence=0.8, risk=0.3)
    blocked = _review("TSLA", rating=99, confidence=0.99, risk=0.1, should_buy=False)

    assert _best_candidate([weak, strong, blocked]) == strong


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
