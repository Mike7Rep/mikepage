import { randomBytes } from "crypto"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import {
  GOOGLE_HEALTH_COOKIE_PATH,
  GOOGLE_HEALTH_STATE_COOKIE,
  getGoogleHealthConfig,
  googleHealthAuthorizationUrl,
  googleHealthRedirectUri,
} from "@/lib/google-health"

export async function GET(request: NextRequest) {
  const sessionStatus = await getDashboardSessionStatus()
  if (sessionStatus !== "authenticated") {
    return NextResponse.redirect(
      new URL(
        "/myDashboard?next=/myDashboard/health",
        googleHealthRedirectUri(request.nextUrl.origin)
      )
    )
  }

  const config = getGoogleHealthConfig()
  if (!config.configured) {
    return healthRedirect(request, "configuration_missing")
  }

  const state = randomBytes(32).toString("base64url")
  const redirectUri = googleHealthRedirectUri(request.nextUrl.origin)
  const response = NextResponse.redirect(googleHealthAuthorizationUrl(redirectUri, state))
  response.cookies.set(GOOGLE_HEALTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: GOOGLE_HEALTH_COOKIE_PATH,
    priority: "high",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:",
  })
  return response
}

function healthRedirect(request: NextRequest, result: string) {
  const url = new URL(
    "/myDashboard/health",
    googleHealthRedirectUri(request.nextUrl.origin)
  )
  url.searchParams.set("googleHealth", result)
  return NextResponse.redirect(url)
}
