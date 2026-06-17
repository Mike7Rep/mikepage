import type { Metadata } from "next"
import { Suspense } from "react"

import { hasDashboardSession } from "@/lib/dashboard-auth"
import { getInvestmentAssets, getWealthSnapshots } from "@/lib/wealth-data"
import { DashboardActions } from "../_components/dashboard-actions"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { LoginPanel } from "../_components/login-panel"
import { WealthContent } from "../_components/wealth-content"

export const metadata: Metadata = {
  title: "Vermögen | myDashboard",
  robots: { index: false, follow: false },
}

export default function VermoegenPage() {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="vermoegen" subtitle="Vermögen wird geladen." />}>
      <VermoegenContent />
    </Suspense>
  )
}

async function VermoegenContent() {
  const authenticated = await hasDashboardSession()

  if (!authenticated) {
    return <LoginPanel loginFailed={false} />
  }

  try {
    const [snapshots, investmentAssets] = await Promise.all([
      getWealthSnapshots(),
      getInvestmentAssets(),
    ])

    return (
      <DashboardFrame
        actions={<DashboardActions refreshHref="/myDashboard/vermoegen" />}
        activeSection="vermoegen"
        subtitle={wealthSubtitle(snapshots.at(-1)?.weekKey)}
      >
        <WealthContent investmentAssets={investmentAssets} snapshots={snapshots} />
      </DashboardFrame>
    )
  } catch (error) {
    return (
      <DashboardError
        message={error instanceof Error ? error.message : "Vermögensdaten konnten nicht geladen werden."}
      />
    )
  }
}

function wealthSubtitle(latestWeekKey?: string) {
  return latestWeekKey ? `Letzter Eintrag: KW ${latestWeekKey}` : "Noch keine Vermögensdaten"
}
