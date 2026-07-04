from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    execute: bool = False


class WeeklyJobRequest(BaseModel):
    execute: bool = True
    force: bool = False


class EvaluateOnceRequest(BaseModel):
    execute: bool = True
    maxNotional: Optional[float] = Field(default=None, gt=0)
    maxOrders: int = Field(default=1, ge=1, le=1)


class AssetAnalysis(BaseModel):
    symbol: str
    rating: int = Field(ge=1, le=100)
    action: Literal["buy", "hold", "avoid"]
    confidence: float = Field(ge=0, le=1)
    market_outlook: Literal["positive", "neutral", "negative"]
    undervaluation_score: float = Field(ge=0, le=1)
    risk_score: float = Field(ge=0, le=1)
    target_notional_pct: float = Field(ge=0, le=0.15)
    rationale: str = Field(min_length=1, max_length=1200)
    risks: list[str] = Field(default_factory=list, max_length=6)


class OrderDecision(BaseModel):
    should_buy: bool
    reason: str
    notional: float = 0
    qty: Optional[int] = None


class OrderResult(BaseModel):
    submitted: bool
    skipped_reason: Optional[str] = None
    order_id: Optional[str] = None
    payload: Optional[dict] = None


class Position(BaseModel):
    asset: str
    name: str
    qty: float
    entryPrice: float
    currentPrice: float
    marketValue: float
    costBasis: float
    unrealizedPl: float
    unrealizedPlPercent: float


class StrategyData(BaseModel):
    summary: str
    principles: list[str] = Field(default_factory=list)
    buySignals: list[str] = Field(default_factory=list)
    holdSignals: list[str] = Field(default_factory=list)
    avoidSignals: list[str] = Field(default_factory=list)
    riskRules: list[str] = Field(default_factory=list)
    learningNotes: list[str] = Field(default_factory=list)


class StrategySnapshot(BaseModel):
    version: int
    summary: str
    updatedAt: datetime
    rationale: str


class StrategyUpdate(BaseModel):
    strategy: StrategyData
    rationale: str = Field(min_length=1, max_length=1200)


class ReviewPerformanceReview(BaseModel):
    createdAt: str
    action: Literal["buy", "hold", "avoid"]
    rating: Optional[int] = None
    priceChangePercent: Optional[float] = None
    priceFrom: Optional[float] = None
    priceTo: Optional[float] = None


class ReviewPerformanceRow(BaseModel):
    symbol: str
    reviews: list[ReviewPerformanceReview]


class PortfolioData(BaseModel):
    currency: str
    currentValue: float
    totalDeposited: Optional[float]
    totalCostBasis: float
    totalMarketValue: float
    totalUnrealizedPl: float
    totalUnrealizedPlPercent: Optional[float]
    totalPl: float
    totalPlPercent: Optional[float]
    positions: list[Position]
    latestReviews: list[dict] = Field(default_factory=list)
    strategy: Optional[StrategySnapshot] = None
    reviewPerformance: list[ReviewPerformanceRow] = Field(default_factory=list)
    updatedAt: datetime
    warnings: list[str] = Field(default_factory=list)


class AssetReviewResult(BaseModel):
    symbol: str
    analysis: AssetAnalysis
    decision: OrderDecision
    order: OrderResult
    reviewedAt: datetime


class WeeklyJobResult(BaseModel):
    runId: int
    status: str
    symbols: list[str]
    reviews: list[AssetReviewResult]
    strategyVersion: Optional[int] = None
    skippedReason: Optional[str] = None


class OneShotJobResult(BaseModel):
    runId: int
    status: str
    symbols: list[str]
    selectedSymbol: Optional[str] = None
    reviews: list[AssetReviewResult]
    skippedReason: Optional[str] = None
    marketOpen: Optional[bool] = None


class AssetChartBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    averageEntryPrice: Optional[float] = None


class AssetChartFill(BaseModel):
    id: str
    orderId: Optional[str] = None
    side: Literal["buy", "sell"]
    date: str
    transactionTime: str
    qty: float
    price: float
    notional: float


class AssetChartData(BaseModel):
    symbol: str
    name: str
    currency: str
    periodStart: str
    periodEnd: str
    averageEntryPrice: Optional[float]
    bars: list[AssetChartBar]
    fills: list[AssetChartFill]
