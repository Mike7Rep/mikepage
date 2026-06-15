import { createHash, createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "mydashboard_session"
const SESSION_MAX_AGE = 60 * 60 * 8
const COOKIE_PATH = "/myDashboard"

type DashboardCredentials = {
  user: string
  password: string
  secret: string
}

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}

function getCredentials(): DashboardCredentials {
  const user = readEnv("MYDASHBOARD_USER")
  const password = readEnv("MYDASHBOARD_PASSWORD")
  const secret = readEnv("MYDASHBOARD_SESSION_SECRET") || password

  return { user, password, secret }
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest()
}

function secureCompare(input: string, expected: string) {
  return timingSafeEqual(hashValue(input), hashValue(expected))
}

function sessionSignature(credentials: DashboardCredentials) {
  return createHmac("sha256", credentials.secret)
    .update(`${credentials.user}:${credentials.password}`)
    .digest("hex")
}

export function getDashboardAuthConfig() {
  const credentials = getCredentials()
  const missing = [
    credentials.user ? null : "MYDASHBOARD_USER",
    credentials.password ? null : "MYDASHBOARD_PASSWORD",
    credentials.secret ? null : "MYDASHBOARD_SESSION_SECRET",
  ].filter(Boolean) as string[]

  return {
    configured: missing.length === 0,
    missing,
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

export async function hasDashboardSession() {
  const credentials = getCredentials()

  if (!credentials.user || !credentials.password || !credentials.secret) {
    return false
  }

  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)?.value

  return session ? secureCompare(session, sessionSignature(credentials)) : false
}

export async function createDashboardSession() {
  const credentials = getCredentials()
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, sessionSignature(credentials), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: COOKIE_PATH,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export async function clearDashboardSession() {
  const cookieStore = await cookies()

  cookieStore.delete({
    name: COOKIE_NAME,
    path: COOKIE_PATH,
  })
}
