import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

import { calculateHealthStrainScore } from "@/lib/health-strain"
import { prisma } from "@/lib/prisma"

const GOOGLE_HEALTH_SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
] as const
export const GOOGLE_HEALTH_SCOPE = GOOGLE_HEALTH_SCOPES.join(" ")
export const GOOGLE_HEALTH_STATE_COOKIE = "mydashboard_google_health_state"
export const GOOGLE_HEALTH_COOKIE_PATH = "/myDashboard/google-health"

export type HeartRateChartRange = "1h" | "1d" | "1w"

export type HeartRateChartPoint = {
  measuredAt: string
  bpm: number
}

export type HeartRateChartSeries = Record<HeartRateChartRange, HeartRateChartPoint[]>

export type DailyStepsPoint = {
  date: string
  steps: number | null
}

export type GoogleHealthStatus =
  | { state: "configuration_missing"; missing: string[] }
  | { state: "not_connected" }
  | {
      state: "connected" | "expired" | "scope_update_required"
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
  sleep?: {
    interval?: {
      endTime?: string
      startTime?: string
    }
    stages?: Array<{
      endTime?: string
      startTime?: string
      type?: string
    }>
  }
}

type GoogleHealthDataResponse = {
  dataPoints?: GoogleHealthDataPoint[]
  nextPageToken?: string
}

type GoogleHealthDailyStepsResponse = {
  rollupDataPoints?: Array<{
    civilStartTime?: {
      date?: {
        day?: number
        month?: number
        year?: number
      }
    }
    steps?: {
      countSum?: string
    }
  }>
}

type AggregatedHeartRateRow = {
  measuredAt: Date
  bpm: number
}

const HEALTH_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/heart-rate/dataPoints"
const STEPS_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp"
const SLEEP_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints:reconcile"
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
const STEPS_SYNC_DAYS = 90
const SLEEP_SYNC_DAYS = 7
const SLEEPING_STAGE_TYPES = new Set(["ASLEEP", "DEEP", "LIGHT", "REM"])

const chartRanges: HeartRateChartRange[] = ["1h", "1d", "1w"]
const chartBuckets: Record<HeartRateChartRange, string> = {
  "1h": "1 minute",
  "1d": "5 minutes",
  "1w": "30 minutes",
}

const civilDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Zurich",
  year: "numeric",
})

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

  if (tokens.scope && !hasGoogleHealthScopes(tokens.scope)) {
    throw new Error("Die Freigabe für Herzfrequenz-, Aktivitäts- und Schlafdaten wurde nicht vollständig erteilt.")
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
      lastSyncedAt: null,
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
      : hasGoogleHealthScopes(connection.grantedScopes)
        ? "connected"
        : "scope_update_required",
  }
}

export async function getHeartRateChartSeries(): Promise<HeartRateChartSeries> {
  const entries = await Promise.all(
    chartRanges.map(async (range) => [range, await getHeartRateChartRange(range)] as const)
  )
  return Object.fromEntries(entries) as HeartRateChartSeries
}

export async function getDailyStepsSeries(): Promise<DailyStepsPoint[]> {
  const dates = recentCivilDates(STEPS_SYNC_DAYS)
  const rows = await prisma.dailyStepCount.findMany({
    where: { date: { gte: new Date(`${dates[0]}T00:00:00.000Z`) } },
    orderBy: { date: "asc" },
  })
  const stepsByDate = new Map(
    rows.map((row) => [row.date.toISOString().slice(0, 10), row.steps])
  )

  return dates.map((date) => ({
    date,
    steps: stepsByDate.get(date) ?? null,
  }))
}

export async function getHealthStrainScore() {
  const now = new Date()
  const start = new Date(now.getTime() - SLEEP_SYNC_DAYS * DAY_MS)
  const [heartRateSamples, sleepIntervals] = await Promise.all([
    prisma.heartRateSample.findMany({
      where: { measuredAt: { gte: start, lte: now } },
      orderBy: { measuredAt: "asc" },
      select: { beatsPerMinute: true, measuredAt: true },
    }),
    prisma.googleHealthSleepInterval.findMany({
      where: {
        endedAt: { gte: start },
        startedAt: { lt: now },
      },
      orderBy: { startedAt: "asc" },
      select: { endedAt: true, startedAt: true },
    }),
  ])

  return calculateHealthStrainScore({
    heartRateSamples,
    maximumHeartRate: personalMaximumHeartRate(now),
    now,
    sleepIntervals,
  })
}

