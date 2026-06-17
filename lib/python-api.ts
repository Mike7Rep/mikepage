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
  analysis: {
    rating: number
    action: "buy" | "hold" | "avoid"
    confidence: number
    market_outlook: "positive" | "neutral" | "negative"
    rationale: string
  }
  decision: {
    should_buy: boolean
    reason: string
    notional: number
  }
  order: {
    submitted: boolean
    skipped_reason?: string
    order_id?: string
  }
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
  side: "buy" | "sell"
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

export async function getDashboardPortfolio() {
  return apiFetch<AlpacaDashboardData>("/api/portfolio")
}

export async function getAssetChart(symbol: string) {
  return apiFetch<AssetChartData>(`/api/assets/${encodeURIComponent(symbol)}/chart`)
}

async function apiFetch<T>(path: string): Promise<T> {
  const baseUrl = getPythonApiBaseUrl()
  const token = process.env.PYTHON_API_TOKEN

  if (!token) {
    throw new Error("PYTHON_API_TOKEN fehlt.")
  }

  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "X-Internal-Token": token,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Python API Fehler ${response.status}: ${body || response.statusText}`)
  }

  return response.json() as Promise<T>
}

function getPythonApiBaseUrl() {
  const rawBaseUrl = process.env.PYTHON_API_URL || "http://localhost:8000"
  const baseUrl = rawBaseUrl.trim().replace(/^PYTHON_API_URL=/, "").replace(/\/+$/, "")

  try {
    new URL(baseUrl)
  } catch {
    throw new Error(
      "PYTHON_API_URL ist ungueltig. In Railway muss der Name PYTHON_API_URL sein und der Wert nur die URL.",
    )
  }

  return baseUrl
}
