import { cacheLife, cacheTag } from "next/cache"

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
  "use cache"
  cacheLife("hours")
  cacheTag("dashboard:portfolio")

  return apiFetch<AlpacaDashboardData>("/api/portfolio")
}

export async function getAssetChart(symbol: string) {
  "use cache"
  const normalizedSymbol = symbol.trim().toUpperCase()
  cacheLife("hours")
  cacheTag("dashboard:asset-chart", `dashboard:asset-chart:${normalizedSymbol}`)

  return apiFetch<AssetChartData>(`/api/assets/${encodeURIComponent(normalizedSymbol)}/chart`)
}

const LOCAL_PYTHON_API_URL = "http://localhost:8000"
const DEFAULT_RAILWAY_API_SERVICE = "pythonapi"
const DEFAULT_RAILWAY_API_PORT = "8080"
const KNOWN_WEB_APP_DOMAINS = ["michael-repolusk.com", "www.michael-repolusk.com"]

async function apiFetch<T>(path: string): Promise<T> {
  const baseUrl = getPythonApiBaseUrl()
  const token = process.env.PYTHON_API_TOKEN

  if (!token) {
    throw new Error("PYTHON_API_TOKEN fehlt.")
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: {
        accept: "application/json",
        "X-Internal-Token": token,
      },
    })
  } catch (error) {
    throw new Error(formatNetworkError(baseUrl, path, error))
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      formatHttpError({
        baseUrl,
        body,
        contentType: response.headers.get("content-type"),
        path,
        status: response.status,
        statusText: response.statusText,
      }),
    )
  }

  return response.json() as Promise<T>
}

function getPythonApiBaseUrl() {
  const rawBaseUrl = process.env.PYTHON_API_URL?.trim()
  const rawValue = rawBaseUrl || getDefaultPythonApiUrl()

  if (/^PYTHON_API_URL\s*=/.test(rawValue)) {
    throw new Error(
      "PYTHON_API_URL ist ungueltig. In Railway muss der Variablenname PYTHON_API_URL sein und der Wert nur die URL, z. B. http://pythonapi.railway.internal:8080.",
    )
  }

  const baseUrl = rawValue.replace(/\/+$/, "")
  let url: URL

  try {
    url = new URL(baseUrl)
  } catch {
    throw new Error(
      "PYTHON_API_URL ist ungueltig. In Railway muss der Name PYTHON_API_URL sein und der Wert nur die URL.",
    )
  }

  validatePythonApiUrl(url)
  return baseUrl
}

function getDefaultPythonApiUrl() {
  if (!isRailwayRuntime()) {
    return LOCAL_PYTHON_API_URL
  }

  const serviceName = process.env.PYTHON_API_RAILWAY_SERVICE?.trim() || DEFAULT_RAILWAY_API_SERVICE
  const port = process.env.PYTHON_API_PORT?.trim() || DEFAULT_RAILWAY_API_PORT

  if (!/^[a-zA-Z0-9-]+$/.test(serviceName) || !/^\d+$/.test(port)) {
    throw new Error(
      "PYTHON_API_RAILWAY_SERVICE oder PYTHON_API_PORT ist ungueltig. Erwartet wird z. B. pythonapi und 8080.",
    )
  }

  return `http://${serviceName}.railway.internal:${port}`
}

function validatePythonApiUrl(url: URL) {
  const host = url.hostname.toLowerCase()

  if (host.endsWith(".railway.internal") && url.protocol !== "http:") {
    throw new Error(
      "PYTHON_API_URL muss fuer Railway Private Networking http:// verwenden, z. B. http://pythonapi.railway.internal:8080.",
    )
  }

  if (isRailwayRuntime() && isLikelyWebAppHost(host)) {
    throw new Error(
      `PYTHON_API_URL zeigt auf die Web-App (${url.origin}). Setze im Railway-Web-Service stattdessen die interne Python-API, z. B. http://pythonapi.railway.internal:8080.`,
    )
  }
}

function isRailwayRuntime() {
  return Boolean(process.env.RAILWAY_ENVIRONMENT_ID || process.env.RAILWAY_PROJECT_ID)
}

function isLikelyWebAppHost(host: string) {
  const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim().toLowerCase()
  const publicHost = railwayPublicDomain ? railwayPublicDomain.replace(/^https?:\/\//, "").split("/")[0] : ""

  return host === publicHost || KNOWN_WEB_APP_DOMAINS.includes(host)
}

function formatNetworkError(baseUrl: string, path: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unbekannter Netzwerkfehler"

  return [
    `Python API konnte ${baseUrl}${path} nicht erreichen: ${message}.`,
    "In Railway muss PYTHON_API_URL auf den internen API-Service zeigen, z. B. http://pythonapi.railway.internal:8080.",
  ].join(" ")
}

function formatHttpError({
  baseUrl,
  body,
  contentType,
  path,
  status,
  statusText,
}: {
  baseUrl: string
  body: string
  contentType: string | null
  path: string
  status: number
  statusText: string
}) {
  if (status === 404 && looksLikeHtml(body, contentType)) {
    return [
      `Python API Fehler 404 fuer ${baseUrl}${path}.`,
      "Die Antwort ist eine HTML/Next.js-404-Seite statt JSON.",
      "PYTHON_API_URL zeigt wahrscheinlich auf die Web-App. Setze im Railway-Web-Service z. B. http://pythonapi.railway.internal:8080.",
    ].join(" ")
  }

  const compactBody = body.replace(/\s+/g, " ").trim()
  const detail = compactBody ? compactBody.slice(0, 320) : statusText

  return `Python API Fehler ${status}: ${detail}`
}

function looksLikeHtml(body: string, contentType: string | null) {
  return Boolean(
    contentType?.includes("text/html") || /<!doctype html|<html[\s>]/i.test(body),
  )
}
