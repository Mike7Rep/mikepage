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
