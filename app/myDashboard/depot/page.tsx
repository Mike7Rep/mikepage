import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getDashboardPortfolio } from "@/lib/python-api"
import { DashboardActions } from "../_components/dashboard-actions"
import { DashboardContent, dashboardUpdatedLabel } from "../_components/dashboard-content"
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
    <Suspense fallback={<DashboardLoadingFrame activeSection="depot" />}>
      <DepotContent />
    </Suspense>
  )
}

async function DepotContent() {
  await connection()

  const sessionStatus = await getDashboardSessionStatus()

  if (sessionStatus !== "authenticated") {
    return (
      <LoginPanel
        loginError={sessionStatus === "unavailable" ? "unavailable" : undefined}
        nextPath="/myDashboard/depot"
      />
    )
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
        help="Die Anmeldung hat funktioniert. Bitte pruefe ALPACA_ENDPOINT, ALPACA_DATA_ENDPOINT, ALPACA_KEY, ALPACA_SECRET und die Alpaca-Verbindung."
        subtitle="Login erfolgreich, Alpaca-Daten nicht erreichbar."
        title="Depot-Daten konnten nicht geladen werden"
      />
    )
  }

  return (
    <DashboardFrame
      actions={<DashboardActions status={dashboardUpdatedLabel(data)} />}
      activeSection="depot"
    >
      <DashboardContent data={data} />
    </DashboardFrame>
  )
}
