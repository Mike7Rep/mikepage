from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from .alpaca import AlpacaClient
from .schemas import PortfolioData, Position
from .storage import latest_reviews


async def get_portfolio(client: Optional[AlpacaClient] = None) -> PortfolioData:
    client = client or AlpacaClient()
    account = await client.get_account()
    raw_positions = await client.get_positions()
    warnings: list[str] = []
    names = await _asset_names(client, raw_positions)
    deposited = await _deposited(client, warnings)
    positions = [_position(raw, names.get(raw["symbol"], raw["symbol"])) for raw in raw_positions]
    cost = sum(item.costBasis for item in positions)
    market = sum(item.marketValue for item in positions)
    unrealized = sum(item.unrealizedPl for item in positions)
    current = _num(account.get("portfolio_value") or account.get("equity"), market)
    basis = deposited if deposited and deposited > 0 else None
    total_pl = current - basis if basis else unrealized
    return PortfolioData(
        currency=(account.get("currency") or "USD").upper(),
        currentValue=current,
        totalDeposited=deposited,
        totalCostBasis=cost,
        totalMarketValue=market,
        totalUnrealizedPl=unrealized,
        totalUnrealizedPlPercent=unrealized / cost if cost > 0 else None,
        totalPl=total_pl,
        totalPlPercent=total_pl / basis if basis else None,
        positions=positions,
        latestReviews=latest_reviews(),
        updatedAt=datetime.now(timezone.utc),
        warnings=warnings,
    )


async def _asset_names(client: AlpacaClient, positions: list[dict]) -> dict[str, str]:
    names: dict[str, str] = {}
    for position in positions:
        symbol = position["symbol"]
        try:
            asset = await client.get_asset(position.get("asset_id") or symbol)
            names[symbol] = asset.get("name") or symbol
        except Exception:
            names[symbol] = symbol
    return names


async def _deposited(client: AlpacaClient, warnings: list[str]) -> Optional[float]:
    try:
        activities = await client.get_cash_activities()
    except Exception:
        warnings.append("Einzahlungen konnten nicht geladen werden.")
        return None
    return sum(_num(item.get("net_amount")) for item in activities)


def _position(raw: dict, name: str) -> Position:
    qty = _num(raw.get("qty"))
    return Position(
        asset=raw["symbol"],
        name=name,
        qty=-abs(qty) if raw.get("side") == "short" else qty,
        entryPrice=_num(raw.get("avg_entry_price")),
        currentPrice=_num(raw.get("current_price")),
        marketValue=_num(raw.get("market_value")),
        costBasis=_num(raw.get("cost_basis")),
        unrealizedPl=_num(raw.get("unrealized_pl")),
        unrealizedPlPercent=_num(raw.get("unrealized_plpc")),
    )


def _num(value: object, fallback: float = 0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback
