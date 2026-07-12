import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { DASHBOARD_SESSION_COOKIE, normalizeDashboardPath } from "@/lib/dashboard-auth"

const DASHBOARD_ROOT = "/myDashboard"
const DASHBOARD_PATH_HEADER = "x-mydashboard-path"

export function proxy(request: NextRequest) {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`

  if (
    request.nextUrl.pathname !== DASHBOARD_ROOT &&
    !request.cookies.has(DASHBOARD_SESSION_COOKIE)
  ) {
    const loginUrl = new URL(DASHBOARD_ROOT, request.url)
    loginUrl.searchParams.set("next", normalizeDashboardPath(path))
    return NextResponse.redirect(loginUrl)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(DASHBOARD_PATH_HEADER, path)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: "/myDashboard/:path*",
}
