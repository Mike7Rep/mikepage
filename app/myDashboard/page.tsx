import type { Metadata } from "next"

import { hasDashboardSession } from "@/lib/dashboard-auth"
import { getDashboardPortfolio } from "@/lib/python-api"
import { DashboardActions } from "./_components/dashboard-actions"
import { DashboardContent, dashboardSubtitle } from "./_components/dashboard-content"
import { DashboardError } from "./_components/dashboard-error"
import { DashboardFrame } from "./_components/dashboard-frame"
import { LoginPanel } from "./_components/login-panel"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const metadata: Metadata = {
  title: "myDashboard | Michael Repolusk",
  robots: { index: false, follow: false },
}

export default async function MyDashboardPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {}
  const authenticated = await hasDashboardSession()

  if (!authenticated) {
    return <LoginPanel loginFailed={searchValue(params, "login") === "failed"} />
  }

  return <AuthenticatedDashboard />
}

async function AuthenticatedDashboard() {
  let data: Awaited<ReturnType<typeof getDashboardPortfolio>> | null = null
  let errorMessage: string | null = null

  try {
    data = await getDashboardPortfolio()
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
  }

  if (!data) {
    return <DashboardError message={errorMessage || "Unbekannter Fehler"} />
  }

  return (
    <DashboardFrame actions={<DashboardActions />} subtitle={dashboardSubtitle(data)}>
      <DashboardContent data={data} />
    </DashboardFrame>
  )
}

function searchValue(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}
