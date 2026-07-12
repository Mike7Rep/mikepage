import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import {
  getDashboardSessionStatus,
  normalizeDashboardPath,
} from "@/lib/dashboard-auth"
import { DashboardLoadingFrame } from "./_components/dashboard-loading-frame"
import { LoginPanel } from "./_components/login-panel"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const metadata: Metadata = {
  title: "myDashboard | Michael Repolusk",
  robots: { index: false, follow: false },
}

export default function MyDashboardPage({ searchParams }: { searchParams?: SearchParams }) {
  return (
    <Suspense fallback={<DashboardLoadingFrame />}>
      <MyDashboardGate searchParams={searchParams} />
    </Suspense>
  )
}

async function MyDashboardGate({ searchParams }: { searchParams?: SearchParams }) {
  await connection()

  const params = searchParams ? await searchParams : {}
  const nextPath = normalizeDashboardPath(searchValue(params, "next"))
  const loginError = loginErrorValue(params)

  if (loginError === "unavailable") {
    return <LoginPanel loginError={loginError} nextPath={nextPath} />
  }

  const sessionStatus = await getDashboardSessionStatus()

  if (sessionStatus !== "authenticated") {
    return (
      <LoginPanel
        loginError={sessionStatus === "unavailable"
          ? "unavailable"
          : loginError}
        nextPath={nextPath}
      />
    )
  }

  redirect(nextPath)
}

function searchValue(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

function loginErrorValue(params: Record<string, string | string[] | undefined>) {
  const value = searchValue(params, "login")
  return value === "failed" || value === "limited" || value === "unavailable"
    ? value
    : undefined
}
