import { cacheLife, cacheTag } from "next/cache"
import type { InputJsonValue } from "@/app/generated/prisma/internal/prismaNamespace"

import { prisma } from "@/lib/prisma"

type Action = "buy" | "hold" | "avoid"
type MarketOutlook = "positive" | "neutral" | "negative"
type Side = "buy" | "sell"
type JsonRecord = Record<string, unknown>

export type DashboardPosition = {
  asset: string
  name: string
  qty: number
  entryPrice: number
  currentPrice: number
  marketValue: number
  costBasis: number
  unrealizedPl: number
  unrealizedPlPercent: number
}

export type LatestReview = {
  symbol: string
  createdAt: string
  analysis: AssetAnalysis
  decision: OrderDecision
  order: OrderResult
}

export type AlpacaDashboardData = {
  currency: string
  currentValue: number
  totalDeposited: number | null
  totalCostBasis: number
  totalMarketValue: number
  totalUnrealizedPl: number
  totalUnrealizedPlPercent: number | null
  totalPl: number
  totalPlPercent: number | null
  positions: DashboardPosition[]
  latestReviews: LatestReview[]
  strategy: {
    version: number
    summary: string
    updatedAt: string
    rationale: string
  } | null
  reviewPerformance: Array<{
    symbol: string
    reviews: Array<{
      createdAt: string
      action: Action
      rating?: number | null
      priceChangePercent: number | null
      priceFrom: number | null
      priceTo: number | null
    }>
  }>
  updatedAt: string
  warnings: string[]
}

export type AssetChartBar = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  averageEntryPrice?: number | null
}

export type AssetChartFill = {
  id: string
  orderId?: string
  side: Side
  date: string
  transactionTime: string
  qty: number
  price: number
  notional: number
}

export type AssetChartData = {
  symbol: string
  name: string
  currency: string
  periodStart: string
  periodEnd: string
  averageEntryPrice: number | null
  bars: AssetChartBar[]
  fills: AssetChartFill[]
}

type AlpacaSettings = {
  alpacaEndpoint: string
  alpacaDataEndpoint: string
  alpacaKey: string
  alpacaSecret: string
  openAiApiKey: string
  openAiModel: string
  aiMock: boolean
  watchlist: string[]
  tradingEnabled: boolean
  allowLiveTrading: boolean
  maxWeeklyBpPct: number
  maxAssetBpPct: number
  reserveBpPct: number
}

type AssetAnalysis = {
  symbol: string
  rating: number
  action: Action
  confidence: number
  market_outlook: MarketOutlook
  undervaluation_score: number
  risk_score: number
  target_notional_pct: number
  rationale: string
  risks: string[]
}

type OrderDecision = {
  should_buy: boolean
  reason: string
  notional: number
  qty?: number | null
}

type OrderResult = {
  submitted: boolean
  skipped_reason?: string
  order_id?: string
  payload?: JsonRecord
}

type AssetReviewResult = {
  symbol: string
  analysis: AssetAnalysis
  decision: OrderDecision
  order: OrderResult
  reviewedAt: string
}

type StrategyData = {
  summary: string
  principles: string[]
  buySignals: string[]
  holdSignals: string[]
  avoidSignals: string[]
  riskRules: string[]
  learningNotes: string[]
}

type StrategyUpdate = {
  strategy: StrategyData
  rationale: string
}

type AlpacaClient = ReturnType<typeof createAlpacaClient>

const LOCAL_ALPACA_ENDPOINT = "https://api.alpaca.markets"
const LOCAL_ALPACA_DATA_ENDPOINT = "https://data.alpaca.markets"
const MIN_CONFIDENCE = 0.75
const MIN_UNDERVALUATION = 0.6
const MAX_RISK = 0.45

export async function getDashboardPortfolio() {
  "use cache"
  cacheLife("hours")
  cacheTag("dashboard:portfolio")

  const settings = getSettings()
  const client = createAlpacaClient(settings)
  const [account, rawPositions] = await Promise.all([
    client.getAccount(),
    client.getPositions(),
  ])
  const warnings: string[] = []
  const names = await assetNames(client, rawPositions)
  const deposited = await depositedAmount(client, warnings)
  const positions = rawPositions.map((raw) => positionFromAlpaca(raw, names.get(stringValue(raw.symbol)) ?? stringValue(raw.symbol)))
  const cost = sumBy(positions, (item) => item.costBasis)
  const market = sumBy(positions, (item) => item.marketValue)
  const unrealized = sumBy(positions, (item) => item.unrealizedPl)
  const current = numberValue(account.portfolio_value ?? account.equity, market)
  const basis = deposited && deposited > 0 ? deposited : null
  const totalPl = basis ? current - basis : unrealized
  const reviewSymbols = [
    ...new Set([
      ...positions.map((item) => item.asset),
      ...settings.watchlist,
      ...(await latestReviewSymbols()),
    ]),
  ].sort()
  const strategy = await latestStrategyVersion()

  return {
    currency: stringValue(account.currency || "USD").toUpperCase(),
    currentValue: current,
    totalDeposited: deposited,
    totalCostBasis: cost,
    totalMarketValue: market,
    totalUnrealizedPl: unrealized,
    totalUnrealizedPlPercent: cost > 0 ? unrealized / cost : null,
    totalPl,
    totalPlPercent: basis ? totalPl / basis : null,
    positions,
    latestReviews: await latestReviews(),
    strategy: strategySnapshot(strategy),
    reviewPerformance: await reviewPerformance(reviewSymbols),
    updatedAt: new Date().toISOString(),
    warnings,
  } satisfies AlpacaDashboardData
}

export async function getAssetChart(symbol: string) {
  "use cache"
  const normalizedSymbol = symbol.trim().toUpperCase()
  cacheLife("hours")
  cacheTag("dashboard:asset-chart", `dashboard:asset-chart:${normalizedSymbol}`)

  const client = createAlpacaClient(getSettings())
  const end = new Date()
  const start = addDays(end, -730)
  const [account, positions, asset, bars, fills] = await Promise.all([
    client.getAccount(),
    client.getPositions(),
    client.getAsset(normalizedSymbol),
    barsForSymbol(client, normalizedSymbol, start, end),
    client.getFillActivities(normalizedSymbol, toDateString(start)),
  ])
  const chartFills = fills.flatMap((item) => {
    const fill = fillFromAlpaca(item)
    return fill ? [fill] : []
  })
  const chartBars = barsWithAverageEntryPrice(bars.map(barFromAlpaca), chartFills)
  const position = positions.find((item) => stringValue(item.symbol).toUpperCase() === normalizedSymbol)
  const positionAverage = optionalNumber(position?.avg_entry_price)
  const latestAverage = latestAverageEntryPrice(chartBars)

  if (latestAverage === null && positionAverage !== null) {
    for (const bar of chartBars) {
      bar.averageEntryPrice = positionAverage
    }
  }

  return {
    symbol: normalizedSymbol,
    name: stringValue(asset.name || normalizedSymbol),
    currency: stringValue(account.currency || "USD").toUpperCase(),
    periodStart: toDateString(start),
    periodEnd: toDateString(end),
    averageEntryPrice: latestAverage ?? positionAverage,
    bars: chartBars,
    fills: chartFills,
  } satisfies AssetChartData
}

export async function evaluateWeekly({
  execute = true,
  force = false,
}: {
  execute?: boolean
  force?: boolean
} = {}) {
  const runDate = dateAtUtcMidnight(new Date())
  const existing = await prisma.run.findUnique({
    where: { runDate_kind: { runDate, kind: "weekly" } },
  })
  if (existing && !force) {
    return {
      runId: 0,
      status: "skipped",
      symbols: [] as string[],
      reviews: [] as AssetReviewResult[],
      skippedReason: "already run",
    }
  }

  const run = await prisma.run.create({
    data: { kind: "weekly", runDate, status: "running" },
  })
  const client = createAlpacaClient(getSettings())
  const symbols = await reviewSymbolsForRun(client)
  const reviews: AssetReviewResult[] = []
  let spent = 0
  let status = "completed"
  let strategyVersion: number | null = null

  try {
    for (const symbol of symbols) {
      const review = await analyzeAsset(symbol, {
        client,
        execute,
        runId: run.id,
        runSpent: spent,
      })
      reviews.push(review)
      if (review.decision.should_buy) {
        spent += review.decision.notional
      }
    }
    strategyVersion = await evolveRunStrategy(run.id, reviews)
  } catch (error) {
    status = "failed"
    throw error
  } finally {
    await prisma.run.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), status },
    })
  }

  return { runId: run.id, status, symbols, reviews, strategyVersion }
}

async function analyzeAsset(
  symbol: string,
  {
    client,
    execute,
    runId,
    runSpent = 0,
    maxNotional,
  }: {
    client: AlpacaClient
    execute: boolean
    runId?: number
    runSpent?: number
    maxNotional?: number
  },
) {
  const normalizedSymbol = symbol.toUpperCase()
  const context = await assetContext(normalizedSymbol, client)
  const analysis = await analyzeWithAi({
    ...context,
    previous_reviews: await reviewHistory(normalizedSymbol, 3),
    strategy: await latestStrategyVersion(),
  })
  const decision = decideBuy(analysis, context, runSpent, maxNotional)
  const order = await submitOrder(normalizedSymbol, decision, execute, client)
  const result = {
    symbol: normalizedSymbol,
    analysis,
    decision,
    order,
    reviewedAt: new Date().toISOString(),
  } satisfies AssetReviewResult
  await saveReview(runId ?? null, result)
  return result
}

function createAlpacaClient(settings: AlpacaSettings) {
  async function request<T>(method: string, base: string, path: string, init: RequestInit = {}) {
    if (!settings.alpacaEndpoint || !settings.alpacaKey || !settings.alpacaSecret) {
      throw new Error("Alpaca ENV fehlt.")
    }

    const response = await fetch(`${base}${path}`, {
      ...init,
      method,
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": settings.alpacaKey,
        "APCA-API-SECRET-KEY": settings.alpacaSecret,
        ...(init.headers ?? {}),
      },
    })

    if (!response.ok) {
      throw new Error(`Alpaca Fehler ${response.status}: ${await errorText(response)}`)
    }
    return response.json() as Promise<T>
  }

  return {
    getAccount: () => request<JsonRecord>("GET", settings.alpacaEndpoint, "/v2/account"),
    getPositions: () => request<JsonRecord[]>("GET", settings.alpacaEndpoint, "/v2/positions"),
    getAsset: (symbolOrId: string) => request<JsonRecord>("GET", settings.alpacaEndpoint, `/v2/assets/${encodeURIComponent(symbolOrId)}`),
    getOpenBuyOrders: async () => {
      const params = new URLSearchParams({ direction: "desc", limit: "100", status: "open" })
      const orders = await request<JsonRecord[]>("GET", settings.alpacaEndpoint, `/v2/orders?${params}`)
      return orders.filter((order) => stringValue(order.side) === "buy")
    },
    getClock: () => request<JsonRecord>("GET", settings.alpacaEndpoint, "/v2/clock"),
    getCashActivities: () => {
      const params = new URLSearchParams({ activity_types: "CSD,CSW", direction: "asc", page_size: "100" })
      return request<JsonRecord[]>("GET", settings.alpacaEndpoint, `/v2/account/activities?${params}`)
    },
    getFillActivities: async (symbol: string, after: string) => {
      const fills: JsonRecord[] = []
      let pageToken: string | null = null
      while (true) {
        const params = new URLSearchParams({
          activity_types: "FILL",
          after,
          direction: "asc",
          page_size: "100",
        })
        if (pageToken) params.set("page_token", pageToken)
        const page = await request<JsonRecord[]>("GET", settings.alpacaEndpoint, `/v2/account/activities?${params}`)
        fills.push(...page.filter((item) => stringValue(item.symbol).toUpperCase() === symbol.toUpperCase()))
        if (page.length < 100) break
        const lastId = stringValue(page.at(-1)?.id)
        if (!lastId) break
        pageToken = lastId
      }
      return fills
    },
    getStockBars: (symbols: string[], start: string, end?: string) => {
      const params = new URLSearchParams({
        adjustment: "all",
        feed: "iex",
        limit: "10000",
        start,
        symbols: symbols.join(","),
        timeframe: "1Day",
      })
      if (end) params.set("end", end)
      return request<{ bars?: Record<string, JsonRecord[]> }>("GET", settings.alpacaDataEndpoint, `/v2/stocks/bars?${params}`)
    },
    placeOrder: (payload: JsonRecord) => request<JsonRecord>("POST", settings.alpacaEndpoint, "/v2/orders", {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    }),
  }
}

async function assetNames(client: AlpacaClient, positions: JsonRecord[]) {
  const names = new Map<string, string>()
  await Promise.all(positions.map(async (position) => {
    const symbol = stringValue(position.symbol)
    try {
      const asset = await client.getAsset(stringValue(position.asset_id) || symbol)
      names.set(symbol, stringValue(asset.name || symbol))
    } catch {
      names.set(symbol, symbol)
    }
  }))
  return names
}

async function depositedAmount(client: AlpacaClient, warnings: string[]) {
  try {
    const activities = await client.getCashActivities()
    return sumBy(activities, (item) => numberValue(item.net_amount))
  } catch {
    warnings.push("Einzahlungen konnten nicht geladen werden.")
    return null
  }
}

function positionFromAlpaca(raw: JsonRecord, name: string): DashboardPosition {
  const qty = numberValue(raw.qty)
  return {
    asset: stringValue(raw.symbol),
    name,
    qty: stringValue(raw.side) === "short" ? -Math.abs(qty) : qty,
    entryPrice: numberValue(raw.avg_entry_price),
    currentPrice: numberValue(raw.current_price),
    marketValue: numberValue(raw.market_value),
    costBasis: numberValue(raw.cost_basis),
    unrealizedPl: numberValue(raw.unrealized_pl),
    unrealizedPlPercent: numberValue(raw.unrealized_plpc),
  }
}

async function latestReviews(limit = 12): Promise<LatestReview[]> {
  const rows = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return rows.map((row) => ({
    symbol: row.symbol,
    analysis: normalizeAnalysis(row.analysisJson),
    decision: normalizeDecision(row.decisionJson),
    order: normalizeOrder(row.orderJson),
    createdAt: row.createdAt.toISOString(),
  }))
}

async function latestReviewSymbols(limit = 12) {
  const rows = await prisma.review.groupBy({
    by: ["symbol"],
    orderBy: { _max: { createdAt: "desc" } },
    take: limit,
  })
  return rows.map((row) => row.symbol.toUpperCase())
}

async function latestStrategyVersion() {
  return prisma.strategyVersion.findFirst({
    orderBy: { version: "desc" },
  })
}

function strategySnapshot(row: Awaited<ReturnType<typeof latestStrategyVersion>>) {
  if (!row) return null
  const strategy = jsonRecord(row.strategyJson)
  return {
    version: row.version,
    summary: stringValue(strategy.summary),
    updatedAt: row.createdAt.toISOString(),
    rationale: row.rationale,
  }
}

