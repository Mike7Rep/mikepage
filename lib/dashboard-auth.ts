import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto"
import { cache } from "react"
import { createClient } from "redis"
import { cookies } from "next/headers"

export const DASHBOARD_SESSION_COOKIE = "mydashboard_session"
const COOKIE_PATH = "/myDashboard"
const SESSION_MAX_AGE = 60 * 60 * 24 * 10
const LOGIN_WINDOW_SECONDS = 60 * 15
const MAX_LOGIN_ATTEMPTS = 8
const DEFAULT_DASHBOARD_PATH = "/myDashboard/vermoegen"

type DashboardCredentials = {
  user: string
  password: string
  secret: string
}

export type DashboardSessionStatus =
  | "authenticated"
  | "unauthenticated"
  | "unavailable"

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}

function createDashboardRedisClient() {
  const client = createClient({
    url: readEnv("REDIS_URL"),
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 2_500,
      reconnectStrategy: false,
    },
  })
  client.on("error", (error) => {
    console.error("Dashboard Redis error:", error.message)
  })
  return client
}

type DashboardRedisClient = ReturnType<typeof createDashboardRedisClient>
type RedisGlobal = typeof globalThis & {
  dashboardRedis?: DashboardRedisClient
  dashboardRedisConnection?: Promise<DashboardRedisClient>
}

const redisGlobal = globalThis as RedisGlobal

function getCredentials(): DashboardCredentials {
  return {
    user: readEnv("MYDASHBOARD_USER"),
    password: readEnv("MYDASHBOARD_PASSWORD"),
    secret: readEnv("MYDASHBOARD_SESSION_SECRET"),
  }
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest()
}

function secureCompare(input: string, expected: string) {
  return timingSafeEqual(hashValue(input), hashValue(expected))
}

function keyedHash(value: string) {
  return createHmac("sha256", getCredentials().secret)
    .update(value)
    .digest("hex")
}

function sessionKey(token: string) {
  return `mydashboard:session:v1:${keyedHash(token)}`
}

function loginAttemptKey(identifier: string) {
  return `mydashboard:login:v1:${keyedHash(identifier)}`
}

async function getRedis() {
  const url = readEnv("REDIS_URL")
  if (!url) {
    throw new Error("REDIS_URL fehlt.")
  }

  const client = redisGlobal.dashboardRedis ?? createDashboardRedisClient()
  redisGlobal.dashboardRedis = client
  if (client.isReady) {
    return client
  }

  let connection = redisGlobal.dashboardRedisConnection
  if (!connection) {
    connection = client.connect()
      .then(() => client)
      .catch((error) => {
        redisGlobal.dashboardRedis = undefined
        throw error
      })
      .finally(() => {
        redisGlobal.dashboardRedisConnection = undefined
      })
    redisGlobal.dashboardRedisConnection = connection
  }

  return connection
}

export function getDashboardAuthConfig() {
  const credentials = getCredentials()
  const missing = [
    credentials.user ? null : "MYDASHBOARD_USER",
    credentials.password ? null : "MYDASHBOARD_PASSWORD",
    credentials.secret ? null : "MYDASHBOARD_SESSION_SECRET",
    readEnv("REDIS_URL") ? null : "REDIS_URL",
  ].filter(Boolean) as string[]

  return {
    configured: missing.length === 0,
    missing,
  }
}

export function normalizeDashboardPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/myDashboard/")) {
    return DEFAULT_DASHBOARD_PATH
  }

  try {
    const url = new URL(value, "https://mydashboard.local")
    if (url.origin !== "https://mydashboard.local") {
      return DEFAULT_DASHBOARD_PATH
    }

    return `${url.pathname}${url.search}`
  } catch {
    return DEFAULT_DASHBOARD_PATH
  }
}

export async function validateDashboardLogin(user: string, password: string) {
  const credentials = getCredentials()

  if (!credentials.user || !credentials.password) {
    return false
  }

  return (
    secureCompare(user.trim(), credentials.user) &&
    secureCompare(password, credentials.password)
  )
}

export const getDashboardSessionStatus = cache(async (): Promise<DashboardSessionStatus> => {
  if (!getDashboardAuthConfig().configured) {
    return "unavailable"
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(DASHBOARD_SESSION_COOKIE)?.value
  if (!token) {
    return "unauthenticated"
  }

  try {
    const redis = await getRedis()
    return await redis.exists(sessionKey(token))
      ? "authenticated"
      : "unauthenticated"
  } catch {
    return "unavailable"
  }
})

export async function createDashboardSession() {
  const credentials = getCredentials()
  const token = randomBytes(32).toString("base64url")
  const redis = await getRedis()

  await redis.set(
    sessionKey(token),
    JSON.stringify({ user: credentials.user, createdAt: new Date().toISOString() }),
    { EX: SESSION_MAX_AGE }
  )

  const cookieStore = await cookies()
  cookieStore.set(DASHBOARD_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: COOKIE_PATH,
    priority: "high",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export async function clearDashboardSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(DASHBOARD_SESSION_COOKIE)?.value

  cookieStore.delete({ name: DASHBOARD_SESSION_COOKIE, path: COOKIE_PATH })

  if (token) {
    try {
      const redis = await getRedis()
      await redis.del(sessionKey(token))
    } catch {
      // The local cookie is cleared even if Redis is temporarily unavailable.
    }
  }
}

export async function isDashboardLoginRateLimited(identifier: string) {
  const redis = await getRedis()
  const attempts = Number(await redis.get(loginAttemptKey(identifier)) ?? 0)
  return attempts >= MAX_LOGIN_ATTEMPTS
}

export async function recordFailedDashboardLogin(identifier: string) {
  const redis = await getRedis()
  const key = loginAttemptKey(identifier)
  const attempts = await redis.incr(key)

  if (attempts === 1) {
    await redis.expire(key, LOGIN_WINDOW_SECONDS)
  }
}

export async function clearDashboardLoginAttempts(identifier: string) {
  const redis = await getRedis()
  await redis.del(loginAttemptKey(identifier))
}
