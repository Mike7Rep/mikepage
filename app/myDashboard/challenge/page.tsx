import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getPullUpChallengeDashboard, todayInZurich } from "@/lib/pull-up-data"
import { ChallengeContent } from "../_components/challenge-content"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardFrame } from "../_components/dashboard-frame"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { LoginPanel } from "../_components/login-panel"

export const metadata: Metadata = {
  title: "Challenge | myDashboard",
  robots: { index: false, follow: false },
}

export default function ChallengePage() {
  return (
    <Suspense fallback={<DashboardLoadingFrame activeSection="challenge" />}>
      <ChallengeDashboardContent />
    </Suspense>
  )
}

async function ChallengeDashboardContent() {
  await connection()

  const sessionStatus = await getDashboardSessionStatus()
  if (sessionStatus !== "authenticated") {
    return (
      <LoginPanel
        loginError={sessionStatus === "unavailable" ? "unavailable" : undefined}
        nextPath="/myDashboard/challenge"
      />
    )
  }

  let dashboard: Awaited<ReturnType<typeof getPullUpChallengeDashboard>>
  try {
    dashboard = await getPullUpChallengeDashboard()
  } catch (error) {
    return (
      <DashboardError
        detail={error instanceof Error ? error.message : "Challenge-Daten konnten nicht geladen werden."}
        help="Die Anmeldung hat funktioniert. Bitte prüfe DATABASE_URL und führe die aktuelle Prisma-Migration aus."
        subtitle="Login erfolgreich, Challenge-Daten nicht erreichbar."
        title="Challenge-Daten konnten nicht geladen werden"
      />
    )
  }

  return (
    <DashboardFrame activeSection="challenge">
      <ChallengeContent {...dashboard} today={todayInZurich()} />
    </DashboardFrame>
  )
}
