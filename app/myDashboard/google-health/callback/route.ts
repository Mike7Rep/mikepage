import { createHash, timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import {
  GOOGLE_HEALTH_COOKIE_PATH,
  GOOGLE_HEALTH_STATE_COOKIE,
  googleHealthRedirectUri,
  saveGoogleHealthAuthorizationCode,
} from "@/lib/google-health"

export async function GET(request: NextRequest) {
  const sessionStatus = await getDashboardSessionStatus()
  if (sessionStatus !== "authenticated") {
    return clearStateCookie(
      NextResponse.redirect(new URL("/myDashboard?next=/myDashboard/health", request.url))
    )
  }

  const receivedState = request.nextUrl.searchParams.get("state") ?? ""
  const expectedState = request.cookies.get(GOOGLE_HEALTH_STATE_COOKIE)?.value ?? ""
  if (!receivedState || !expectedState || !secureEqual(receivedState, expectedState)) {
    return healthRedirect(request, "invalid_state")
  }

  if (request.nextUrl.searchParams.has("error")) {
    return healthRedirect(request, "denied")
  }

  const code = request.nextUrl.searchParams.get("code")
  if (!code) {
    return healthRedirect(request, "oauth_error")
  }

  try {
    await saveGoogleHealthAuthorizationCode(
      code,
      googleHealthRedirectUri(request.nextUrl.origin)
    )
    return healthRedirect(request, "connected")
  } catch (error) {
    console.error(
      "Google Health OAuth callback failed:",
      error instanceof Error ? error.message : error
    )
    return healthRedirect(request, "oauth_error")
  }
}

function healthRedirect(request: NextRequest, result: string) {
  const url = new URL("/myDashboard/health", request.url)
  url.searchParams.set("googleHealth", result)
  return clearStateCookie(NextResponse.redirect(url))
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_HEALTH_STATE_COOKIE, "", {
    maxAge: 0,
    path: GOOGLE_HEALTH_COOKIE_PATH,
  })
  return response
}

function secureEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest()
  const rightHash = createHash("sha256").update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}
