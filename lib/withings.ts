import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

import { prisma } from "@/lib/prisma"

export const WITHINGS_COOKIE_PATH = "/myDashboard/withings"
export const WITHINGS_STATE_COOKIE = "mydashboard_withings_state"

export type WithingsStatus =
  | { state: "configuration_missing"; missing: string[] }
  | { state: "not_connected" }
  | {
      state: "connected" | "expired" | "scope_update_required"
      connectedAt: string
      lastSyncedAt: string | null
      refreshTokenExpiresAt: string
    }

type WithingsTokenBody = {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  token_type?: string
  userid?: number | string
}

type WithingsMeasure = {
  type?: number | string
  unit?: number | string
  value?: number | string
}

type WithingsMeasureGroup = {
  date?: number | string
  deviceid?: string
  grpid?: number | string
  is_deleted?: boolean | number | string
  measures?: WithingsMeasure[]
  model?: string
  modified?: number | string
}

type WithingsMeasureBody = {
  measuregrps?: WithingsMeasureGroup[]
  more?: boolean | number | string
  offset?: number | string
  updatetime?: number | string
}

type WithingsResponse<T> = {
  body?: T
  error?: string
  status?: number
}

type NormalizedMeasurement = {
  bodyFatPercent: number | null
  deviceId: string | null
  groupId: bigint
  isDeleted: boolean
  measuredAt: Date
  model: string | null
  modifiedAt: Date | null
  weightKg: number | null
}

const WITHINGS_AUTH_URL = "https://account.withings.com/oauth2_user/authorize2"
const WITHINGS_TOKEN_URL = "https://wbsapi.withings.net/v2/oauth2"
const WITHINGS_MEASURE_URL = "https://wbsapi.withings.net/measure"
const WITHINGS_SCOPE = "user.metrics"
const CONNECTION_ID = 1
const DAY_MS = 24 * 60 * 60 * 1_000
const REFRESH_TOKEN_LIFETIME_MS = 365 * DAY_MS
const SYNC_THROTTLE_MS = 60 * 1_000
const TOKEN_EXPIRY_SKEW_MS = 60 * 1_000
const UPSERT_BATCH_SIZE = 100
const MAX_PAGES = 1_000