export async function syncGoogleHealthData() {
  const config = requireGoogleHealthConfig()
  const connection = await prisma.googleHealthConnection.findUnique({ where: { id: CONNECTION_ID } })
  if (!connection) {
    throw new Error("Google Health ist noch nicht verbunden.")
  }
  if (connection.refreshTokenExpiresAt && connection.refreshTokenExpiresAt <= new Date()) {
    throw new Error("Die Google-Health-Verbindung ist abgelaufen. Bitte erneut verbinden.")
  }
  if (!hasGoogleHealthScopes(connection.grantedScopes)) {
    throw new Error("Für Schritte und Belastungsscore braucht Google Health zusätzliche Freigaben. Bitte neu verbinden.")
  }

  const now = new Date(Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS)
  if (connection.lastSyncedAt && now.getTime() - connection.lastSyncedAt.getTime() < SYNC_THROTTLE_MS) {
    return { insertedHeartRate: 0, skipped: true, updatedSleepIntervals: 0, updatedStepDays: 0 }
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
  const sleepStart = new Date(now.getTime() - SLEEP_SYNC_DAYS * DAY_MS)
  const [forwardSamples, backfillSamples, dailySteps, sleepIntervals] = await Promise.all([
    fetchHeartRateRange(tokens.access_token, forwardStart, now),
    fetchHeartRateRange(tokens.access_token, backfillStart, backfillEnd),
    fetchDailySteps(tokens.access_token),
    fetchSleepIntervals(tokens.access_token, sleepStart, now),
  ])
  const samples = normalizeHeartRateSamples([...forwardSamples, ...backfillSamples])
  const [insertedHeartRate, updatedStepDays, updatedSleepIntervals] = await Promise.all([
    insertHeartRateSamples(samples),
    replaceDailySteps(dailySteps),
    replaceSleepIntervals(sleepIntervals),
  ])

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

  return { insertedHeartRate, skipped: false, updatedSleepIntervals, updatedStepDays }
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
      `heart_rate.sample_time.physical_time >= "${start.toISOString()}" AND heart_rate.sample_time.physical_time < "${end.toISOString()}"`
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

async function fetchDailySteps(accessToken: string) {
  const dates = recentCivilDates(STEPS_SYNC_DAYS)
  const [startYear, startMonth, startDay] = dates[0].split("-").map(Number)
  const tomorrow = new Date(`${dates.at(-1)}T00:00:00.000Z`)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

  const response = await googleHealthFetch(new URL(STEPS_API_URL), accessToken, {
    body: JSON.stringify({
      dataSourceFamily: "users/me/dataSourceFamilies/all-sources",
      pageSize: STEPS_SYNC_DAYS,
      range: {
        start: {
          date: { day: startDay, month: startMonth, year: startYear },
          time: {},
        },
        end: {
          date: {
            day: tomorrow.getUTCDate(),
            month: tomorrow.getUTCMonth() + 1,
            year: tomorrow.getUTCFullYear(),
          },
          time: {},
        },
      },
      windowSizeDays: 1,
    }),
    method: "POST",
  })
  const data = await googleJson<GoogleHealthDailyStepsResponse>(
    response,
    "Schrittdaten konnten nicht geladen werden."
  )

  return (data.rollupDataPoints ?? []).flatMap((point) => {
    const { day, month, year } = point.civilStartTime?.date ?? {}
    const steps = Number(point.steps?.countSum)
    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      !Number.isInteger(year) ||
      !Number.isSafeInteger(steps) ||
      steps < 0 ||
      steps > 2_147_483_647
    ) {
      return []
    }

    return [{
      date: new Date(Date.UTC(year!, month! - 1, day!)),
      steps,
    }]
  })
}

async function fetchSleepIntervals(accessToken: string, start: Date, end: Date) {
  const intervals = new Map<string, { endedAt: Date; startedAt: Date }>()
  let pageToken = ""

  do {
    const url = new URL(SLEEP_API_URL)
    url.searchParams.set("dataSourceFamily", "users/me/dataSourceFamilies/all-sources")
    url.searchParams.set(
      "filter",
      `sleep.interval.end_time >= "${start.toISOString()}" AND sleep.interval.end_time < "${end.toISOString()}"`
    )
    url.searchParams.set("pageSize", "25")
    if (pageToken) url.searchParams.set("pageToken", pageToken)

    const response = await googleHealthFetch(url, accessToken)
    const data = await googleJson<GoogleHealthDataResponse>(response, "Schlafdaten konnten nicht geladen werden.")

    for (const point of data.dataPoints ?? []) {
      const sleepingStages = (point.sleep?.stages ?? []).filter((stage) => (
        stage.type && SLEEPING_STAGE_TYPES.has(stage.type)
      ))
      const candidates = sleepingStages.length > 0
        ? sleepingStages
        : [point.sleep?.interval ?? {}]

      for (const candidate of candidates) {
        const startedAt = new Date(candidate.startTime ?? "")
        const endedAt = new Date(candidate.endTime ?? "")
        if (
          !Number.isFinite(startedAt.getTime())
          || !Number.isFinite(endedAt.getTime())
          || endedAt.getTime() <= startedAt.getTime()
        ) {
          continue
        }

        intervals.set(`${startedAt.toISOString()}:${endedAt.toISOString()}`, { endedAt, startedAt })
      }
    }

    pageToken = data.nextPageToken ?? ""
  } while (pageToken)

  return [...intervals.values()].sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())
}

