from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from .ai import analyze_with_ai, evolve_strategy
from .alpaca import AlpacaClient
from .config import get_settings
from .market_data import build_asset_context
from .orders import build_buy_order, submit_order
from .policy import decide_buy
from .schemas import AssetAnalysis, AssetReviewResult, OneShotJobResult, OrderDecision, OrderResult, WeeklyJobResult
from .storage import create_run, existing_run, finish_run, latest_strategy_version, review_history, save_review, save_strategy_version


@dataclass(frozen=True)
class PreparedReview:
    symbol: str
    analysis: AssetAnalysis
    decision: OrderDecision

    def result(self, order: OrderResult) -> AssetReviewResult:
        return AssetReviewResult(
            symbol=self.symbol,
            analysis=self.analysis,
            decision=self.decision,
            order=order,
            reviewedAt=datetime.now(timezone.utc),
        )


async def analyze_asset(
    symbol: str,
    execute: bool = False,
    run_id: Optional[int] = None,
    run_spent: float = 0,
    max_notional: Optional[float] = None,
) -> AssetReviewResult:
    client = AlpacaClient()
    prepared = await _prepare_asset(symbol, client, run_spent, max_notional)
    order = await submit_order(prepared.symbol, prepared.decision, execute, client)
    result = prepared.result(order)
    save_review(run_id, result.symbol, result.analysis, result.decision, result.order)
    return result


async def evaluate_weekly(execute: bool = True, force: bool = False) -> WeeklyJobResult:
    run_date = datetime.now(timezone.utc).date()
    if existing_run("weekly", run_date) and not force:
        return WeeklyJobResult(runId=0, status="skipped", symbols=[], reviews=[], skippedReason="already run")

    run_id = create_run("weekly", run_date)
    client = AlpacaClient()
    symbols = await _symbols(client)
    reviews: list[AssetReviewResult] = []
    spent = 0.0
    status = "completed"
    strategy_version: Optional[int] = None
    try:
        for symbol in symbols:
            review = await analyze_asset(symbol, execute, run_id, spent)
            reviews.append(review)
            if review.decision.should_buy:
                spent += review.decision.notional
        strategy_version = await _evolve_run_strategy(run_id, reviews)
    except Exception:
        status = "failed"
        raise
    finally:
        finish_run(run_id, status)
    return WeeklyJobResult(runId=run_id, status=status, symbols=symbols, reviews=reviews, strategyVersion=strategy_version)


async def evaluate_once(
    execute: bool = True,
    max_notional: Optional[float] = None,
    max_orders: int = 1,
) -> OneShotJobResult:
    _ = max_orders
    client = AlpacaClient()
    run_id = create_run(_one_shot_kind(), datetime.now(timezone.utc).date())
    symbols = await _symbols(client)
    prepared: list[PreparedReview] = []
    reviews: list[AssetReviewResult] = []
    selected = None
    skipped_reason: Optional[str] = None
    market_open: Optional[bool] = None
    status = "completed"
    try:
        for symbol in symbols:
            prepared.append(await _prepare_asset(symbol, client, max_notional=max_notional))
        selected = _best_candidate(prepared)
        if selected and execute:
            market_open = await _market_open(client)
        for item in prepared:
            order = await _one_shot_order(item, selected, execute, market_open, client)
            result = item.result(order)
            reviews.append(result)
            save_review(run_id, result.symbol, result.analysis, result.decision, result.order)
        skipped_reason = _one_shot_skip(selected, reviews, execute, market_open)
    except Exception:
        status = "failed"
        raise
    finally:
        finish_run(run_id, status)
    return OneShotJobResult(
        runId=run_id,
        status=status,
        symbols=symbols,
        selectedSymbol=selected.symbol if selected else None,
        reviews=reviews,
        skippedReason=skipped_reason,
        marketOpen=market_open,
    )


async def _prepare_asset(
    symbol: str,
    client: AlpacaClient,
    run_spent: float = 0,
    max_notional: Optional[float] = None,
) -> PreparedReview:
    symbol = symbol.upper()
    context = await build_asset_context(symbol, client)
    context["strategy"] = latest_strategy_version()
    context["previous_reviews"] = review_history(symbol, limit=3)
    analysis = await analyze_with_ai(context)
    decision = decide_buy(analysis, context, run_spent=run_spent, max_notional=max_notional)
    return PreparedReview(symbol=symbol, analysis=analysis, decision=decision)


