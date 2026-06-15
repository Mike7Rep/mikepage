"use server"

import { redirect } from "next/navigation"

import {
  clearDashboardSession,
  createDashboardSession,
  hasDashboardSession,
  validateDashboardLogin,
} from "@/lib/dashboard-auth"
import { getAssetChart } from "@/lib/python-api"

export async function loginDashboardAction(formData: FormData) {
  const user = String(formData.get("user") ?? "")
  const password = String(formData.get("password") ?? "")

  if (await validateDashboardLogin(user, password)) {
    await createDashboardSession()
    redirect("/myDashboard")
  }

  redirect("/myDashboard?login=failed")
}

export async function logoutDashboardAction() {
  await clearDashboardSession()
  redirect("/myDashboard")
}

export async function getAssetChartAction(symbol: string) {
  if (!(await hasDashboardSession())) {
    throw new Error("Nicht angemeldet.")
  }
  return getAssetChart(symbol)
}
