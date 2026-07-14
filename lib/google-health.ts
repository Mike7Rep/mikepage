import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

import { prisma } from "@/lib/prisma"

export const GOOGLE_HEALTH_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly"
export const GOOGLE_HEALTH_STATE_COOKIE = "mydashboard_google_health_state"
export const GOOGLE_HEALTH_COOKIE_PATH = "/myDashboard/google-health"

export type HeartRateChartRange = "1m" | "3m" | "6m" | "1y" | "max"

export type HeartRateChartPoint = {
  measuredAt: string
  bpm: number
}

export type HeartRateChartSeries = Record<HeartRateChartRange, HeartRateChartPoint[]>

export type GoogleHealthStatus =
  | { state: "configuration_missing"; missing: string[] }
  | { state: "not_connected" }
  | {
      state: "connected" | "expired"
      connectedAt: string
      lastSyncedAt: string | null
      refreshTokenExpiresAt: string | null
    }

type GoogleHealthTokenResponse = {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope?: string
  token_type?: string
}

type GoogleHealthDataPoint = {
  dataSource?: {
    platform?: string
    recordingMethod?: string
  }
  heartRate?: {
    beatsPerMinute?: string
    sampleTime?: {
      physicalTime?: string
    }
  }
}

type GoogleHealthDataResponse = {
  dataPoints?: GoogleHealthDataPoint[]
  nextPageToken?: string
}

type AggregatedHeartRateRow = {
  measuredAt: Date
  bpm: number
}

const HEALTH_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/heart-rate/dataPoints"
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const CONNECTION_ID = 1
const DAY_MS = 24 * 60 * 60 * 1_000
const MINUTE_MS = 60 * 1_000
const MAX_QUERY_WINDOW_MS = 14 * DAY_MS
const INITIAL_SYNC_DAYS = 30
const SYNC_OVERLAP_MS = DAY_MS
const SYNC_THROTTLE_MS = MINUTE_MS
const INSERT_BATCH_SIZE = 2_000

const chartRanges: HeartRateChartRange[] = ["1m", "3m", "6m", "1y", "max"]
const chartBuckets: Record<HeartRateChartRange, string> = {
  "1m": "1 hour",
  "3m": "3 hours",
  "6m": "6 hours",
  "1y": "12 hours",
  max: "1 day",
}

export function getGoogleHealthConfig() {
  const clientId = readEnv("GOOGLE_CLIENT_ID")
  const clientSecret = readEnv("GOOGLE_CLIENT_KEY")
  const encryptionSecret = readEnv("MYDASHBOARD_SESSION_SECRET")
  const missing = [
    clientId ? null : "GOOGLE_CLIENT_ID",
    clientSecret ? null : "GOOGLE_CLIENT_KEY",
    encryptionSecret ? null : "MYDASHBOARD_SESSION_SECRET",
  ].filter(Boolean) as string[]

  return {
    clientId,
    clientSecret,
    configured: missing.length === 0,
    encryptionSecret,
    missing,
  }
}

export function googleHealthRedirectUri(requestOrigin: string) {
  const configured = readEnv("GOOGLE_HEALTH_REDIRECT_URI")
  if (configured) return configured
  return new URL("/myDashboard/google-health/callback", requestOrigin).toString()
}

export function googleHealthAuthorizationUrl(redirectUri: string, state: string) {
  const config = requireGoogleHealthConfig()
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("client_id", config.clientId)
  url.searchParams.set("include_granted_scopes", "true")
  url.searchParams.set("prompt", "consent")
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", GOOGLE_HEALTH_SCOPE)
  url.searchParams.set("state", state)
  return url
}

export async function saveGoogleHealthAuthorizationCode(code: string, redirectUri: string) {
  const config = requireGoogleHealthConfig()
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  })
  const response = await fetch(GOOGLE_TOKEN_URL, {
    body,
    cache: "no-store",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  })
  const tokens = await googleJson<GoogleHealthTokenResponse>(response, "Google OAuth konnte nicht abgeschlossen werden.")
  const existing = await prisma.googleHealthConnection.findUnique({ where: { id: CONNECTION_ID } })
  const refreshTokenCiphertext = tokens.refresh_token
    ? encryptRefreshToken(tokens.refresh_token, config.encryptionSecret)
    : existing?.refreshTokenCiphertext

  if (!refreshTokenCiphertext) {
    throw new Error("Google hat kein Refresh-Token geliefert. Bitte die Verbindung erneut bestätigen.")
  }

  if (tokens.scope && !tokens.scope.split(" ").includes(GOOGLE_HEALTH_SCOPE)) {
    throw new Error("Die Freigabe für Herzfrequenzdaten wurde nicht erteilt.")
  }

  const refreshTokenExpiresAt = tokens.refresh_token_expires_in
    ? new Date(Date.now() + tokens.refresh_token_expires_in * 1_000)
    : tokens.refresh_token
      ? null
      : existing?.refreshTokenExpiresAt ?? null

  await prisma.googleHealthConnection.upsert({
    where: { id: CONNECTION_ID },
    create: {
      id: CONNECTION_ID,
      connectedAt: new Date(),
      grantedScopes: tokens.scope ?? GOOGLE_HEALTH_SCOPE,
      refreshTokenCiphertext,
      refreshTokenExpiresAt,
    },
    update: {
      connectedAt: new Date(),
      grantedScopes: tokens.scope ?? GOOGLE_HEALTH_SCOPE,
      refreshTokenCiphertext,
      refreshTokenExpiresAt,
    },
  })
}