async def _symbols(client: AlpacaClient) -> list[str]:
    positions = await client.get_positions()
    held = {item["symbol"].upper() for item in positions if item.get("symbol")}
    return sorted(held | set(get_settings().watchlist))


async def _evolve_run_strategy(run_id: int, reviews: list[AssetReviewResult]) -> Optional[int]:
    if not reviews:
        return None

    symbols = [review.symbol for review in reviews]
    history = {symbol: review_history(symbol, limit=3) for symbol in symbols}
    update = await evolve_strategy(
        {
            "current_strategy": latest_strategy_version(),
            "symbols": symbols,
            "latest_reviews": [_review_summary(review) for review in reviews],
            "performance_history": history,
            "deviation_rules": {
                "buy_good": "+2%",
                "buy_bad": "-3%",
                "hold_attention": "+/-5%",
                "avoid_strategy_bad": "+5%",
            },
            "deviations": _deviations(history),
        }
    )
    saved = save_strategy_version(run_id, update.strategy, update.rationale)
    return int(saved["version"])


def _review_summary(review: AssetReviewResult) -> dict:
    return {
        "symbol": review.symbol,
        "action": review.analysis.action,
        "rating": review.analysis.rating,
        "confidence": review.analysis.confidence,
        "decision": review.decision.model_dump(mode="json"),
        "rationale": review.analysis.rationale,
    }


def _deviations(history: dict[str, list[dict]]) -> list[dict]:
    deviations: list[dict] = []
    for symbol, reviews in history.items():
        for review in reviews:
            change = review.get("priceChangePercent")
            if change is None:
                continue
            action = review.get("action")
            note = _deviation_note(action, float(change))
            if note:
                deviations.append({"symbol": symbol, "action": action, "priceChangePercent": change, "note": note})
    return deviations


def _deviation_note(action: object, change: float) -> Optional[str]:
    if action == "buy" and change >= 0.02:
        return "buy entwickelte sich positiv"
    if action == "buy" and change <= -0.03:
        return "buy entwickelte sich negativ"
    if action == "hold" and abs(change) >= 0.05:
        return "hold hatte auffaellige Bewegung"
    if action == "avoid" and change >= 0.05:
        return "avoid stieg stark und sollte geprueft werden"
    return None


def _best_candidate(reviews: list[PreparedReview]) -> Optional[PreparedReview]:
    candidates = [item for item in reviews if item.decision.should_buy]
    if not candidates:
        return None
    return sorted(candidates, key=_candidate_score, reverse=True)[0]


def _candidate_score(item: PreparedReview) -> tuple[float, float, float, float, float]:
    analysis = item.analysis
    return (
        analysis.rating,
        analysis.confidence,
        analysis.undervaluation_score,
        1 - analysis.risk_score,
        item.decision.notional,
    )


async def _market_open(client: AlpacaClient) -> bool:
    clock = await client.get_clock()
    return bool(clock.get("is_open"))


async def _one_shot_order(
    item: PreparedReview,
    selected: Optional[PreparedReview],
    execute: bool,
    market_open: Optional[bool],
    client: AlpacaClient,
) -> OrderResult:
    if not item.decision.should_buy:
        return OrderResult(submitted=False, skipped_reason=item.decision.reason)
    payload = build_buy_order(item.symbol, item.decision)
    if item != selected:
        return OrderResult(submitted=False, skipped_reason="not selected for one-shot", payload=payload)
    settings = get_settings()
    if execute and settings.ai_mock:
        return OrderResult(submitted=False, skipped_reason="AI mock responses active", payload=payload)
    if execute and market_open is False:
        return OrderResult(submitted=False, skipped_reason="market is closed", payload=payload)
    return await submit_order(item.symbol, item.decision, execute, client)


def _one_shot_skip(
    selected: Optional[PreparedReview],
    reviews: list[AssetReviewResult],
    execute: bool,
    market_open: Optional[bool],
) -> Optional[str]:
    if not selected:
        return "no policy-approved buy candidate"
    selected_review = next((item for item in reviews if item.symbol == selected.symbol), None)
    if selected_review and not selected_review.order.submitted:
        return selected_review.order.skipped_reason
    if execute and market_open is False:
        return "market is closed"
    return None


def _one_shot_kind() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
    return f"one-shot-{stamp}"