async function reviewPerformance(symbols: string[], limit = 3): Promise<AlpacaDashboardData["reviewPerformance"]> {
  const normalized = [...new Set(symbols.map((symbol) => symbol.toUpperCase()).filter(Boolean))].sort()
  return Promise.all(normalized.map(async (symbol) => ({
    symbol,
    reviews: await reviewHistory(symbol, limit),
  })))
}

async function reviewHistory(symbol: string, limit = 3) {
  const rows = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    where: { symbol: symbol.toUpperCase() },
  })

  return Promise.all(rows.map(async (row) => {
    const [priceFrom, priceTo] = await Promise.all([
      closeOnOrAfter(row.symbol, row.createdAt),
      latestClose(row.symbol),
    ])
    const analysis = normalizeAnalysis(row.analysisJson)
    return {
      createdAt: row.createdAt.toISOString(),
      action: analysis.action,
      rating: analysis.rating,
      priceChangePercent: priceFrom && priceTo ? (priceTo - priceFrom) / priceFrom : null,
      priceFrom,
      priceTo,
    }
  }))
}

async function closeOnOrAfter(symbol: string, value: Date) {
  const row = await prisma.assetPriceBar.findFirst({
    orderBy: { date: "asc" },
    where: { symbol: symbol.toUpperCase(), date: { gte: dateAtUtcMidnight(value) } },
  })
  return row ? Number(row.close) : null
}

async function latestClose(symbol: string) {
  const row = await prisma.assetPriceBar.findFirst({
    orderBy: { date: "desc" },
    where: { symbol: symbol.toUpperCase() },
  })
  return row ? Number(row.close) : null
}

async function barsForSymbol(client: AlpacaClient, symbol: string, start: Date, end: Date) {
  const cached = await cachedAssetBars(symbol, start, end)
  if (cached.length && !cacheStale(cached, end)) {
    return cached.map(cachedBarToAlpaca)
  }

  const data = await client.getStockBars([symbol], toDateString(start), toDateString(end))
  const fresh = data.bars?.[symbol] ?? []
  await upsertAssetBars(symbol, fresh)
  const nextCached = await cachedAssetBars(symbol, start, end)
  return nextCached.length ? nextCached.map(cachedBarToAlpaca) : fresh
}

async function cachedAssetBars(symbol: string, start: Date, end: Date) {
  return prisma.assetPriceBar.findMany({
    orderBy: { date: "asc" },
    where: {
      symbol: symbol.toUpperCase(),
      date: { gte: dateAtUtcMidnight(start), lte: dateAtUtcMidnight(end) },
    },
  })
}

function cacheStale(cached: Awaited<ReturnType<typeof cachedAssetBars>>, end: Date) {
  const latest = Math.max(...cached.map((item) => item.date.getTime()))
  const newestUpdate = Math.max(...cached.map((item) => item.updatedAt.getTime()))
  return latest < addDays(end, -3).getTime() || newestUpdate < Date.now() - 24 * 60 * 60 * 1000
}

function cachedBarToAlpaca(row: Awaited<ReturnType<typeof cachedAssetBars>>[number]) {
  return {
    c: Number(row.close),
    h: Number(row.high),
    l: Number(row.low),
    o: Number(row.open),
    t: row.date.toISOString().slice(0, 10),
    v: Number(row.volume),
  } satisfies JsonRecord
}

async function upsertAssetBars(symbol: string, bars: JsonRecord[]) {
  if (!bars.length) return
  await Promise.all(bars.map((bar) => {
    const date = parseBarDate(bar.t)
    return prisma.assetPriceBar.upsert({
      where: { symbol_date: { symbol: symbol.toUpperCase(), date } },
      create: {
        symbol: symbol.toUpperCase(),
        date,
        open: numberValue(bar.o),
        high: numberValue(bar.h),
        low: numberValue(bar.l),
        close: numberValue(bar.c),
        volume: numberValue(bar.v),
        source: "alpaca",
      },
      update: {
        open: numberValue(bar.o),
        high: numberValue(bar.h),
        low: numberValue(bar.l),
        close: numberValue(bar.c),
        volume: numberValue(bar.v),
        source: "alpaca",
      },
    })
  }))
}

function barFromAlpaca(raw: JsonRecord): AssetChartBar {
  return {
    date: stringValue(raw.t).slice(0, 10),
    open: numberValue(raw.o),
    high: numberValue(raw.h),
    low: numberValue(raw.l),
    close: numberValue(raw.c),
    volume: numberValue(raw.v),
  }
}

function fillFromAlpaca(raw: JsonRecord): AssetChartFill | null {
  const side = stringValue(raw.side).toLowerCase()
  if (side !== "buy" && side !== "sell") return null
  const qty = numberValue(raw.qty)
  const price = numberValue(raw.price)
  const timestamp = stringValue(raw.transaction_time || raw.date)
  return {
    id: stringValue(raw.id || raw.order_id || timestamp),
    orderId: optionalString(raw.order_id),
    side,
    date: timestamp.slice(0, 10),
    transactionTime: timestamp,
    qty,
    price,
    notional: Math.round(Math.abs(qty * price) * 100) / 100,
  }
}

