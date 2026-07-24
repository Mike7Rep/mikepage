import { createHash, timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import {
  WITHINGS_COOKIE_PATH,
  WITHINGS_STATE_COOKIE,
  saveWithingsAuthorizationCode,
  withingsRedirectUri,
} from "@/lib/withings"

export async function GET(request: NextRequest) {
  const sessionStatus = await getDashboardSessionStatus()
  if (sessionStatus !== "authenticated") {
    return clearStateCookie(
      NextResponse.redirect(
        new URL(
          "/myDashboard?next=/myDashboard/health",
          withingsRedirectUri(request.nextUrl.origin)
        )
      )
    )
  }

  const receivedState = request.nextUrl.searchParams.get("state") ?? ""
  const expectedState = request.cookies.get(WITHINGS_STATE_COOKIE)?.value ?? ""
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
    await saveWithingsAuthorizationCode(
      code,
      withingsRedirectUri(request.nextUrl.origin)
    )
    return healthRedirect(request, "connected")
  } catch (error) {
    console.error(
      "Withings OAuth callback failed:",
      error instanceof Error ? error.message : error
    )
    return healthRedirect(request, "oauth_error")
  }
}

function healthRedirect(request: NextRequest, result: string) {
  const url = new URL(
    "/myDashboard/health",
    withingsRedirectUri(request.nextUrl.origin)
  )
  url.searchParams.set("withings", result)
  return clearStateCookie(NextResponse.redirect(url))
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set(WITHINGS_STATE_COOKIE, "", {
    maxAge: 0,
    path: WITHINGS_COOKIE_PATH,
  })
  return response
}

function secureEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest()
  const rightHash = createHash("sha256").update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}
