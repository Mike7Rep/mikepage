from api.orders import build_buy_order
from api.schemas import OrderDecision


def test_fractional_order_uses_notional():
    payload = build_buy_order("AAPL", OrderDecision(should_buy=True, reason="ok", notional=123.45))
    assert payload["symbol"] == "AAPL"
    assert payload["side"] == "buy"
    assert payload["type"] == "market"
    assert payload["time_in_force"] == "day"
    assert payload["notional"] == "123.45"
    assert "qty" not in payload


def test_integer_order_uses_qty():
    payload = build_buy_order("IBM", OrderDecision(should_buy=True, reason="ok", notional=300, qty=2))
    assert payload["qty"] == "2"
    assert "notional" not in payload
