import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getPlanningDashboard } from "@/lib/planning-data"
import { PlanningContent } from "../_components/planning-content"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { LoginPanel } from "../_components/login-panel"

export const metadata: Metadata = {
  title: "Planung | myDashboard",
  robots: { index: false, follow: false },
}

export default function PlanningPage() {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="planung" />}>
      <PlanningDashboardContent />
    </Suspense>
  )
}

async function PlanningDashboardContent() {
  await connection()

  const sessionStatus = await getDashboardSessionStatus()
  if (sessionStatus !== "authenticated") {
    return (
      <LoginPanel
        loginError={sessionStatus === "unavailable" ? "unavailable" : undefined}
        nextPath="/myDashboard/planung"
      />
    )
  }

  let dashboard: Awaited<ReturnType<typeof getPlanningDashboard>>
  try {
    dashboard = await getPlanningDashboard()
  } catch (error) {
    return (
      <DashboardError
        detail={error instanceof Error ? error.message : "Planung-Daten konnten nicht geladen werden."}
        help="Die Anmeldung hat funktioniert. Bitte prüfe DATABASE_URL und führe die aktuelle Prisma-Migration aus."
        subtitle="Login erfolgreich, Planung-Daten nicht erreichbar."
        title="Planung-Daten konnten nicht geladen werden"
      />
    )
  }

  return (
    <DashboardFrame activeSection="planung">
      <PlanningContent initial={dashboard} />
    </DashboardFrame>
  )
}