export async function getGoogleHealthStatus(): Promise<GoogleHealthStatus> {
  const config = getGoogleHealthConfig()
  if (!config.configured) {
    return { missing: config.missing, state: "configuration_missing" }
  }

  const connection = await prisma.googleHealthConnection.findUnique({ where: { id: CONNECTION_ID } })
  if (!connection) return { state: "not_connected" }

  return {
    connectedAt: connection.connectedAt.toISOString(),
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    refreshTokenExpiresAt: connection.refreshTokenExpiresAt?.toISOString() ?? null,
    state: connection.refreshTokenExpiresAt && connection.refreshTokenExpiresAt <= new Date()
      ? "expired"
      : "connected",
  }
}

export async function getHeartRateChartSeries(): Promise<HeartRateChartSeries> {
  const entries = await Promise.all(
    chartRanges.map(async (range) => [range, await getHeartRateChartRange(range)] as const)
  )
  return Object.fromEntries(entries) as HeartRateChartSeries
}

export async function syncGoogleHeartRate() {
  const config = requireGoogleHealthConfig()
  const connection = await prisma.googleHealthConnection.findUnique({ where: { id: CONNECTION_ID } })
  if (!connection) {
    throw new Error("Google Health ist noch nicht verbunden.")
  }
  if (connection.refreshTokenExpiresAt && connection.refreshTokenExpiresAt <= new Date()) {
    throw new Error("Die Google-Health-Verbindung ist abgelaufen. Bitte erneut verbinden.")
  }

  const now = new Date(Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS)
  if (connection.lastSyncedAt && now.getTime() - connection.lastSyncedAt.getTime() < SYNC_THROTTLE_MS) {
    return { inserted: 0, skipped: true }
  }

  const refreshToken = decryptRefreshToken(connection.refreshTokenCiphertext, config.encryptionSecret)
  const tokens = await refreshGoogleAccessToken(refreshToken, config.clientId, config.clientSecret)
  if (!tokens.access_token) {
    throw new Error("Google Health hat kein Zugriffstoken geliefert.")
  }

  const forwardStart = connection.lastSyncedAt
    ? new Date(Math.max(0, connection.lastSyncedAt.getTime() - SYNC_OVERLAP_MS))
    : new Date(now.getTime() - INITIAL_SYNC_DAYS * DAY_MS)
  const backfillEnd = connection.backfillBefore ?? forwardStart
  const backfillStart = new Date(backfillEnd.getTime() - MAX_QUERY_WINDOW_MS)
  const [forwardSamples, backfillSamples] = await Promise.all([
    fetchHeartRateRange(tokens.access_token, forwardStart, now),
    fetchHeartRateRange(tokens.access_token, backfillStart, backfillEnd),
  ])
  const samples = normalizeHeartRateSamples([...forwardSamples, ...backfillSamples])
  const inserted = await insertHeartRateSamples(samples)

  await prisma.googleHealthConnection.update({
    where: { id: CONNECTION_ID },
    data: {
      backfillBefore: backfillStart,
      lastSyncedAt: now,
      ...(tokens.refresh_token
        ? { refreshTokenCiphertext: encryptRefreshToken(tokens.refresh_token, config.encryptionSecret) }
        : {}),
      ...(tokens.refresh_token_expires_in
        ? { refreshTokenExpiresAt: new Date(Date.now() + tokens.refresh_token_expires_in * 1_000) }
        : {}),
    },
  })

  return { inserted, skipped: false }
}

async function getHeartRateChartRange(range: HeartRateChartRange) {
  const start = chartRangeStart(new Date(), range)
  const bucket = chartBuckets[range]
  const rows = await prisma.$queryRaw<AggregatedHeartRateRow[]>`
    select
      date_bin(${bucket}::interval, "measured_at", timestamptz '1970-01-01 00:00:00+00') as "measuredAt",
      round(avg("beats_per_minute"))::integer as "bpm"
    from "heart_rate_samples"
    where "measured_at" >= ${start}
    group by 1
    order by 1 asc
  `

  return rows.map((row) => ({
    bpm: row.bpm,
    measuredAt: row.measuredAt.toISOString(),
  }))
}