export function getWithingsConfig() {
  const clientId = readEnv("WITHINGS_CLIENT_ID")
  const clientSecret = readEnv("WITHINGS_CLIENT_SECRET")
  const encryptionSecret = readEnv("MYDASHBOARD_SESSION_SECRET")
  const missing = [
    clientId ? null : "WITHINGS_CLIENT_ID",
    clientSecret ? null : "WITHINGS_CLIENT_SECRET",
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

export function withingsRedirectUri(requestOrigin: string) {
  const configured = readEnv("WITHINGS_REDIRECT_URI")
  if (configured) return configured
  return new URL("/myDashboard/withings/callback", requestOrigin).toString()
}

export function withingsAuthorizationUrl(redirectUri: string, state: string) {
  const config = requireWithingsConfig()
  const url = new URL(WITHINGS_AUTH_URL)
  url.searchParams.set("client_id", config.clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", WITHINGS_SCOPE)
  url.searchParams.set("state", state)
  return url
}

export async function saveWithingsAuthorizationCode(code: string, redirectUri: string) {
  const config = requireWithingsConfig()
  const tokens = await requestWithingsTokens(new URLSearchParams({
    action: "requesttoken",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  }))
  const tokenValues = requireTokenValues(tokens, true)
  const userId = positiveBigInt(tokens.userid)

  if (userId === null) {
    throw new Error("Withings hat keine gültige User-ID geliefert.")
  }
  if (!hasWithingsScope(tokens.scope ?? WITHINGS_SCOPE)) {
    throw new Error("Withings hat die Freigabe für Körpermessungen nicht erteilt.")
  }

  const now = Date.now()
  const existingConnection = await prisma.withingsConnection.findUnique({
    select: { userId: true },
    where: { id: CONNECTION_ID },
  })
  const saveConnection = prisma.withingsConnection.upsert({
    where: { id: CONNECTION_ID },
    create: {
      id: CONNECTION_ID,
      accessTokenCiphertext: encryptToken(
        tokenValues.accessToken,
        config.encryptionSecret
      ),
      accessTokenExpiresAt: new Date(now + tokenValues.expiresIn * 1_000),
      connectedAt: new Date(now),
      grantedScopes: tokens.scope ?? WITHINGS_SCOPE,
      refreshTokenCiphertext: encryptToken(
        tokenValues.refreshToken,
        config.encryptionSecret
      ),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_LIFETIME_MS),
      userId,
    },
    update: {
      accessTokenCiphertext: encryptToken(
        tokenValues.accessToken,
        config.encryptionSecret
      ),
      accessTokenExpiresAt: new Date(now + tokenValues.expiresIn * 1_000),
      connectedAt: new Date(now),
      grantedScopes: tokens.scope ?? WITHINGS_SCOPE,
      lastSyncedAt: null,
      lastUpdate: null,
      refreshTokenCiphertext: encryptToken(
        tokenValues.refreshToken,
        config.encryptionSecret
      ),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_LIFETIME_MS),
      userId,
    },
  })

  if (existingConnection && existingConnection.userId !== userId) {
    await prisma.$transaction([
      prisma.withingsMeasurement.deleteMany(),
      saveConnection,
    ])
    return
  }

  await saveConnection
}

export async function getWithingsStatus(): Promise<WithingsStatus> {
  const config = getWithingsConfig()
  if (!config.configured) {
    return { missing: config.missing, state: "configuration_missing" }
  }

  const connection = await prisma.withingsConnection.findUnique({
    where: { id: CONNECTION_ID },
  })
  if (!connection) return { state: "not_connected" }

  return {
    connectedAt: connection.connectedAt.toISOString(),
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    refreshTokenExpiresAt: connection.refreshTokenExpiresAt.toISOString(),
    state: connection.refreshTokenExpiresAt <= new Date()
      ? "expired"
      : hasWithingsScope(connection.grantedScopes)
        ? "connected"
        : "scope_update_required",
  }
}

export async function syncWithingsData() {
  const config = requireWithingsConfig()
  const connection = await prisma.withingsConnection.findUnique({
    where: { id: CONNECTION_ID },
  })

  if (!connection) {
    throw new Error("Withings ist noch nicht verbunden.")
  }
  if (connection.refreshTokenExpiresAt <= new Date()) {
    throw new Error("Die Withings-Verbindung ist abgelaufen. Bitte erneut verbinden.")
  }
  if (!hasWithingsScope(connection.grantedScopes)) {
    throw new Error("Withings braucht die Freigabe für Körpermessungen. Bitte neu verbinden.")
  }

  const now = new Date()
  if (
    connection.lastSyncedAt
    && now.getTime() - connection.lastSyncedAt.getTime() < SYNC_THROTTLE_MS
  ) {
    return { processedMeasurements: 0, skipped: true }
  }

  let accessToken = decryptToken(
    connection.accessTokenCiphertext,
    config.encryptionSecret
  )
  let refreshed = false

  if (connection.accessTokenExpiresAt.getTime() <= now.getTime() + TOKEN_EXPIRY_SKEW_MS) {
    accessToken = await refreshWithingsAccessToken(connection, config)
    refreshed = true
  }

  let measurementResult: Awaited<ReturnType<typeof fetchMeasurements>>
  try {
    measurementResult = await fetchMeasurements(accessToken, connection.lastUpdate)
  } catch (error) {
    if (!(error instanceof WithingsApiError) || !error.authenticationError || refreshed) {
      throw error
    }

    accessToken = await refreshWithingsAccessToken(connection, config)
    measurementResult = await fetchMeasurements(accessToken, connection.lastUpdate)
  }

  const measurements = normalizeMeasurements(measurementResult.groups)
  await upsertMeasurements(measurements)
  await prisma.withingsConnection.update({
    where: { id: CONNECTION_ID },
    data: {
      lastSyncedAt: now,
      lastUpdate: measurementResult.lastUpdate,
    },
  })

  return {
    processedMeasurements: measurements.length,
    skipped: false,
  }
}

async function refreshWithingsAccessToken(
  connection: {
    grantedScopes: string
    refreshTokenCiphertext: string
  },
  config: ReturnType<typeof requireWithingsConfig>
) {
  const refreshToken = decryptToken(
    connection.refreshTokenCiphertext,
    config.encryptionSecret
  )
  const tokens = await requestWithingsTokens(new URLSearchParams({
    action: "requesttoken",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }))
  const tokenValues = requireTokenValues(tokens, true)
  const now = Date.now()

  await prisma.withingsConnection.update({
    where: { id: CONNECTION_ID },
    data: {
      accessTokenCiphertext: encryptToken(
        tokenValues.accessToken,
        config.encryptionSecret
      ),
      accessTokenExpiresAt: new Date(now + tokenValues.expiresIn * 1_000),
      grantedScopes: tokens.scope ?? connection.grantedScopes,
      refreshTokenCiphertext: encryptToken(
        tokenValues.refreshToken,
        config.encryptionSecret
      ),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_LIFETIME_MS),
    },
  })

  return tokenValues.accessToken
}