function barsWithAverageEntryPrice(bars: AssetChartBar[], fills: AssetChartFill[]) {
  const sortedBars = [...bars].sort((left, right) => left.date.localeCompare(right.date))
  const sortedFills = [...fills].sort((left, right) => (left.transactionTime || left.date).localeCompare(right.transactionTime || right.date))
  const lots: Array<{ qty: number; price: number }> = []
  let fillIndex = 0

  for (const bar of sortedBars) {
    while (fillIndex < sortedFills.length && sortedFills[fillIndex].date <= bar.date) {
      applyFill(lots, sortedFills[fillIndex])
      fillIndex += 1
    }
    bar.averageEntryPrice = averageLots(lots)
  }

  return sortedBars
}

function applyFill(lots: Array<{ qty: number; price: number }>, fill: AssetChartFill) {
  if (fill.qty <= 0 || fill.price <= 0) return
  if (fill.side === "buy") {
    lots.push({ qty: fill.qty, price: fill.price })
    return
  }

  let remaining = fill.qty
  while (remaining > 0 && lots.length) {
    if (lots[0].qty <= remaining) {
      remaining -= lots[0].qty
      lots.shift()
    } else {
      lots[0].qty -= remaining
      remaining = 0
    }
  }
}

function averageLots(lots: Array<{ qty: number; price: number }>) {
  const quantity = sumBy(lots, (lot) => lot.qty)
  if (quantity <= 0) return null
  return Math.round((sumBy(lots, (lot) => lot.qty * lot.price) / quantity) * 1_000_000) / 1_000_000
}

function latestAverageEntryPrice(bars: AssetChartBar[]) {
  return [...bars].reverse().find((bar) => bar.averageEntryPrice)?.averageEntryPrice ?? null
}

async function assetContext(symbol: string, client: AlpacaClient) {
  const [account, positions, asset, openBuyOrders] = await Promise.all([
    client.getAccount(),
    client.getPositions(),
    client.getAsset(symbol),
    client.getOpenBuyOrders(),
  ])
  const bars = stringValue(asset.class) === "us_equity"
    ? (await client.getStockBars([symbol], toDateString(addDays(new Date(), -370)))).bars?.[symbol] ?? []
    : []
  await upsertAssetBars(symbol, bars)
  return {
    account,
    asset,
    open_buy_orders: openBuyOrders,
    position: positions.find((item) => stringValue(item.symbol).toUpperCase() === symbol) ?? null,
    symbol,
    technicals: summarizeBars(bars),
  }
}

function summarizeBars(bars: JsonRecord[]) {
  const closes = bars.map((bar) => optionalNumber(bar.c)).filter((value): value is number => value !== null)
  const highs = bars.map((bar) => optionalNumber(bar.h)).filter((value): value is number => value !== null)
  const lows = bars.map((bar) => optionalNumber(bar.l)).filter((value): value is number => value !== null)
  if (!closes.length) return { bars: 0 }

  return {
    bars: closes.length,
    high52w: Math.max(...(highs.length ? highs : closes)),
    last_close: closes.at(-1),
    low52w: Math.min(...(lows.length ? lows : closes)),
    momentum12m: momentum(closes, Math.min(252, closes.length - 1)),
    momentum3m: momentum(closes, 63),
    momentum6m: momentum(closes, 126),
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    volatility: annualizedVolatility(closes),
  }
}

async function analyzeWithAi(context: JsonRecord): Promise<AssetAnalysis> {
  const settings = getSettings()
  if (settings.aiMock) return mockAnalysis(stringValue(context.symbol))
  if (!settings.openAiApiKey) throw new Error("OPENAI_API_KEY fehlt.")

  const output = await openAiJson<Partial<AssetAnalysis>>({
    prompt: [
      "Bewerte dieses Asset als JSON.",
      "Nutze nur die gelieferten Daten.",
      "Schema: symbol, rating 1-100, action buy|hold|avoid, confidence 0-1, market_outlook positive|neutral|negative, undervaluation_score 0-1, risk_score 0-1, target_notional_pct 0-0.15, rationale, risks array.",
      `Kontext: ${JSON.stringify(context)}`,
    ].join("\n"),
    settings,
  })
  return normalizeAnalysis(output)
}

async function evolveRunStrategy(runId: number, reviews: AssetReviewResult[]) {
  if (!reviews.length) return null
  const symbols = reviews.map((review) => review.symbol)
  const historyEntries = await Promise.all(symbols.map(async (symbol) => [symbol, await reviewHistory(symbol, 3)] as const))
  const history = Object.fromEntries(historyEntries)
  const currentStrategy = await latestStrategyVersion()
  const update = await evolveStrategy({
    current_strategy: currentStrategy,
    deviation_rules: {
      avoid_strategy_bad: "+5%",
      buy_bad: "-3%",
      buy_good: "+2%",
      hold_attention: "+/-5%",
    },
    deviations: deviations(history),
    latest_reviews: reviews.map(reviewSummary),
    performance_history: history,
    symbols,
  })
  const latestVersion = await prisma.strategyVersion.aggregate({ _max: { version: true } })
  const row = await prisma.strategyVersion.create({
    data: {
      rationale: update.rationale,
      runId,
      strategyJson: plainJson(update.strategy),
      version: (latestVersion._max.version ?? 0) + 1,
    },
  })
  return row.version
}