async function refreshGoogleAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  })
  const response = await fetch(GOOGLE_TOKEN_URL, {
    body,
    cache: "no-store",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  })
  return googleJson<GoogleHealthTokenResponse>(response, "Google Health konnte nicht autorisiert werden.")
}

async function fetchHeartRateRange(accessToken: string, start: Date, end: Date) {
  const points: GoogleHealthDataPoint[] = []
  let windowStart = new Date(start)

  while (windowStart < end) {
    const windowEnd = new Date(Math.min(windowStart.getTime() + MAX_QUERY_WINDOW_MS, end.getTime()))
    points.push(...await fetchHeartRateWindow(accessToken, windowStart, windowEnd))
    windowStart = windowEnd
  }

  return points
}

async function fetchHeartRateWindow(accessToken: string, start: Date, end: Date) {
  const points: GoogleHealthDataPoint[] = []
  let pageToken = ""

  do {
    const url = new URL(HEALTH_API_URL)
    url.searchParams.set(
      "filter",
      `heartRate.sample_time.physical_time >= "${start.toISOString()}" AND heartRate.sample_time.physical_time < "${end.toISOString()}"`
    )
    url.searchParams.set("pageSize", "10000")
    if (pageToken) url.searchParams.set("pageToken", pageToken)

    const response = await googleHealthFetch(url, accessToken)
    const data = await googleJson<GoogleHealthDataResponse>(response, "Herzfrequenzdaten konnten nicht geladen werden.")
    points.push(...(data.dataPoints ?? []))
    pageToken = data.nextPageToken ?? ""
  } while (pageToken)

  return points
}

async function googleHealthFetch(url: URL, accessToken: string) {
  let response: Response | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
      },
    })
    if (response.status !== 429 && response.status < 500) return response
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt))
  }

  return response!
}

function normalizeHeartRateSamples(points: GoogleHealthDataPoint[]) {
  const minutes = new Map<number, { count: number; total: number }>()

  for (const point of points) {
    const physicalTime = point.heartRate?.sampleTime?.physicalTime
    const bpm = Number(point.heartRate?.beatsPerMinute)
    const timestamp = physicalTime ? Date.parse(physicalTime) : Number.NaN
    if (!Number.isFinite(timestamp) || !Number.isInteger(bpm) || bpm <= 0 || bpm > 400) continue

    const minute = Math.floor(timestamp / MINUTE_MS) * MINUTE_MS
    const current = minutes.get(minute) ?? { count: 0, total: 0 }
    current.count += 1
    current.total += bpm
    minutes.set(minute, current)
  }

  return [...minutes.entries()]
    .sort(([left], [right]) => left - right)
    .map(([measuredAt, value]) => ({
      beatsPerMinute: Math.round(value.total / value.count),
      measuredAt: new Date(measuredAt),
    }))
}

async function insertHeartRateSamples(samples: Array<{ beatsPerMinute: number; measuredAt: Date }>) {
  let inserted = 0

  for (let index = 0; index < samples.length; index += INSERT_BATCH_SIZE) {
    const result = await prisma.heartRateSample.createMany({
      data: samples.slice(index, index + INSERT_BATCH_SIZE),
      skipDuplicates: true,
    })
    inserted += result.count
  }

  return inserted
}

async function googleJson<T>(response: Response, fallback: string): Promise<T> {
  const data: unknown = await response.json().catch(() => null)
  if (response.ok && data !== null) return data as T

  const error = typeof data === "object" && data !== null && "error" in data
    ? (data as { error?: { message?: string } | string }).error
    : null
  const message = typeof error === "string" ? error : error?.message
  throw new Error(message || `${fallback} (${response.status})`)
}

function encryptRefreshToken(token: string, secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".")
}

function decryptRefreshToken(ciphertext: string, secret: string) {
  const [version, ivValue, tagValue, encryptedValue] = ciphertext.split(".")
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Das gespeicherte Google-Health-Token ist ungültig.")
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(ivValue, "base64url"))
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"))
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    throw new Error("Das Google-Health-Token konnte nicht entschlüsselt werden.")
  }
}

function encryptionKey(secret: string) {
  return createHash("sha256").update(`myDashboard:google-health:v1:${secret}`).digest()
}

function chartRangeStart(end: Date, range: HeartRateChartRange) {
  if (range === "max") return new Date(0)
  const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[range]
  const result = new Date(end)
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() - months)
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result
}

function requireGoogleHealthConfig() {
  const config = getGoogleHealthConfig()
  if (!config.configured) {
    throw new Error(`Google Health ist nicht vollständig konfiguriert: ${config.missing.join(", ")}.`)
  }
  return config
}

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}
