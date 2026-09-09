import type { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { alpacaAccountKey, createAlpacaClient, type DashboardPosition } from "@/lib/python-api"
import { cashAvailable, equitySeries, requiredNumber, sixMonthsAgo, tradingDate, type BrokerRecord } from "@/lib/depot-calculations"

export function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export type DepotPoint = {
  date: string; equity: number; capital: number | null; cash: number | null
  marketValue: number | null; costBasis: number | null; observedAt: string | null
}
export type DepotFill = {
  id: string; symbol: string; side: "buy" | "sell"; date: string; timestamp: string; qty: number; price: number
}
export type DepotData = {
  points: DepotPoint[]; fills: DepotFill[]; lastSyncedAt: string | null; warnings: string[]
}
export type TradingAccount = {
  accountKey: string; currency: string; cash: number; available: number
  equity: number; marketOpen: boolean; paper: boolean; canTrade: boolean; blockedReason: string | null
  positions: DashboardPosition[]
}

export async function getTradingAccount(): Promise<TradingAccount> {
  const client = createAlpacaClient()
  const [account, positions, orders, clock] = await Promise.all([
    client.getAccount(), client.getPositions(), client.getOrders(), client.getClock(),
  ])
  const paper = new URL(process.env.ALPACA_ENDPOINT || "https://api.alpaca.markets").hostname === "paper-api.alpaca.markets"
  const blockedReason = account.trading_blocked || account.account_blocked || account.trade_suspended_by_user || account.status !== "ACTIVE"
    ? "Das Alpaca-Konto ist für den Handel gesperrt."
    : !paper && process.env.ALPACA_ALLOW_LIVE_TRADING !== "true"
      ? "Live-Handel ist noch nicht freigeschaltet (ALPACA_ALLOW_LIVE_TRADING=true)."
      : orders.length >= 500 ? "Zu viele offene Orders für eine vollständige Guthabenprüfung." : null
  return {
    accountKey: alpacaAccountKey(account), currency: String(account.currency ?? "USD"),
    cash: requiredNumber(account.cash, "Cash"), available: cashAvailable(account, orders),
    equity: requiredNumber(account.equity, "Depotwert"), marketOpen: clock.is_open === true,
    paper, canTrade: !blockedReason, blockedReason,
    positions: positions.map((position) => ({
      asset: String(position.symbol), name: String(position.symbol),
      qty: requiredNumber(position.qty, "Stückzahl"), entryPrice: requiredNumber(position.avg_entry_price, "Einstand"),
      currentPrice: requiredNumber(position.current_price, "Aktueller Kurs"),
      marketValue: requiredNumber(position.market_value, "Positionswert"), costBasis: requiredNumber(position.cost_basis, "Einstand"),
      unrealizedPl: requiredNumber(position.unrealized_pl, "Gewinn/Verlust"),
      unrealizedPlPercent: requiredNumber(position.unrealized_plpc, "Gewinn/Verlust"),
    })),
  }
}

export async function getDepotData(accountKey: string): Promise<DepotData> {
  const cutoff = sixMonthsAgo()
  const [snapshots, activities] = await Promise.all([
    prisma.depotSnapshot.findMany({ where: { accountKey, date: { gte: cutoff } }, orderBy: { date: "asc" } }),
    prisma.depotActivity.findMany({ where: { accountKey, date: { gte: cutoff } }, orderBy: { date: "asc" } }),
  ])
  const points = snapshots.map((row) => ({
    date: row.date.toISOString().slice(0, 10), equity: Number(row.equity),
    capital: row.capital === null ? null : Number(row.capital),
    cash: row.cash === null ? null : Number(row.cash),
    marketValue: row.marketValue === null ? null : Number(row.marketValue),
    costBasis: row.costBasis === null ? null : Number(row.costBasis),
    observedAt: row.observedAt?.toISOString() ?? null,
  }))
  const fills = activities.flatMap(({ activityId, date, data }) => {
    const item = data as BrokerRecord
    if (item.activity_type !== "FILL" || !["buy", "sell"].includes(String(item.side))) return []
    return [{
      id: activityId, symbol: String(item.symbol), side: item.side as "buy" | "sell",
      date: date.toISOString().slice(0, 10), timestamp: String(item.transaction_time),
      qty: requiredNumber(item.qty, "Ausgeführte Stückzahl"), price: requiredNumber(item.price, "Ausführungskurs"),
    }]
  })
  const warnings = ["Einkaufswerte und Aktienbestände werden ab der ersten Synchronisierung aufgezeichnet. Frühere Werte bleiben offen."]
  if (activities.some((row) => ["ACATS", "FOPT", "JNLC", "JNLS", "JNL"].includes(String((row.data as BrokerRecord).activity_type)))) {
    warnings.push("Wertpapierüberträge oder Umbuchungen vorhanden: Der Kapitalvergleich wird ausgeblendet, bis diese Bewegungen zugeordnet sind.")
  }
  return {
    points, fills: fills.sort((a, b) => a.timestamp.localeCompare(b.timestamp)), warnings,
    lastSyncedAt: snapshots.reduce<string | null>((latest, row) => {
      const at = row.observedAt?.toISOString() ?? null
      return at && (!latest || at > latest) ? at : latest
    }, null),
  }
}

export async function syncDepot(accountKey: string) {
  const client = createAlpacaClient()
  const now = new Date()
  const cutoff = sixMonthsAgo(now)
  const start = cutoff.toISOString().slice(0, 10)
  const today = tradingDate(now)
  const [account, positions, history, activities] = await Promise.all([
    client.getAccount(), client.getPositions(),
    client.getHistory(`${start}T12:00:00Z`, now.toISOString()),
    client.getActivities(undefined, start, now.toISOString()),
  ])
  if (alpacaAccountKey(account) !== accountKey) throw new Error("Das Alpaca-Konto wurde gewechselt. Bitte neu starten.")
  const currency = String(account.currency ?? "USD")
  const points = equitySeries(history, activities, start, today)
  const complexTransfers = activities.some((item) => ["ACATS", "FOPT", "JNLC", "JNLS", "JNL"].includes(String(item.activity_type)))
  const sum = (field: string) => positions.reduce((total, position) => total + requiredNumber(position[field], field), 0)
  const current = {
    equity: requiredNumber(account.equity, "Depotwert"), cash: requiredNumber(account.cash, "Cash"),
    marketValue: sum("market_value"), costBasis: sum("cost_basis"),
    positions: jsonValue(positions.map((p) => ({
      symbol: p.symbol, qty: p.qty, cost_basis: p.cost_basis, market_value: p.market_value,
      current_price: p.current_price, avg_entry_price: p.avg_entry_price,
    }))), observedAt: now, currency,
  }
  const last = points.at(-1)
  const currentCapital = last ? last.capital + activities.filter((item) =>
    ["CSD", "CSW", "ACATC"].includes(String(item.activity_type)) && String(item.date).slice(0, 10) > last.date,
  ).reduce((total, item) => total + requiredNumber(item.net_amount, "Kapitalbewegung"), 0) : current.equity
  await prisma.$transaction(async (tx) => {
    for (const point of points) {
      const date = new Date(`${point.date}T00:00:00Z`)
      const data = { equity: point.equity, capital: complexTransfers ? null : point.capital, currency }
      await tx.depotSnapshot.upsert({ where: { accountKey_date: { accountKey, date } }, create: { accountKey, date, ...data }, update: data })
    }
    const date = new Date(`${today}T00:00:00Z`)
    const currentData = { ...current, capital: complexTransfers ? null : currentCapital }
    await tx.depotSnapshot.upsert({ where: { accountKey_date: { accountKey, date } }, create: { accountKey, date, ...currentData }, update: currentData })
    for (const activity of activities) {
      const day = activity.transaction_time ? tradingDate(String(activity.transaction_time)) : String(activity.date).slice(0, 10)
      if (day < start || day > today) continue
      if (!activity.id || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Eine Kontobewegung hat keine gültige ID oder kein Datum.")
      const activityId = String(activity.id)
      const data = { date: new Date(`${day}T00:00:00Z`), data: jsonValue(activity) }
      await tx.depotActivity.upsert({ where: { accountKey_activityId: { accountKey, activityId } }, create: { accountKey, activityId, ...data }, update: data })
    }
    await tx.depotSnapshot.deleteMany({ where: { accountKey, date: { lt: cutoff } } })
    await tx.depotActivity.deleteMany({ where: { accountKey, date: { lt: cutoff } } })
    await tx.assetPriceBar.deleteMany({ where: { date: { lt: cutoff } } })
    const oldRuns = { accountKey, kind: { startsWith: "ai-trader:" }, createdAt: { lt: cutoff } }
    await tx.review.deleteMany({ where: { run: oldRuns } })
    await tx.run.deleteMany({ where: oldRuns })
    await tx.depotOrder.deleteMany({ where: { accountKey, createdAt: { lt: cutoff }, status: { in: ["preview", "filled", "canceled", "expired", "rejected", "replaced"] } } })
  }, { timeout: 60_000 })
  return { symbols: positions.filter((p) => p.asset_class === "us_equity").map((p) => String(p.symbol)).sort(), points: points.length, activities: activities.length }
}

export async function syncSymbolBars(symbol: string) {
  const cutoff = sixMonthsAgo()
  const now = new Date()
  // Exclude the unfinished current trading day, including the latest 15 minutes.
  const today = tradingDate(now)
  const result = await createAlpacaClient().getStockBars([symbol], cutoff.toISOString(), new Date(now.getTime() - 16 * 60_000).toISOString())
  const bars = (result.bars[symbol] ?? []).map((bar) => ({
    date: String(bar.t).slice(0, 10),
    open: requiredNumber(bar.o, "Eröffnungskurs"), high: requiredNumber(bar.h, "Tageshoch"),
    low: requiredNumber(bar.l, "Tagestief"), close: requiredNumber(bar.c, "Schlusskurs"),
    volume: requiredNumber(bar.v, "Volumen"),
  })).filter((bar) => bar.date >= cutoff.toISOString().slice(0, 10) && bar.date < today)
  if (!bars.length) throw new Error("Keine abgeschlossenen Tageskurse verfügbar.")
  await prisma.$transaction(bars.map((bar) => {
    const date = new Date(`${bar.date}T00:00:00Z`)
    const data = { ...bar, date, source: "alpaca" }
    return prisma.assetPriceBar.upsert({ where: { symbol_date: { symbol, date } }, create: { symbol, ...data }, update: data })
  }))
  return bars
}
