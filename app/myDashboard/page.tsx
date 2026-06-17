import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { hasDashboardSession } from "@/lib/dashboard-auth"
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

  redirect("/myDashboard/depot")
}

function searchValue(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}
