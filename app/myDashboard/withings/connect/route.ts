import { randomBytes } from "crypto"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import {
  WITHINGS_COOKIE_PATH,
  WITHINGS_STATE_COOKIE,
  getWithingsConfig,
  withingsAuthorizationUrl,
  withingsRedirectUri,
} from "@/lib/withings"

export async function GET(request: NextRequest) {
  const sessionStatus = await getDashboardSessionStatus()
  if (sessionStatus !== "authenticated") {
    return NextResponse.redirect(
      new URL(
        "/myDashboard?next=/myDashboard/health",
        withingsRedirectUri(request.nextUrl.origin)
      )
    )
  }

  const config = getWithingsConfig()
  if (!config.configured) {
    return healthRedirect(request, "configuration_missing")
  }

  const state = randomBytes(32).toString("base64url")
  const redirectUri = withingsRedirectUri(request.nextUrl.origin)
  const response = NextResponse.redirect(withingsAuthorizationUrl(redirectUri, state))
  response.cookies.set(WITHINGS_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: WITHINGS_COOKIE_PATH,
    priority: "high",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:",
  })
  return response
}

function healthRedirect(request: NextRequest, result: string) {
  const url = new URL(
    "/myDashboard/health",
    withingsRedirectUri(request.nextUrl.origin)
  )
  url.searchParams.set("withings", result)
  return NextResponse.redirect(url)
}
