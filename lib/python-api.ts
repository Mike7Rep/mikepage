import { cacheLife, cacheTag } from "next/cache"

import { prisma } from "@/lib/prisma"

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
}

type AlpacaClient = ReturnType<typeof createAlpacaClient>

const LOCAL_ALPACA_ENDPOINT = "https://api.alpaca.markets"
const LOCAL_ALPACA_DATA_ENDPOINT = "https://data.alpaca.markets"

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

function getSettings(): AlpacaSettings {
  return {
    alpacaDataEndpoint: stringEnv("ALPACA_DATA_ENDPOINT", LOCAL_ALPACA_DATA_ENDPOINT).replace(/\/+$/, ""),
    alpacaEndpoint: stringEnv("ALPACA_ENDPOINT", LOCAL_ALPACA_ENDPOINT).replace(/\/+$/, ""),
    alpacaKey: stringEnv("ALPACA_KEY"),
    alpacaSecret: stringEnv("ALPACA_SECRET"),
  }
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
