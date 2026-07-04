import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { hasDashboardSession } from "@/lib/dashboard-auth"
import { getDashboardPortfolio } from "@/lib/python-api"
import { DashboardActions } from "../_components/dashboard-actions"
import { DashboardContent, dashboardSubtitle } from "../_components/dashboard-content"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { LoginPanel } from "../_components/login-panel"

export const metadata: Metadata = {
  title: "Depot | myDashboard",
  robots: { index: false, follow: false },
}

export default function DepotPage() {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="depot" subtitle="Depot wird geladen." />}>
      <DepotContent />
    </Suspense>
  )
}

async function DepotContent() {
  await connection()

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
    return (
      <DashboardError
        detail={errorMessage || "Unbekannter Fehler"}
        help="Die Anmeldung hat funktioniert. Bitte pruefe die Python API, PYTHON_API_URL, PYTHON_API_TOKEN und die Alpaca-Verbindung."
        subtitle="Login erfolgreich, Python API nicht erreichbar."
        title="Depot-Daten konnten nicht geladen werden"
      />
    )
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
