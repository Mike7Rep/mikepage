import { cacheLife, cacheTag } from "next/cache"
import { createHash } from "node:crypto"

import { prisma } from "@/lib/prisma"
import { sixMonthsAgo, tradingDate } from "@/lib/depot-calculations"

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
  accountKey: string
  currency: string
  currentValue: number
  cash: number
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
    accountKey: alpacaAccountKey(account),
    currency: stringValue(account.currency || "USD").toUpperCase(),
    currentValue: current,
    cash: numberValue(account.cash),
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
  const start = sixMonthsAgo(end)
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
  const chartBars = bars.map(barFromAlpaca)
  const position = positions.find((item) => stringValue(item.symbol).toUpperCase() === normalizedSymbol)
  const positionAverage = optionalNumber(position?.avg_entry_price)
  const snapshots = await prisma.depotSnapshot.findMany({
    where: { accountKey: alpacaAccountKey(account), date: { gte: start }, observedAt: { not: null } },
    select: { date: true, positions: true },
  })
  const entryPrices = new Map(snapshots.map((snapshot) => {
    const held = (snapshot.positions as JsonRecord[] | null)?.find((item) => item.symbol === normalizedSymbol)
    return [snapshot.date.toISOString().slice(0, 10), held ? optionalNumber(held.avg_entry_price) : null]
  }))
  for (const bar of chartBars) bar.averageEntryPrice = entryPrices.get(bar.date) ?? null

  return {
    symbol: normalizedSymbol,
    name: stringValue(asset.name || normalizedSymbol),
    currency: stringValue(account.currency || "USD").toUpperCase(),
    periodStart: toDateString(start),
    periodEnd: toDateString(end),
    averageEntryPrice: positionAverage,
    bars: chartBars,
    fills: chartFills,
  } satisfies AssetChartData
}

export class AlpacaRequestError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export function alpacaAccountKey(account: JsonRecord) {
  if (!account.id) throw new Error("Alpaca-Konto konnte nicht identifiziert werden.")
  return createHash("sha256").update(`${getSettings().alpacaEndpoint}:${account.id}`).digest("hex")
}

export function createAlpacaClient(settings: AlpacaSettings = getSettings()) {
  async function request<T>(method: string, base: string, path: string, init: RequestInit = {}) {
    if (!settings.alpacaEndpoint || !settings.alpacaKey || !settings.alpacaSecret) {
      throw new Error("Alpaca ENV fehlt.")
    }

    const response = await fetch(`${base}${path}`, {
      ...init,
      method,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(30_000),
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": settings.alpacaKey,
        "APCA-API-SECRET-KEY": settings.alpacaSecret,
        ...(init.headers ?? {}),
      },
    })

    if (!response.ok) {
      throw new AlpacaRequestError(response.status, `Alpaca Fehler ${response.status}: ${await errorText(response)}`)
    }
    return response.json() as Promise<T>
  }

  async function getActivities(types?: string, after?: string, until?: string) {
    const rows: JsonRecord[] = []
    let token = ""
    while (true) {
      const params = new URLSearchParams({ direction: "asc", page_size: "100" })
      if (types) params.set("activity_types", types)
      if (after) params.set("after", after)
      if (until) params.set("until", until)
      if (token) params.set("page_token", token)
      const page = await request<JsonRecord[]>("GET", settings.alpacaEndpoint, `/v2/account/activities?${params}`)
      rows.push(...page)
      if (page.length < 100) return rows
      const next = String(page.at(-1)?.id ?? "")
      if (!next || next === token || rows.length > 100_000) throw new Error("Alpaca-Aktivitäten konnten nicht vollständig geladen werden.")
      token = next
    }
  }

  return {
    getActivities,
    getHistory: (start: string, end: string) => request<JsonRecord>("GET", settings.alpacaEndpoint, `/v2/account/portfolio/history?${new URLSearchParams({ start, end, timeframe: "1D", cashflow_types: "ALL" })}`),
    getAccount: () => request<JsonRecord>("GET", settings.alpacaEndpoint, "/v2/account"),
    getPositions: () => request<JsonRecord[]>("GET", settings.alpacaEndpoint, "/v2/positions"),
    getAsset: (symbolOrId: string) => request<JsonRecord>("GET", settings.alpacaEndpoint, `/v2/assets/${encodeURIComponent(symbolOrId)}`),
    getCashActivities: () => getActivities("CSD,CSW"),
    getFillActivities: async (symbol: string, after: string) => {
      const activities = await getActivities("FILL", after)
      return activities.filter((item) => stringValue(item.symbol).toUpperCase() === symbol.toUpperCase())
    },
    getStockBars: async (symbols: string[], start: string, end?: string) => {
      const params = new URLSearchParams({
        adjustment: "all",
        feed: "iex",
        limit: "10000",
        start,
        symbols: symbols.join(","),
        timeframe: "1Day",
      })
      if (end) params.set("end", end)
      const bars: Record<string, JsonRecord[]> = {}
      let token = ""
      do {
        if (token) params.set("page_token", token)
        const page = await request<{ bars?: Record<string, JsonRecord[]>; next_page_token?: string }>("GET", settings.alpacaDataEndpoint, `/v2/stocks/bars?${params}`)
        for (const [symbol, rows] of Object.entries(page.bars ?? {})) bars[symbol] = [...(bars[symbol] ?? []), ...rows]
        if (page.next_page_token && page.next_page_token === token) throw new Error("Alpaca-Kursdaten konnten nicht vollständig geladen werden.")
        token = page.next_page_token ?? ""
      } while (token)
      return { bars }
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
    date: tradingDate(timestamp),
    transactionTime: timestamp,
    qty,
    price,
    notional: Math.round(Math.abs(qty * price) * 100) / 100,
  }
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
