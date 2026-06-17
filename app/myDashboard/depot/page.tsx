import type { Metadata } from "next"

import { hasDashboardSession } from "@/lib/dashboard-auth"
import { getDashboardPortfolio } from "@/lib/python-api"
import { DashboardActions } from "../_components/dashboard-actions"
import { DashboardContent, dashboardSubtitle } from "../_components/dashboard-content"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { LoginPanel } from "../_components/login-panel"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const metadata: Metadata = {
  title: "Depot | myDashboard",
  robots: { index: false, follow: false },
}

export default async function DepotPage() {
  const authenticated = await hasDashboardSession()

  if (!authenticated) {
    return <LoginPanel loginFailed={false} />
  }

  let data: Awaited<ReturnType<typeof getDashboardPortfolio>> | null = null
  let errorMessage: string | null = null

  try {
    data = await getDashboardPortfolio()
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
  }

  if (!data) {
    return <DashboardError message={errorMessage || "Unbekannter Fehler"} />
  }

  return (
    <DashboardFrame
      actions={<DashboardActions refreshHref="/myDashboard/depot" />}
      activeSection="depot"
      subtitle={dashboardSubtitle(data)}
    >
      <DashboardContent data={data} />
    </DashboardFrame>
  )
}