async function requestWithingsTokens(body: URLSearchParams) {
  return withingsPost<WithingsTokenBody>(
    WITHINGS_TOKEN_URL,
    body,
    "Withings OAuth konnte nicht abgeschlossen werden."
  )
}

async function fetchMeasurements(accessToken: string, lastUpdate: bigint | null) {
  const groups: WithingsMeasureGroup[] = []
  const requestedLastUpdate = lastUpdate ?? BigInt(0)
  let nextLastUpdate = requestedLastUpdate
  let offset: string | null = null
  let previousOffset: string | null = null

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body = new URLSearchParams({
      action: "getmeas",
      category: "1",
      lastupdate: requestedLastUpdate.toString(),
      meastypes: "1,6",
    })
    if (offset) body.set("offset", offset)

    const response = await withingsPost<WithingsMeasureBody>(
      WITHINGS_MEASURE_URL,
      body,
      "Withings-Messdaten konnten nicht geladen werden.",
      accessToken
    )
    groups.push(...(response.measuregrps ?? []))

    const responseLastUpdate = nonNegativeBigInt(response.updatetime)
    if (responseLastUpdate !== null && responseLastUpdate > nextLastUpdate) {
      nextLastUpdate = responseLastUpdate
    }

    if (!truthyApiFlag(response.more)) {
      return { groups, lastUpdate: nextLastUpdate }
    }

    previousOffset = offset
    offset = response.offset === undefined ? null : String(response.offset)
    if (!offset || offset === previousOffset) {
      throw new Error("Withings hat eine ungültige Seitennavigation geliefert.")
    }
  }

  throw new Error("Withings hat zu viele Messdatenseiten geliefert.")
}

function normalizeMeasurements(groups: WithingsMeasureGroup[]) {
  const normalized = new Map<bigint, NormalizedMeasurement>()

  for (const group of groups) {
    const groupId = positiveBigInt(group.grpid)
    const measuredAt = unixDate(group.date)
    if (groupId === null || measuredAt === null) continue

    const isDeleted = truthyApiFlag(group.is_deleted)
    let weightKg: number | null = null
    let bodyFatPercent: number | null = null

    if (!isDeleted) {
      for (const measure of group.measures ?? []) {
        const type = Number(measure.type)
        const value = scaledMeasureValue(measure)
        if (value === null) continue

        if (type === 1 && value > 0 && value <= 600) {
          weightKg = Math.round(value * 1_000) / 1_000
        }
        if (type === 6 && value >= 0 && value <= 100) {
          bodyFatPercent = Math.round(value * 100) / 100
        }
      }
    }

    if (!isDeleted && weightKg === null && bodyFatPercent === null) continue

    normalized.set(groupId, {
      bodyFatPercent,
      deviceId: nonEmptyString(group.deviceid),
      groupId,
      isDeleted,
      measuredAt,
      model: nonEmptyString(group.model),
      modifiedAt: unixDate(group.modified),
      weightKg,
    })
  }

  return [...normalized.values()]
}

async function upsertMeasurements(measurements: NormalizedMeasurement[]) {
  for (let index = 0; index < measurements.length; index += UPSERT_BATCH_SIZE) {
    const batch = measurements.slice(index, index + UPSERT_BATCH_SIZE)
    await prisma.$transaction(
      batch.map((measurement) => prisma.withingsMeasurement.upsert({
        where: { groupId: measurement.groupId },
        create: measurement,
        update: {
          bodyFatPercent: measurement.bodyFatPercent,
          deviceId: measurement.deviceId,
          isDeleted: measurement.isDeleted,
          measuredAt: measurement.measuredAt,
          model: measurement.model,
          modifiedAt: measurement.modifiedAt,
          weightKg: measurement.weightKg,
        },
      }))
    )
  }
}