async function evolveStrategy(context: JsonRecord): Promise<StrategyUpdate> {
  const settings = getSettings()
  if (settings.aiMock) return { strategy: defaultStrategy(), rationale: "Mock-Strategie fuer lokale Tests." }
  if (!settings.openAiApiKey) throw new Error("OPENAI_API_KEY fehlt.")

  const output = await openAiJson<Partial<StrategyUpdate>>({
    prompt: [
      "Aktualisiere die Buy-and-Hold Bewertungsstrategie als JSON.",
      "Aendere sie nur, wenn Historie und Kursveraenderungen eine klare Verbesserung begruenden.",
      "Schema: strategy { summary, principles, buySignals, holdSignals, avoidSignals, riskRules, learningNotes }, rationale.",
      `Kontext: ${JSON.stringify(context)}`,
    ].join("\n"),
    settings,
  })
  return normalizeStrategyUpdate(output)
}

async function openAiJson<T>({ prompt, settings }: { prompt: string; settings: AlpacaSettings }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          role: "system",
          content: "Antworte ausschliesslich mit validem JSON ohne Markdown.",
        },
        { role: "user", content: prompt },
      ],
      model: settings.openAiModel,
    }),
    headers: {
      authorization: `Bearer ${settings.openAiApiKey}`,
      "content-type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(`OpenAI Fehler ${response.status}: ${await errorText(response)}`)
  }

  const body = await response.json() as JsonRecord
  return JSON.parse(openAiText(body)) as T
}

function openAiText(body: JsonRecord) {
  const outputText = optionalString(body.output_text)
  if (outputText) return outputText

  const output = Array.isArray(body.output) ? body.output : []
  for (const item of output) {
    const record = jsonRecord(item)
    const content = Array.isArray(record.content) ? record.content : []
    for (const contentItem of content) {
      const text = optionalString(jsonRecord(contentItem).text)
      if (text) return text
    }
  }
  throw new Error("OpenAI returned no JSON text.")
}

function decideBuy(analysis: AssetAnalysis, context: JsonRecord, runSpent = 0, maxNotional?: number): OrderDecision {
  const settings = getSettings()
  const account = jsonRecord(context.account)
  const buyingPower = numberValue(account.buying_power)
  const price = currentPrice(context)
  const checks = basicChecks(analysis, context, buyingPower)
  if (checks) return { should_buy: false, reason: checks, notional: 0 }

  let budget = buyBudget(analysis, buyingPower, runSpent, settings)
  if (maxNotional !== undefined) budget = Math.min(budget, maxNotional)
  if (budget <= 0) return { should_buy: false, reason: "buying power limit reached", notional: 0 }

  const qty = price > 0 ? Math.floor(budget / price) : 0
  if (qty < 1) return { should_buy: false, reason: "integer quantity below 1", notional: 0 }
  return { should_buy: true, reason: "integer share buy", notional: qty * price, qty }
}

function basicChecks(analysis: AssetAnalysis, context: JsonRecord, buyingPower: number) {
  const account = jsonRecord(context.account)
  const asset = jsonRecord(context.asset)
  const openBuyOrders = Array.isArray(context.open_buy_orders) ? context.open_buy_orders.map(jsonRecord) : []
  if (Boolean(account.trading_blocked)) return "account trading blocked"
  if (stringValue(asset.class) !== "us_equity") return "only US equities are supported in v1"
  if (!Boolean(asset.tradable) || stringValue(asset.status) !== "active") return "asset is not tradable and active"
  if (openBuyOrders.some((order) => stringValue(order.symbol) === analysis.symbol)) return "open buy order already exists"
  if (buyingPower <= 0) return "no buying power"
  if (analysis.action !== "buy") return `AI action is ${analysis.action}`
  if (analysis.confidence < MIN_CONFIDENCE) return "AI confidence below threshold"
  if (analysis.market_outlook !== "positive") return "market outlook is not positive"
  if (analysis.undervaluation_score < MIN_UNDERVALUATION) return "undervaluation score below threshold"
  if (analysis.risk_score > MAX_RISK) return "risk score above threshold"
  return null
}

function buyBudget(analysis: AssetAnalysis, buyingPower: number, runSpent: number, settings: AlpacaSettings) {
  const weeklyLeft = buyingPower * settings.maxWeeklyBpPct - runSpent
  const assetCap = buyingPower * settings.maxAssetBpPct
  const reserveLeft = buyingPower * (1 - settings.reserveBpPct) - runSpent
  const target = buyingPower * analysis.target_notional_pct
  return Math.round(Math.max(0, Math.min(weeklyLeft, assetCap, reserveLeft, target)) * 100) / 100
}

