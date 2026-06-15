import pytest
from pydantic import ValidationError

from api.schemas import AssetAnalysis, EvaluateOnceRequest


def test_asset_analysis_rejects_invalid_action():
    with pytest.raises(ValidationError):
        AssetAnalysis(
            symbol="AAPL",
            rating=101,
            action="sell",
            confidence=1.2,
            market_outlook="moon",
            undervaluation_score=0.5,
            risk_score=0.5,
            target_notional_pct=0.1,
            rationale="x",
        )


def test_evaluate_once_allows_policy_sized_notional_cap():
    assert EvaluateOnceRequest().maxNotional is None
    assert EvaluateOnceRequest(maxNotional=1000).maxNotional == 1000