async function withingsPost<T>(
  url: string,
  body: URLSearchParams,
  fallback: string,
  accessToken?: string
): Promise<T> {
  let lastError: WithingsApiError | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      body,
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })
    const payload = await response.json().catch(() => null) as WithingsResponse<T> | null
    const apiStatus = typeof payload?.status === "number" ? payload.status : null

    if (response.ok && apiStatus === 0 && payload?.body !== undefined) {
      return payload.body
    }

    const message = payload?.error?.trim()
      || `${fallback} (${apiStatus ?? response.status})`
    lastError = new WithingsApiError(message, apiStatus, response.status)
    const retryable = response.status === 429
      || response.status >= 500
      || apiStatus === 522
      || apiStatus === 601
    if (!retryable || attempt === 2) throw lastError

    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt))
  }

  throw lastError ?? new Error(fallback)
}

class WithingsApiError extends Error {
  readonly authenticationError: boolean

  constructor(message: string, apiStatus: number | null, httpStatus: number) {
    super(message)
    this.name = "WithingsApiError"
    this.authenticationError = httpStatus === 401
      || apiStatus === 100
      || apiStatus === 101
      || apiStatus === 102
      || apiStatus === 200
      || apiStatus === 401
  }
}

function requireTokenValues(tokens: WithingsTokenBody, requireRefreshToken: boolean) {
  const expiresIn = Number(tokens.expires_in)
  const accessToken = tokens.access_token?.trim() ?? ""
  const refreshToken = tokens.refresh_token?.trim() ?? ""

  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Withings hat kein gültiges Zugriffstoken geliefert.")
  }
  if (requireRefreshToken && !refreshToken) {
    throw new Error("Withings hat kein gültiges Refresh-Token geliefert.")
  }

  return { accessToken, expiresIn, refreshToken }
}

function scaledMeasureValue(measure: WithingsMeasure) {
  const value = Number(measure.value)
  const unit = Number(measure.unit)
  if (
    !Number.isFinite(value)
    || !Number.isInteger(unit)
    || unit < -10
    || unit > 10
  ) {
    return null
  }

  const scaled = value * 10 ** unit
  return Number.isFinite(scaled) ? scaled : null
}

function unixDate(value: unknown) {
  const seconds = Number(value)
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return null
  const date = new Date(seconds * 1_000)
  return Number.isFinite(date.getTime()) ? date : null
}

function positiveBigInt(value: unknown) {
  try {
    if (
      (typeof value === "number" && !Number.isSafeInteger(value))
      || (typeof value !== "number" && typeof value !== "string")
    ) {
      return null
    }
    const parsed = BigInt(value)
    return parsed > BigInt(0) ? parsed : null
  } catch {
    return null
  }
}

function nonNegativeBigInt(value: unknown) {
  try {
    if (
      (typeof value === "number" && !Number.isSafeInteger(value))
      || (typeof value !== "number" && typeof value !== "string")
    ) {
      return null
    }
    const parsed = BigInt(value)
    return parsed >= BigInt(0) ? parsed : null
  } catch {
    return null
  }
}

function truthyApiFlag(value: unknown) {
  return value === true || value === 1 || value === "1"
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function encryptToken(token: string, secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".")
}

function decryptToken(ciphertext: string, secret: string) {
  const [version, ivValue, tagValue, encryptedValue] = ciphertext.split(".")
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Das gespeicherte Withings-Token ist ungültig.")
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(secret),
      Buffer.from(ivValue, "base64url")
    )
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"))
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    throw new Error("Das Withings-Token konnte nicht entschlüsselt werden.")
  }
}

function encryptionKey(secret: string) {
  return createHash("sha256")
    .update(`myDashboard:withings:v1:${secret}`)
    .digest()
}

function hasWithingsScope(scopes: string) {
  return new Set(scopes.split(/[\s,]+/).filter(Boolean)).has(WITHINGS_SCOPE)
}

function requireWithingsConfig() {
  const config = getWithingsConfig()
  if (!config.configured) {
    throw new Error(`Withings ist nicht vollständig konfiguriert: ${config.missing.join(", ")}.`)
  }
  return config
}

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}