async function googleHealthFetch(
  url: URL,
  accessToken: string,
  init?: { body: string; method: "POST" }
) {
  let response: Response | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
        ...(init?.body ? { "content-type": "application/json" } : {}),
      },
      ...init,
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

async function replaceDailySteps(steps: Array<{ date: Date; steps: number }>) {
  const dates = recentCivilDates(STEPS_SYNC_DAYS)
  const start = new Date(`${dates[0]}T00:00:00.000Z`)
  const end = new Date(`${dates.at(-1)}T00:00:00.000Z`)
  end.setUTCDate(end.getUTCDate() + 1)

  await prisma.$transaction(async (transaction) => {
    await transaction.dailyStepCount.deleteMany({
      where: { date: { gte: start, lt: end } },
    })
    if (steps.length > 0) {
      await transaction.dailyStepCount.createMany({ data: steps })
    }
  })

  return steps.length
}

async function replaceSleepIntervals(intervals: Array<{ endedAt: Date; startedAt: Date }>) {
  await prisma.$transaction(async (transaction) => {
    await transaction.googleHealthSleepInterval.deleteMany()
    if (intervals.length > 0) {
      await transaction.googleHealthSleepInterval.createMany({
        data: intervals,
        skipDuplicates: true,
      })
    }
  })

  return intervals.length
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
  const duration = { "1h": 60 * MINUTE_MS, "1d": DAY_MS, "1w": 7 * DAY_MS }[range]
  return new Date(end.getTime() - duration)
}

function hasGoogleHealthScopes(scopes: string) {
  const granted = new Set(scopes.split(/\s+/).filter(Boolean))
  return GOOGLE_HEALTH_SCOPES.every((scope) => granted.has(scope))
}

function recentCivilDates(days: number) {
  const parts = Object.fromEntries(
    civilDateFormatter
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  ) as Record<"day" | "month" | "year", number>
  const today = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() - days + index + 1)
    return date.toISOString().slice(0, 10)
  })
}

function personalMaximumHeartRate(now: Date) {
  const parts = Object.fromEntries(
    civilDateFormatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  ) as Record<"day" | "month" | "year", number>
  const age = parts.year - 1985 - (
    parts.month < 7 || (parts.month === 7 && parts.day < 7) ? 1 : 0
  )

  return 208 - 0.7 * age
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
