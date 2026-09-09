export type BrokerRecord = Record<string, unknown>

export function sixMonthsAgo(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1))
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(now.getUTCDate(), lastDay))
  return date
}

export function tradingDate(value: string | number | Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value))
  const part = (type: string) => parts.find((item) => item.type === type)!.value
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function requiredNumber(value: unknown, label: string) {
  if (!["number", "string"].includes(typeof value) || String(value).trim() === "" || !Number.isFinite(Number(value))) {
    throw new Error(`${label}: Alpaca liefert keinen gültigen Wert.`)
  }
  return Number(value)
}

export function orderQuantity(value: unknown) {
  const text = String(value).trim().replace(",", ".")
  if (!/^\d{1,10}(\.\d{1,9})?$/.test(text) || Number(text) <= 0) {
    throw new Error("Bitte eine positive Stückzahl mit höchstens 9 Nachkommastellen eingeben.")
  }
  return text
}

export function cashAvailable(account: BrokerRecord, orders: BrokerRecord[]) {
  // Buying power may include margin; cash must also cover existing buy orders.
  const reserved = orders.filter((order) => order.side === "buy").reduce((sum, order) => {
    if (order.notional != null) return sum + requiredNumber(order.notional, "Offener Kaufbetrag")
    const remaining = requiredNumber(order.qty, "Offene Stückzahl") - Number(order.filled_qty ?? 0)
    const price = Number(order.limit_price ?? order.stop_price ?? 0)
    return price > 0 ? sum + Math.max(0, remaining) * price : Infinity
  }, 0)
  return Math.max(0, Math.min(
    requiredNumber(account.cash, "Cash") - reserved,
    requiredNumber(account.buying_power, "Kaufkraft"),
    requiredNumber(account.non_marginable_buying_power ?? account.buying_power, "Kaufkraft ohne Margin"),
  ))
}

export type EquityPoint = { date: string; equity: number; capital: number }

export function equitySeries(history: BrokerRecord, activities: BrokerRecord[], cutoff: string, today: string): EquityPoint[] {
  if (!Array.isArray(history.timestamp) || !Array.isArray(history.equity) || history.timestamp.length !== history.equity.length) {
    throw new Error("Die Depot-Historie ist unvollständig.")
  }
  const equity = history.equity
  const points = history.timestamp.map((timestamp, index) => ({
    date: tradingDate(Number(timestamp) * 1000),
    equity: requiredNumber(equity[index], "Historischer Depotwert"),
  })).filter((point) => point.date >= cutoff && point.date < today)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (!points.length) return []
  const flows = activities.filter((item) => ["CSD", "CSW", "ACATC"].includes(String(item.activity_type)))
    .map((item) => ({ date: String(item.date ?? item.transaction_time).slice(0, 10), amount: requiredNumber(item.net_amount, "Kapitalbewegung") }))
  let capital = points[0].equity
  let previous = points[0].date
  return points.map((point) => {
    capital += flows.filter((flow) => flow.date > previous && flow.date <= point.date).reduce((sum, flow) => sum + flow.amount, 0)
    previous = point.date
    return { ...point, capital }
  })
}

export function decisionFeedback(previous: { action: string; date: string } | null, bars: { date: string; close: number }[]) {
  if (!previous) return null
  // Both ends use the same freshly adjusted series, avoiding split-induced returns.
  const first = bars.find((bar) => bar.date >= previous.date)
  const last = bars.at(-1)
  if (!first || !last || first.date >= last.date || first.close <= 0) return null
  return {
    action: previous.action, from: first.date, to: last.date,
    priceReturnPercent: (last.close / first.close - 1) * 100,
    note: "Kursentwicklung ab dem ersten Tageskurs nach der Bewertung; keine realisierte Strategie-Rendite und kein Beweis für die Qualität einer langfristigen Entscheidung.",
  }
}