function currentPrice(context: JsonRecord) {
  const position = jsonRecord(context.position)
  const technicals = jsonRecord(context.technicals)
  return numberValue(position.current_price ?? technicals.last_close)
}

async function submitOrder(symbol: string, decision: OrderDecision, execute: boolean, client: AlpacaClient): Promise<OrderResult> {
  if (!decision.should_buy) return { submitted: false, skipped_reason: decision.reason }
  const payload = buildBuyOrder(symbol, decision)
  if (!execute) return { submitted: false, skipped_reason: "dry run", payload }

  const settings = getSettings()
  if (!settings.tradingEnabled || !settings.allowLiveTrading) {
    return { submitted: false, skipped_reason: "live trading guard disabled", payload }
  }
  const order = await client.placeOrder(payload)
  return { submitted: true, order_id: optionalString(order.id), payload }
}

function buildBuyOrder(symbol: string, decision: OrderDecision) {
  if (!decision.qty) throw new Error("whole-share qty missing")
  return {
    client_order_id: `ai-bh-${toDateString(new Date()).replaceAll("-", "")}-${symbol}-${crypto.randomUUID().slice(0, 8)}`.slice(0, 128),
    qty: String(decision.qty),
    side: "buy",
    symbol,
    time_in_force: "day",
    type: "market",
  } satisfies JsonRecord
}

async function saveReview(runId: number | null, review: AssetReviewResult) {
  await prisma.review.create({
    data: {
      analysisJson: plainJson(review.analysis),
      decisionJson: plainJson(review.decision),
      orderJson: plainJson(review.order),
      runId,
      symbol: review.symbol,
    },
  })
}

async function reviewSymbolsForRun(client: AlpacaClient) {
  const positions = await client.getPositions()
  const held = positions.map((item) => stringValue(item.symbol).toUpperCase()).filter(Boolean)
  return [...new Set([...held, ...getSettings().watchlist])].sort()
}

function reviewSummary(review: AssetReviewResult) {
  return {
    action: review.analysis.action,
    confidence: review.analysis.confidence,
    decision: review.decision,
    rating: review.analysis.rating,
    rationale: review.analysis.rationale,
    symbol: review.symbol,
  }
}

function deviations(history: Record<string, Awaited<ReturnType<typeof reviewHistory>>>) {
  return Object.entries(history).flatMap(([symbol, reviews]) => reviews.flatMap((review) => {
    if (review.priceChangePercent === null) return []
    const note = deviationNote(review.action, review.priceChangePercent)
    return note ? [{ action: review.action, note, priceChangePercent: review.priceChangePercent, symbol }] : []
  }))
}

function deviationNote(action: Action, change: number) {
  if (action === "buy" && change >= 0.02) return "buy entwickelte sich positiv"
  if (action === "buy" && change <= -0.03) return "buy entwickelte sich negativ"
  if (action === "hold" && Math.abs(change) >= 0.05) return "hold hatte auffaellige Bewegung"
  if (action === "avoid" && change >= 0.05) return "avoid stieg stark und sollte geprueft werden"
  return null
}

function normalizeAnalysis(value: unknown): AssetAnalysis {
  const record = jsonRecord(value)
  const action = actionValue(record.action)
  const marketOutlook = marketOutlookValue(record.market_outlook)
  return {
    action,
    confidence: clamp(numberValue(record.confidence), 0, 1),
    market_outlook: marketOutlook,
    rating: clamp(Math.round(numberValue(record.rating, 50)), 1, 100),
    rationale: stringValue(record.rationale || "Keine Begründung gespeichert."),
    risk_score: clamp(numberValue(record.risk_score), 0, 1),
    risks: Array.isArray(record.risks) ? record.risks.map(stringValue).slice(0, 6) : [],
    symbol: stringValue(record.symbol),
    target_notional_pct: clamp(numberValue(record.target_notional_pct), 0, 0.15),
    undervaluation_score: clamp(numberValue(record.undervaluation_score), 0, 1),
  }
}

function normalizeDecision(value: unknown): OrderDecision {
  const record = jsonRecord(value)
  return {
    notional: numberValue(record.notional),
    qty: optionalNumber(record.qty),
    reason: stringValue(record.reason),
    should_buy: Boolean(record.should_buy),
  }
}

function normalizeOrder(value: unknown): OrderResult {
  const record = jsonRecord(value)
  return {
    order_id: optionalString(record.order_id),
    payload: record.payload ? jsonRecord(record.payload) : undefined,
    skipped_reason: optionalString(record.skipped_reason),
    submitted: Boolean(record.submitted),
  }
}

function normalizeStrategyUpdate(value: Partial<StrategyUpdate>): StrategyUpdate {
  const strategy = jsonRecord(value.strategy)
  return {
    rationale: stringValue(value.rationale || "Strategie fortgeschrieben."),
    strategy: {
      avoidSignals: stringArray(strategy.avoidSignals),
      buySignals: stringArray(strategy.buySignals),
      holdSignals: stringArray(strategy.holdSignals),
      learningNotes: stringArray(strategy.learningNotes),
      principles: stringArray(strategy.principles),
      riskRules: stringArray(strategy.riskRules),
      summary: stringValue(strategy.summary || defaultStrategy().summary),
    },
  }
}

