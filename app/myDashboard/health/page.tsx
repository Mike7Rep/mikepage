import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getHealthEntries, getHealthGoals } from "@/lib/health-data"
import { getGoogleHealthStatus, getHeartRateChartSeries } from "@/lib/google-health"
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

export default function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ googleHealth?: string | string[] }>
}) {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="health" />}>
      <HealthDashboardContent searchParams={searchParams} />
    </Suspense>
  )
}

async function HealthDashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ googleHealth?: string | string[] }>
}) {
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
    const [entries, goals, heartRateSeries, googleHealthStatus, params] = await Promise.all([
      getHealthEntries(),
      getHealthGoals(),
      getHeartRateChartSeries(),
      getGoogleHealthStatus(),
      searchParams,
    ])
    const googleHealthResult = Array.isArray(params.googleHealth)
      ? params.googleHealth[0]
      : params.googleHealth

    return (
      <DashboardFrame
        actions={
          <>
            <HealthEntryDialog entries={entries} />
            <DashboardActions status={healthStatus(entries.at(-1)?.date)} />
          </>
        }
        activeSection="health"
      >
        <HealthContent
          entries={entries}
          goals={goals}
          googleHealthResult={googleHealthResult}
          googleHealthStatus={googleHealthStatus}
          initialHeartRateSeries={heartRateSeries}
        />
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
