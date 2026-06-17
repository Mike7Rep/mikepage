"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import {
  clearDashboardSession,
  createDashboardSession,
  hasDashboardSession,
  validateDashboardLogin,
} from "@/lib/dashboard-auth"
import { getAssetChart } from "@/lib/python-api"
import { parseWealthSnapshotForm, upsertWealthSnapshot } from "@/lib/wealth-data"

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

export async function createOrUpdateWealthSnapshotAction(formData: FormData) {
  if (!(await hasDashboardSession())) {
    throw new Error("Nicht angemeldet.")
  }

  await upsertWealthSnapshot(parseWealthSnapshotForm(formData))
  revalidatePath("/myDashboard/vermoegen")
}