function defaultStrategy(): StrategyData {
  return {
    avoidSignals: ["Schwache Datenlage, hohes Risiko oder negative Marktstruktur."],
    buySignals: ["Hohe Bewertung, positive Marktstruktur und tragbares Risiko."],
    holdSignals: ["Solide Position ohne klaren neuen Zukaufvorteil."],
    learningNotes: ["Neue Runs vergleichen Empfehlung und nachfolgende Kursveraenderung."],
    principles: [
      "Nur kaufen, wenn Datenlage, Qualitaet und Risiko zusammenpassen.",
      "Bestehende Positionen nicht wegen kurzfristiger Volatilitaet ueberreagieren.",
    ],
    riskRules: ["Grosse Abweichungen zwischen Empfehlung und Kursentwicklung pruefen."],
    summary: "Konservativ bewerten, Qualitaet und Risiko hoeher gewichten als kurzfristige Kursbewegungen.",
  }
}

function mockAnalysis(symbol: string): AssetAnalysis {
  return {
    action: "hold",
    confidence: 0.68,
    market_outlook: "neutral",
    rating: 72,
    rationale: "Mock-Bewertung fuer lokale Tests ohne OpenAI-Key.",
    risk_score: 0.38,
    risks: ["AI_MOCK_RESPONSES ist aktiv"],
    symbol,
    target_notional_pct: 0,
    undervaluation_score: 0.52,
  }
}

function getSettings(): AlpacaSettings {
  return {
    aiMock: boolEnv("AI_MOCK_RESPONSES"),
    alpacaDataEndpoint: stringEnv("ALPACA_DATA_ENDPOINT", LOCAL_ALPACA_DATA_ENDPOINT).replace(/\/+$/, ""),
    alpacaEndpoint: stringEnv("ALPACA_ENDPOINT", LOCAL_ALPACA_ENDPOINT).replace(/\/+$/, ""),
    alpacaKey: stringEnv("ALPACA_KEY"),
    alpacaSecret: stringEnv("ALPACA_SECRET"),
    allowLiveTrading: boolEnv("ALPACA_ALLOW_LIVE_TRADING"),
    maxAssetBpPct: floatEnv("MAX_ASSET_BP_PCT", 0.15),
    maxWeeklyBpPct: floatEnv("MAX_WEEKLY_BP_PCT", 0.5),
    openAiApiKey: stringEnv("OPENAI_API_KEY"),
    openAiModel: stringEnv("OPENAI_MODEL", "gpt-5.5"),
    reserveBpPct: floatEnv("RESERVE_BP_PCT", 0.05),
    tradingEnabled: boolEnv("TRADING_ENABLED"),
    watchlist: stringEnv("AI_WATCHLIST").split(",").map((item) => item.trim().toUpperCase()).filter(Boolean).sort(),
  }
}

function sma(values: number[], window: number) {
  if (values.length < window) return null
  return sumBy(values.slice(-window), (item) => item) / window
}

function momentum(values: number[], lookback: number) {
  if (lookback <= 0 || values.length <= lookback) return null
  const start = values[values.length - lookback - 1]
  return start ? (values.at(-1)! - start) / start : null
}

function annualizedVolatility(values: number[]) {
  const returns = values.flatMap((value, index) => {
    if (index === 0 || !values[index - 1]) return []
    return [(value - values[index - 1]) / values[index - 1]]
  })
  if (returns.length < 2) return null
  const avg = sumBy(returns, (item) => item) / returns.length
  const variance = sumBy(returns, (item) => (item - avg) ** 2) / returns.length
  return Math.sqrt(variance) * Math.sqrt(252)
}

function actionValue(value: unknown): Action {
  return value === "buy" || value === "avoid" || value === "hold" ? value : "hold"
}

function marketOutlookValue(value: unknown): MarketOutlook {
  return value === "positive" || value === "negative" || value === "neutral" ? value : "neutral"
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : []
}

function jsonRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
}

function plainJson(value: unknown): InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as InputJsonValue
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : value === undefined || value === null ? "" : String(value)
}

function optionalString(value: unknown) {
  const text = stringValue(value)
  return text || undefined
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function optionalNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function boolEnv(name: string, fallback = false) {
  const value = process.env[name]
  return value === undefined ? fallback : ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
}

function floatEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback)
  return Number.isFinite(value) ? value : fallback
}

function stringEnv(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function dateAtUtcMidnight(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function toDateString(date: Date) {
  return dateAtUtcMidnight(date).toISOString().slice(0, 10)
}

function parseBarDate(value: unknown) {
  return dateAtUtcMidnight(new Date(stringValue(value).slice(0, 10)))
}

async function errorText(response: Response) {
  try {
    const body = await response.json() as JsonRecord
    return stringValue(body.message || body.error || JSON.stringify(body))
  } catch {
    return await response.text()
  }
}
