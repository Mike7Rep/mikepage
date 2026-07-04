import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { hasDashboardSession } from "@/lib/dashboard-auth"
import { DashboardLoadingFrame } from "./_components/dashboard-loading-frame"
import { LoginPanel } from "./_components/login-panel"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const metadata: Metadata = {
  title: "myDashboard | Michael Repolusk",
  robots: { index: false, follow: false },
}

export default function MyDashboardPage({ searchParams }: { searchParams?: SearchParams }) {
  return (
    <Suspense fallback={<DashboardLoadingFrame subtitle="Login wird geprüft." />}>
      <MyDashboardGate searchParams={searchParams} />
    </Suspense>
  )
}

async function MyDashboardGate({ searchParams }: { searchParams?: SearchParams }) {
  await connection()

  const params = searchParams ? await searchParams : {}
  const authenticated = await hasDashboardSession()

  if (!authenticated) {
    return <LoginPanel loginFailed={searchValue(params, "login") === "failed"} />
  }

  redirect("/myDashboard/depot")
}

function searchValue(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}
