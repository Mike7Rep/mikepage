import pytest
from fastapi import HTTPException

from api.orders import build_buy_order
from api.schemas import OrderDecision


def test_integer_order_uses_qty():
    payload = build_buy_order("IBM", OrderDecision(should_buy=True, reason="ok", notional=300, qty=2))
    assert payload["symbol"] == "IBM"
    assert payload["side"] == "buy"
    assert payload["type"] == "market"
    assert payload["time_in_force"] == "day"
    assert payload["qty"] == "2"
    assert "notional" not in payload


def test_order_requires_whole_share_qty():
    with pytest.raises(HTTPException):
        build_buy_order("AAPL", OrderDecision(should_buy=True, reason="ok", notional=123.45))
