import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getInvestmentAssets, getWealthSnapshots } from "@/lib/wealth-data"
import { DashboardActions } from "../_components/dashboard-actions"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { LoginPanel } from "../_components/login-panel"
import { WealthContent } from "../_components/wealth-content"
import { formatDateTime } from "../format"

export const metadata: Metadata = {
  title: "Vermögen | myDashboard",
  robots: { index: false, follow: false },
}

export default function VermoegenPage() {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="vermoegen" />}>
      <VermoegenContent />
    </Suspense>
  )
}

async function VermoegenContent() {
  await connection()

  const sessionStatus = await getDashboardSessionStatus()

  if (sessionStatus !== "authenticated") {
    return (
      <LoginPanel
        loginError={sessionStatus === "unavailable" ? "unavailable" : undefined}
        nextPath="/myDashboard/vermoegen"
      />
    )
  }

  let data: Awaited<ReturnType<typeof getVermoegenData>>
  try {
    data = await getVermoegenData()
  } catch (error) {
    return (
      <DashboardError
        detail={error instanceof Error ? error.message : "Vermögensdaten konnten nicht geladen werden."}
        help="Die Anmeldung hat funktioniert. Bitte pruefe DATABASE_URL und ob die lokale Postgres-Datenbank läuft."
        subtitle="Login erfolgreich, Postgres nicht erreichbar."
        title="Vermögensdaten konnten nicht geladen werden"
      />
    )
  }

  return (
    <DashboardFrame
      actions={<DashboardActions status={wealthUpdatedLabel(data.snapshots.at(-1)?.updatedAt)} />}
      activeSection="vermoegen"
    >
      <WealthContent
        key={data.investmentAssets.map((asset) => asset.updatedAt).join()}
        investmentAssets={data.investmentAssets}
        snapshots={data.snapshots}
      />
    </DashboardFrame>
  )
}

function wealthUpdatedLabel(updatedAt?: string) {
  return updatedAt ? `Aktualisiert: ${formatDateTime(updatedAt)}` : "Noch keine Vermögensdaten"
}

async function getVermoegenData() {
  const [snapshots, investmentAssets] = await Promise.all([
    getWealthSnapshots(),
    getInvestmentAssets(),
  ])

  return { investmentAssets, snapshots }
}
