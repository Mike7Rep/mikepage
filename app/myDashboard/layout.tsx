import { Suspense, type ReactNode } from "react"
import type { Viewport } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  getDashboardSessionStatus,
  normalizeDashboardPath,
} from "@/lib/dashboard-auth"
import { DashboardLoadingFrame } from "./_components/dashboard-loading-frame"

const DASHBOARD_ROOT = "/myDashboard"

export const viewport: Viewport = {
  colorScheme: "dark",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
  userScalable: false,
  width: "device-width",
}

export default function MyDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full max-w-full touch-pan-y overflow-x-hidden overscroll-x-none md:touch-auto">
      <Suspense fallback={<DashboardLoadingFrame />}>
        <DashboardGuard>{children}</DashboardGuard>
      </Suspense>
    </div>
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
