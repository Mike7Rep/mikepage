import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

import { prisma } from "@/lib/prisma"

const GOOGLE_HEALTH_SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
  "https://www.googleapis.com/auth/googlehealth.nutrition.readonly",
] as const

export const GOOGLE_HEALTH_SCOPE = GOOGLE_HEALTH_SCOPES.join(" ")
export const GOOGLE_HEALTH_STATE_COOKIE = "mydashboard_google_health_state"
export const GOOGLE_HEALTH_COOKIE_PATH = "/myDashboard/google-health"

export type DailyStepsPoint = {
  date: string
  steps: number | null
}

export type DailyCaloriesPoint = {
  burned: number | null
  consumed: number | null
  date: string
}

export type DailyRunPoint = {
  date: string
  distanceKm: number
  efficiencyScore: number | null
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
  refresh_token?: string
  refresh_token_expires_in?: number
  scope?: string
}

type GoogleHealthDataPoint = {
  exercise?: {
    activeDuration?: string
    exerciseType?: string
    interval?: {
      endTime?: string
      startTime?: string
    }
    metricsSummary?: {
      averageHeartRateBeatsPerMinute?: number | string
      averageSpeedMillimetersPerSecond?: number | string
      distanceMillimeters?: number | string
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

type GoogleHealthDailyRollupPoint = {
  civilStartTime?: {
    date?: {
      day?: number
      month?: number
      year?: number
    }
  }
  nutritionLog?: {
    energy?: {
      kcalSum?: number | string
    }
  }
  steps?: {
    countSum?: string
  }
  totalCalories?: {
    kcalSum?: number | string
  }
}

type GoogleHealthDailyRollupResponse = {
  nextPageToken?: string
  rollupDataPoints?: GoogleHealthDailyRollupPoint[]
}

const STEPS_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp"
const CALORIE_BURN_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/total-calories/dataPoints:dailyRollUp"
const CALORIE_INTAKE_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/nutrition-log/dataPoints:dailyRollUp"
const EXERCISE_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/exercise/dataPoints"
const SLEEP_API_URL = "https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints:reconcile"
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const CONNECTION_ID = 1
const DAY_MS = 24 * 60 * 60 * 1_000
const MINUTE_MS = 60 * 1_000
const SYNC_THROTTLE_MS = MINUTE_MS
const HEALTH_RETENTION_YEARS = 1
const CALORIE_QUERY_WINDOW_DAYS = 14
const CALORIE_SYNC_DAYS = 90
const STEPS_SYNC_DAYS = 90
const SLEEP_SYNC_DAYS = 7
const RUN_SYNC_DAYS = 365
const API_TIMEOUT_MS = 15_000
const SLEEPING_STAGE_TYPES = new Set(["ASLEEP", "DEEP", "LIGHT", "REM"])

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
  const response = await retryingFetch(GOOGLE_TOKEN_URL, {
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
    throw new Error("Die Freigabe für Aktivitäts-, Ernährungs- und Schlafdaten wurde nicht vollständig erteilt.")
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

export async function getDailyStepsSeries(): Promise<DailyStepsPoint[]> {
  const rows = await prisma.dailyStepCount.findMany({
    orderBy: { date: "asc" },
    where: { date: { gte: healthRetentionStart() } },
  })
  const valuesByDate = new Map(
    rows.map((row) => [row.date.toISOString().slice(0, 10), row.steps])
  )

  return dailySeriesDates([...valuesByDate.keys()], STEPS_SYNC_DAYS).map((date) => ({
    date,
    steps: valuesByDate.get(date) ?? null,
  }))
}

export async function getDailyCaloriesSeries(): Promise<DailyCaloriesPoint[]> {
  const [burnedRows, consumedRows] = await Promise.all([
    prisma.dailyCalorieBurn.findMany({
      orderBy: { date: "asc" },
      where: { date: { gte: healthRetentionStart() } },
    }),
    prisma.dailyCalorieIntake.findMany({
      orderBy: { date: "asc" },
      where: { date: { gte: healthRetentionStart() } },
    }),
  ])
  const burnedByDate = new Map(
    burnedRows.map((row) => [row.date.toISOString().slice(0, 10), row.kilocalories])
  )
  const consumedByDate = new Map(
    consumedRows.map((row) => [row.date.toISOString().slice(0, 10), row.kilocalories])
  )
  const dates = dailySeriesDates(
    [...burnedByDate.keys(), ...consumedByDate.keys()],
    CALORIE_SYNC_DAYS
  )

  return dates.map((date) => ({
    burned: burnedByDate.get(date) ?? null,
    consumed: consumedByDate.get(date) ?? null,
    date,
  }))
}

export async function getDailyRunSeries(): Promise<DailyRunPoint[]> {
  const rows = await prisma.googleHealthRun.findMany({
    orderBy: { startedAt: "asc" },
    where: { endedAt: { gte: healthRetentionStart() } },
  })
  const runs = rows.map((row) => ({
    averageHeartRate: row.averageHeartRate === null ? null : Number(row.averageHeartRate),
    date: civilDateKey(row.startedAt),
    distanceKm: Number(row.distanceKm),
    efficiency: runEfficiency(
      Number(row.distanceKm),
      row.activeSeconds,
      row.averageHeartRate === null ? null : Number(row.averageHeartRate)
    ),
  }))
  const validEfficiencies = runs.flatMap((run) => run.efficiency === null ? [] : [run.efficiency])
  const baselineValues = validEfficiencies.slice(0, Math.min(5, validEfficiencies.length))
  const baseline = average(baselineValues)
  const daily = new Map<string, DailyRunPoint>()
  let efficiencyIndex = 0

  for (const run of runs) {
    let efficiencyScore: number | null = null
    if (run.efficiency !== null && baseline !== null && baseline > 0) {
      const currentWindow = validEfficiencies.slice(
        Math.max(0, efficiencyIndex - 2),
        efficiencyIndex + 1
      )
      const rollingEfficiency = average(currentWindow)!
      efficiencyScore = roundTo(
        Math.max(0, Math.min(100, 50 + 166.67 * (rollingEfficiency / baseline - 1))),
        1
      )
      efficiencyIndex += 1
    }

    const current = daily.get(run.date)
    daily.set(run.date, {
      date: run.date,
      distanceKm: roundTo((current?.distanceKm ?? 0) + run.distanceKm, 2),
      efficiencyScore: efficiencyScore ?? current?.efficiencyScore ?? null,
    })
  }

  return [...daily.values()].sort((left, right) => left.date.localeCompare(right.date))
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
    throw new Error("Für Schritte, Kalorien, Ernährung und Schlaf braucht Google Health zusätzliche Freigaben. Bitte neu verbinden.")
  }

  const now = new Date(Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS)
  if (connection.lastSyncedAt && now.getTime() - connection.lastSyncedAt.getTime() < SYNC_THROTTLE_MS) {
    return {
      skipped: true,
      updatedBurnedCalorieDays: 0,
      updatedConsumedCalorieDays: 0,
      updatedRuns: 0,
      updatedSleepIntervals: 0,
      updatedStepDays: 0,
      warnings: [] as string[],
    }
  }

  const refreshToken = decryptRefreshToken(connection.refreshTokenCiphertext, config.encryptionSecret)
  const tokens = await refreshGoogleAccessToken(refreshToken, config.clientId, config.clientSecret)
  if (!tokens.access_token) {
    throw new Error("Google Health hat kein Zugriffstoken geliefert.")
  }

  const [latestBurn, latestIntake, latestStep, latestSleep, latestRun] = await Promise.all([
    prisma.dailyCalorieBurn.findFirst({ orderBy: { date: "desc" }, select: { date: true } }),
    prisma.dailyCalorieIntake.findFirst({ orderBy: { date: "desc" }, select: { date: true } }),
    prisma.dailyStepCount.findFirst({ orderBy: { date: "desc" }, select: { date: true } }),
    prisma.googleHealthSleepInterval.findFirst({
      orderBy: { endedAt: "desc" },
      select: { endedAt: true },
    }),
    prisma.googleHealthRun.findFirst({
      orderBy: { endedAt: "desc" },
      select: { endedAt: true },
    }),
  ])
  const burnedDates = incrementalCivilDates(latestBurn?.date ?? null, CALORIE_SYNC_DAYS)
  const consumedDates = incrementalCivilDates(latestIntake?.date ?? null, CALORIE_SYNC_DAYS)
  const stepDates = incrementalCivilDates(latestStep?.date ?? null, STEPS_SYNC_DAYS)
  const sleepStart = latestSleep?.endedAt ?? new Date(now.getTime() - SLEEP_SYNC_DAYS * DAY_MS)
  const runStart = latestRun?.endedAt ?? new Date(now.getTime() - RUN_SYNC_DAYS * DAY_MS)
  const [burnedResult, consumedResult, stepsResult, sleepResult, runsResult] = await Promise.allSettled([
    fetchDailyCalorieBurns(tokens.access_token, burnedDates),
    fetchDailyCalorieIntakes(tokens.access_token, consumedDates),
    fetchDailySteps(tokens.access_token, stepDates),
    fetchSleepIntervals(tokens.access_token, sleepStart, now),
    fetchRunningActivities(tokens.access_token, runStart, now),
  ])
  const warnings: string[] = []
  let updatedBurnedCalorieDays = 0
  let updatedConsumedCalorieDays = 0
  let updatedStepDays = 0
  let updatedSleepIntervals = 0
  let updatedRuns = 0

  if (burnedResult.status === "fulfilled") {
    updatedBurnedCalorieDays = await upsertDailyCalorieBurns(burnedResult.value)
  } else {
    warnings.push("Kalorienverbrauch")
  }
  if (consumedResult.status === "fulfilled") {
    updatedConsumedCalorieDays = await upsertDailyCalorieIntakes(consumedResult.value)
  } else {
    warnings.push("Kalorienaufnahme")
  }
  if (stepsResult.status === "fulfilled") {
    updatedStepDays = await upsertDailySteps(stepsResult.value)
  } else {
    warnings.push("Schritte")
  }
  if (sleepResult.status === "fulfilled") {
    updatedSleepIntervals = await upsertSleepIntervals(sleepResult.value)
  } else {
    warnings.push("Schlaf")
  }
  if (runsResult.status === "fulfilled") {
    updatedRuns = await upsertRuns(runsResult.value)
  } else {
    warnings.push("Läufe")
  }

  if (warnings.length === 5) {
    throw new Error("Google Health hat keine Datenquelle erreicht. Bitte Verbindung und Google-Health-Freigaben prüfen.")
  }

  const retentionStart = healthRetentionStart(now)
  await prisma.$transaction([
    prisma.dailyCalorieBurn.deleteMany({ where: { date: { lt: retentionStart } } }),
    prisma.dailyCalorieIntake.deleteMany({ where: { date: { lt: retentionStart } } }),
    prisma.dailyStepCount.deleteMany({ where: { date: { lt: retentionStart } } }),
    prisma.googleHealthSleepInterval.deleteMany({ where: { endedAt: { lt: retentionStart } } }),
    prisma.googleHealthRun.deleteMany({ where: { endedAt: { lt: retentionStart } } }),
    prisma.googleHealthConnection.update({
      where: { id: CONNECTION_ID },
      data: {
        lastSyncedAt: now,
        ...(tokens.refresh_token
          ? { refreshTokenCiphertext: encryptRefreshToken(tokens.refresh_token, config.encryptionSecret) }
          : {}),
        ...(tokens.refresh_token_expires_in
          ? { refreshTokenExpiresAt: new Date(Date.now() + tokens.refresh_token_expires_in * 1_000) }
          : {}),
      },
    }),
  ])

  return {
    skipped: false,
    updatedBurnedCalorieDays,
    updatedConsumedCalorieDays,
    updatedRuns,
    updatedSleepIntervals,
    updatedStepDays,
    warnings,
  }
}

async function refreshGoogleAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  })
  const response = await retryingFetch(GOOGLE_TOKEN_URL, {
    body,
    cache: "no-store",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  })
  return googleJson<GoogleHealthTokenResponse>(response, "Google Health konnte nicht autorisiert werden.")
}

async function fetchDailySteps(accessToken: string, dates: string[]) {
  const points = await fetchDailyRollupPoints({
    accessToken,
    apiUrl: STEPS_API_URL,
    dates,
    fallback: "Schrittdaten konnten nicht geladen werden.",
    queryWindowDays: STEPS_SYNC_DAYS,
  })

  return points.flatMap((point) => {
    const date = dailyRollupDate(point)
    const steps = Number(point.steps?.countSum)
    if (date === null || !Number.isSafeInteger(steps) || steps < 0 || steps > 2_147_483_647) {
      return []
    }
    return [{ date, steps }]
  })
}

async function fetchDailyCalorieBurns(accessToken: string, dates: string[]) {
  const points = await fetchDailyRollupPoints({
    accessToken,
    apiUrl: CALORIE_BURN_API_URL,
    dates,
    fallback: "Verbrannte Kalorien konnten nicht geladen werden.",
    queryWindowDays: CALORIE_QUERY_WINDOW_DAYS,
  })
  return calorieValues(points, (point) => point.totalCalories?.kcalSum)
}

async function fetchDailyCalorieIntakes(accessToken: string, dates: string[]) {
  const points = await fetchDailyRollupPoints({
    accessToken,
    apiUrl: CALORIE_INTAKE_API_URL,
    dates,
    fallback: "Aufgenommene Kalorien konnten nicht geladen werden.",
    queryWindowDays: CALORIE_SYNC_DAYS,
  })
  return calorieValues(points, (point) => point.nutritionLog?.energy?.kcalSum)
}

function calorieValues(
  points: GoogleHealthDailyRollupPoint[],
  valueForPoint: (point: GoogleHealthDailyRollupPoint) => number | string | undefined
) {
  return points.flatMap((point) => {
    const date = dailyRollupDate(point)
    const kilocalories = Number(valueForPoint(point))
    if (date === null || !Number.isFinite(kilocalories) || kilocalories < 0 || kilocalories > 100_000) {
      return []
    }
    return [{ date, kilocalories: Math.round(kilocalories) }]
  })
}

async function fetchDailyRollupPoints({
  accessToken,
  apiUrl,
  dates,
  fallback,
  queryWindowDays,
}: {
  accessToken: string
  apiUrl: string
  dates: string[]
  fallback: string
  queryWindowDays: number
}) {
  const points: GoogleHealthDailyRollupPoint[] = []

  for (let index = 0; index < dates.length; index += queryWindowDays) {
    const windowDates = dates.slice(index, index + queryWindowDays)
    const [startYear, startMonth, startDay] = windowDates[0].split("-").map(Number)
    const end = new Date(`${windowDates.at(-1)}T00:00:00.000Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    let pageToken = ""

    do {
      const response = await googleHealthFetch(new URL(apiUrl), accessToken, {
        body: JSON.stringify({
          dataSourceFamily: "users/me/dataSourceFamilies/all-sources",
          pageSize: windowDates.length,
          ...(pageToken ? { pageToken } : {}),
          range: {
            start: {
              date: { day: startDay, month: startMonth, year: startYear },
              time: {},
            },
            end: {
              date: {
                day: end.getUTCDate(),
                month: end.getUTCMonth() + 1,
                year: end.getUTCFullYear(),
              },
              time: {},
            },
          },
          windowSizeDays: 1,
        }),
        method: "POST",
      })
      const data = await googleJson<GoogleHealthDailyRollupResponse>(response, fallback)
      points.push(...(data.rollupDataPoints ?? []))
      pageToken = data.nextPageToken ?? ""
    } while (pageToken)
  }

  return points
}

function dailyRollupDate(point: GoogleHealthDailyRollupPoint) {
  const { day, month, year } = point.civilStartTime?.date ?? {}
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null
  }

  const date = new Date(Date.UTC(year!, month! - 1, day!))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day
    ? date
    : null
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

async function fetchRunningActivities(accessToken: string, start: Date, end: Date) {
  const runs = new Map<string, {
    activeSeconds: number
    averageHeartRate: number | null
    distanceKm: number
    endedAt: Date
    startedAt: Date
  }>()
  let pageToken = ""

  do {
    const url = new URL(EXERCISE_API_URL)
    url.searchParams.set("dataSourceFamily", "users/me/dataSourceFamilies/all-sources")
    url.searchParams.set(
      "filter",
      `exercise.interval.end_time >= "${start.toISOString()}" AND exercise.interval.end_time < "${end.toISOString()}"`
    )
    url.searchParams.set("pageSize", "100")
    if (pageToken) url.searchParams.set("pageToken", pageToken)

    const response = await googleHealthFetch(url, accessToken)
    const data = await googleJson<GoogleHealthDataResponse>(response, "Laufaktivitäten konnten nicht geladen werden.")

    for (const point of data.dataPoints ?? []) {
      const exercise = point.exercise
      if (exercise?.exerciseType !== "RUNNING") continue

      const startedAt = new Date(exercise.interval?.startTime ?? "")
      const endedAt = new Date(exercise.interval?.endTime ?? "")
      if (
        !Number.isFinite(startedAt.getTime())
        || !Number.isFinite(endedAt.getTime())
        || endedAt <= startedAt
      ) {
        continue
      }

      const distanceKm = Number(exercise.metricsSummary?.distanceMillimeters) / 1_000_000
      const averageHeartRate = Number(exercise.metricsSummary?.averageHeartRateBeatsPerMinute)
      const activeSeconds = parseGoogleDuration(exercise.activeDuration)
        ?? Math.round((endedAt.getTime() - startedAt.getTime()) / 1_000)
      if (!Number.isFinite(distanceKm) || distanceKm <= 0 || activeSeconds <= 0) continue

      runs.set(`${startedAt.toISOString()}:${endedAt.toISOString()}`, {
        activeSeconds,
        averageHeartRate: Number.isFinite(averageHeartRate) && averageHeartRate > 0
          ? roundTo(averageHeartRate, 1)
          : null,
        distanceKm: roundTo(distanceKm, 3),
        endedAt,
        startedAt,
      })
    }

    pageToken = data.nextPageToken ?? ""
  } while (pageToken)

  return [...runs.values()].sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())
}

async function googleHealthFetch(url: URL, accessToken: string, init: RequestInit = {}) {
  return retryingFetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  })
}

async function retryingFetch(url: string | URL, init: RequestInit) {
  let lastResponse: Response | null = null
  let lastError: unknown = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      })
      lastResponse = response
      if (response.status !== 429 && response.status < 500) return response
    } catch (error) {
      lastError = error
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt))
    }
  }

  if (lastResponse) return lastResponse
  throw new Error(
    lastError instanceof Error && lastError.name === "TimeoutError"
      ? "Google Health hat nicht rechtzeitig geantwortet."
      : "Google Health konnte nach drei Versuchen nicht erreicht werden."
  )
}

async function upsertDailySteps(steps: Array<{ date: Date; steps: number }>) {
  if (steps.length === 0) return 0
  await prisma.$transaction(steps.map((value) => prisma.dailyStepCount.upsert({
    where: { date: value.date },
    create: value,
    update: { steps: value.steps },
  })))
  return steps.length
}

async function upsertDailyCalorieBurns(values: Array<{ date: Date; kilocalories: number }>) {
  if (values.length === 0) return 0
  await prisma.$transaction(values.map((value) => prisma.dailyCalorieBurn.upsert({
    where: { date: value.date },
    create: value,
    update: { kilocalories: value.kilocalories },
  })))
  return values.length
}

async function upsertDailyCalorieIntakes(values: Array<{ date: Date; kilocalories: number }>) {
  if (values.length === 0) return 0
  await prisma.$transaction(values.map((value) => prisma.dailyCalorieIntake.upsert({
    where: { date: value.date },
    create: value,
    update: { kilocalories: value.kilocalories },
  })))
  return values.length
}

async function upsertSleepIntervals(intervals: Array<{ endedAt: Date; startedAt: Date }>) {
  if (intervals.length === 0) return 0
  const result = await prisma.googleHealthSleepInterval.createMany({
    data: intervals,
    skipDuplicates: true,
  })
  return result.count
}

async function upsertRuns(runs: Array<{
  activeSeconds: number
  averageHeartRate: number | null
  distanceKm: number
  endedAt: Date
  startedAt: Date
}>) {
  if (runs.length === 0) return 0
  await prisma.$transaction(runs.map((run) => prisma.googleHealthRun.upsert({
    where: {
      startedAt_endedAt: {
        endedAt: run.endedAt,
        startedAt: run.startedAt,
      },
    },
    create: run,
    update: {
      activeSeconds: run.activeSeconds,
      averageHeartRate: run.averageHeartRate,
      distanceKm: run.distanceKm,
    },
  })))
  return runs.length
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

function healthRetentionStart(reference = new Date()) {
  const start = new Date(reference)
  start.setUTCFullYear(start.getUTCFullYear() - HEALTH_RETENTION_YEARS)
  start.setUTCHours(0, 0, 0, 0)
  return start
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

function incrementalCivilDates(latest: Date | null, fallbackDays: number) {
  const fallbackDates = recentCivilDates(fallbackDays)
  const today = fallbackDates.at(-1)!
  const latestDate = latest?.toISOString().slice(0, 10)
  const start = latestDate && latestDate <= today ? latestDate : fallbackDates[0]
  const startDate = new Date(`${start}T00:00:00.000Z`)
  const endDate = new Date(`${today}T00:00:00.000Z`)
  const dates: string[] = []

  for (let date = startDate; date <= endDate; date = new Date(date.getTime() + DAY_MS)) {
    dates.push(date.toISOString().slice(0, 10))
  }

  return dates
}

function dailySeriesDates(storedDates: string[], recentDays: number) {
  return [...new Set([...storedDates, ...recentCivilDates(recentDays)])].sort()
}

function parseGoogleDuration(value?: string) {
  const match = value?.match(/^([0-9]+(?:\.[0-9]+)?)s$/)
  if (!match) return null
  const seconds = Number(match[1])
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null
}

function runEfficiency(distanceKm: number, activeSeconds: number, averageHeartRate: number | null) {
  if (distanceKm <= 0 || activeSeconds <= 0 || averageHeartRate === null || averageHeartRate <= 0) {
    return null
  }
  return (distanceKm / (activeSeconds / 3_600)) / averageHeartRate
}

function average(values: number[]) {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function civilDateKey(date: Date) {
  const parts = Object.fromEntries(
    civilDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as Record<"day" | "month" | "year", string>
  return `${parts.year}-${parts.month}-${parts.day}`
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
