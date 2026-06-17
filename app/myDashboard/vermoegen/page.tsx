import type { Metadata } from "next"

import { hasDashboardSession } from "@/lib/dashboard-auth"
import { getWealthSnapshots } from "@/lib/wealth-data"
import { DashboardActions } from "../_components/dashboard-actions"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { LoginPanel } from "../_components/login-panel"
import { WealthContent } from "../_components/wealth-content"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const metadata: Metadata = {
  title: "Vermögen | myDashboard",
  robots: { index: false, follow: false },
}

export default async function VermoegenPage() {
  const authenticated = await hasDashboardSession()

  if (!authenticated) {
    return <LoginPanel loginFailed={false} />
  }

  try {
    const snapshots = await getWealthSnapshots()

    return (
      <DashboardFrame
        actions={<DashboardActions refreshHref="/myDashboard/vermoegen" />}
        activeSection="vermoegen"
        subtitle={wealthSubtitle(snapshots.at(-1)?.weekKey)}
      >
        <WealthContent snapshots={snapshots} />
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
