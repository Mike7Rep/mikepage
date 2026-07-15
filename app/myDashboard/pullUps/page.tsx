import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getPullUpEntries, todayInZurich } from "@/lib/pull-up-data"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { LoginPanel } from "../_components/login-panel"
import { PullUpsContent } from "../_components/pull-ups-content"

export const metadata: Metadata = {
  title: "Pullups | myDashboard",
  robots: { index: false, follow: false },
}

export default function PullUpsPage() {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="pullUps" />}>
      <PullUpsDashboardContent />
    </Suspense>
  )
}

async function PullUpsDashboardContent() {
  await connection()

  const sessionStatus = await getDashboardSessionStatus()

  if (sessionStatus !== "authenticated") {
    return (
      <LoginPanel
        loginError={sessionStatus === "unavailable" ? "unavailable" : undefined}
        nextPath="/myDashboard/pullUps"
      />
    )
  }

  let entries: Awaited<ReturnType<typeof getPullUpEntries>>
  try {
    entries = await getPullUpEntries()
  } catch (error) {
    return (
      <DashboardError
        detail={error instanceof Error ? error.message : "Pullup-Daten konnten nicht geladen werden."}
        help="Die Anmeldung hat funktioniert. Bitte pruefe DATABASE_URL und ob die Pullup-Migration ausgeführt wurde."
        subtitle="Login erfolgreich, Pullup-Daten nicht erreichbar."
        title="Pullup-Daten konnten nicht geladen werden"
      />
    )
  }

  return (
    <DashboardFrame activeSection="pullUps">
      <PullUpsContent entries={entries} today={todayInZurich()} />
    </DashboardFrame>
  )
}
