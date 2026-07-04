import type { Metadata } from "next"
import { Suspense } from "react"

import { hasDashboardSession } from "@/lib/dashboard-auth"
import { getHealthEntries } from "@/lib/health-data"
import { DashboardActions } from "../_components/dashboard-actions"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { HealthContent } from "../_components/health-content"
import { LoginPanel } from "../_components/login-panel"

export const metadata: Metadata = {
  title: "Health | myDashboard",
  robots: { index: false, follow: false },
}

export default function HealthPage() {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="health" subtitle="Health wird geladen." />}>
      <HealthDashboardContent />
    </Suspense>
  )
}

async function HealthDashboardContent() {
  const authenticated = await hasDashboardSession()

  if (!authenticated) {
    return <LoginPanel loginFailed={false} />
  }

  try {
    const entries = await getHealthEntries()

    return (
      <DashboardFrame
        actions={<DashboardActions refreshHref="/myDashboard/health" />}
        activeSection="health"
        subtitle={healthSubtitle(entries.at(-1)?.date)}
      >
        <HealthContent entries={entries} />
      </DashboardFrame>
    )
  } catch (error) {
    return (
      <DashboardError
        message={error instanceof Error ? error.message : "Health-Daten konnten nicht geladen werden."}
      />
    )
  }
}

function healthSubtitle(latestDate?: string) {
  return latestDate ? `Letzter Eintrag: ${latestDate}` : "Noch keine Health-Daten"
}
