import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getHealthEntries, getHealthGoals } from "@/lib/health-data"
import {
  getDailyCaloriesSeries,
  getDailyRunSeries,
  getDailySleepIndexSeries,
  getDailyStepsSeries,
  getGoogleHealthStatus,
} from "@/lib/google-health"
import { getWithingsStatus } from "@/lib/withings"
import { DashboardError } from "../_components/dashboard-error"
import { DashboardLoadingFrame } from "../_components/dashboard-loading-frame"
import { HealthContent } from "../_components/health-content"
import { LoginPanel } from "../_components/login-panel"

export const metadata: Metadata = {
  title: "Health | myDashboard",
  robots: { index: false, follow: false },
}

export default function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{
    googleHealth?: string | string[]
    withings?: string | string[]
  }>
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
  searchParams: Promise<{
    googleHealth?: string | string[]
    withings?: string | string[]
  }>
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

  const healthData = await Promise.all([
    getHealthEntries(),
    getHealthGoals(),
    getDailyCaloriesSeries(),
    getDailyRunSeries(),
    getDailySleepIndexSeries(),
    getDailyStepsSeries(),
    getGoogleHealthStatus(),
    getWithingsStatus(),
    searchParams,
  ]).then(
    (data) => ({ data } as const),
    (error: unknown) => ({ error } as const)
  )

  if ("error" in healthData) {
    return (
      <DashboardError
        detail={healthData.error instanceof Error ? healthData.error.message : "Health-Daten konnten nicht geladen werden."}
        help="Die Anmeldung hat funktioniert. Bitte pruefe DATABASE_URL und die öffentliche Railway-Postgres-Verbindung."
        subtitle="Login erfolgreich, Postgres nicht erreichbar."
        title="Health-Daten konnten nicht geladen werden"
      />
    )
  }

  const [
    entries,
    goals,
    dailyCalories,
    dailyRuns,
    dailySleep,
    dailySteps,
    googleHealthStatus,
    withingsStatus,
    params,
  ] = healthData.data
  const googleHealthResult = Array.isArray(params.googleHealth)
    ? params.googleHealth[0]
    : params.googleHealth
  const withingsResult = Array.isArray(params.withings)
    ? params.withings[0]
    : params.withings

  return (
    <HealthContent
      entries={entries}
      goals={goals}
      googleHealthResult={googleHealthResult}
      googleHealthStatus={googleHealthStatus}
      initialDailyCalories={dailyCalories}
      initialDailyRuns={dailyRuns}
      initialDailySleep={dailySleep}
      initialDailySteps={dailySteps}
      withingsResult={withingsResult}
      withingsStatus={withingsStatus}
    />
  )
}
