import { Suspense, type ReactNode } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  getDashboardSessionStatus,
  normalizeDashboardPath,
} from "@/lib/dashboard-auth"
import { DashboardLoadingFrame } from "./_components/dashboard-loading-frame"

const DASHBOARD_ROOT = "/myDashboard"

export default function MyDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardLoadingFrame />}>
      <DashboardGuard>{children}</DashboardGuard>
    </Suspense>
  )
}

async function DashboardGuard({ children }: { children: ReactNode }) {
  const requestHeaders = await headers()
  const requestedPath = requestHeaders.get("x-mydashboard-path")

  if (requestedPath === DASHBOARD_ROOT || requestedPath?.startsWith(`${DASHBOARD_ROOT}?`)) {
    return children
  }

  const sessionStatus = await getDashboardSessionStatus()
  if (sessionStatus === "authenticated") {
    return children
  }

  const params = new URLSearchParams({
    next: normalizeDashboardPath(requestedPath),
  })
  if (sessionStatus === "unavailable") {
    params.set("login", "unavailable")
  }

  redirect(`${DASHBOARD_ROOT}?${params.toString()}`)
}
