import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getHealthEntries, getHealthGoals } from "@/lib/health-data"
import { DashboardActions } from "../_components/dashboard-actions"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { HealthContent, HealthEntryDialog } from "../_components/health-content"
import { LoginPanel } from "../_components/login-panel"

export const metadata: Metadata = {
  title: "Health | myDashboard",
  robots: { index: false, follow: false },
}

export default function HealthPage() {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="health" />}>
      <HealthDashboardContent />
    </Suspense>
  )
}

async function HealthDashboardContent() {
  await connection()

  const sessionStatus = await getDashboardSessionStatus()

  if (sessionStatus !== "authenticated") {
    return (
      <LoginPanel
        loginError={sessionStatus === "unavailable" ? "unavailable" : undefined}
        nextPath="/myDashboard/health"
      />
    )
  }

  try {
    const [entries, goals] = await Promise.all([
      getHealthEntries(),
      getHealthGoals(),
    ])

    return (
      <DashboardFrame
        actions={
          <>
            <HealthEntryDialog />
            <DashboardActions status={healthStatus(entries.at(-1)?.date)} />
          </>
        }
        activeSection="health"
      >
        <HealthContent entries={entries} goals={goals} />
      </DashboardFrame>
    )
  } catch (error) {
    return (
      <DashboardError
        detail={error instanceof Error ? error.message : "Health-Daten konnten nicht geladen werden."}
        help="Die Anmeldung hat funktioniert. Bitte pruefe DATABASE_URL und ob die lokale Postgres-Datenbank läuft."
        subtitle="Login erfolgreich, Postgres nicht erreichbar."
        title="Health-Daten konnten nicht geladen werden"
      />
    )
  }
}

function healthStatus(latestDate?: string) {
  return latestDate ? `Letzter Eintrag: ${latestDate}` : "Noch keine Health-Daten"
}
