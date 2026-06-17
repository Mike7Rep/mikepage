"use server"

import { redirect } from "next/navigation"
import { revalidatePath, updateTag } from "next/cache"

import {
  clearDashboardSession,
  createDashboardSession,
  hasDashboardSession,
  validateDashboardLogin,
} from "@/lib/dashboard-auth"
import { getAssetChart } from "@/lib/python-api"
import {
  parseInvestmentAssetsForm,
  parseWealthSnapshotForm,
  replaceInvestmentAssets,
  upsertWealthSnapshot,
} from "@/lib/wealth-data"

export type AssetChartActionResult =
  | { ok: true; data: Awaited<ReturnType<typeof getAssetChart>> }
  | { ok: false; error: string }

export async function loginDashboardAction(formData: FormData) {
  const user = String(formData.get("user") ?? "")
  const password = String(formData.get("password") ?? "")

  if (await validateDashboardLogin(user, password)) {
    await createDashboardSession()
    redirect("/myDashboard/depot")
  }

  redirect("/myDashboard?login=failed")
}

export async function logoutDashboardAction() {
  await clearDashboardSession()
  redirect("/myDashboard")
}

export async function getAssetChartAction(symbol: string): Promise<AssetChartActionResult> {
  if (!(await hasDashboardSession())) {
    return { ok: false, error: "Nicht angemeldet." }
  }

  try {
    const data = await getAssetChart(symbol)
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Chart konnte nicht geladen werden.",
    }
  }
}

export async function createOrUpdateWealthSnapshotAction(formData: FormData) {
  if (!(await hasDashboardSession())) {
    throw new Error("Nicht angemeldet.")
  }

  await upsertWealthSnapshot(parseWealthSnapshotForm(formData))
  updateTag("dashboard:wealth")
  revalidatePath("/myDashboard/vermoegen")
}

export async function updateInvestmentAssetsAction(formData: FormData) {
  if (!(await hasDashboardSession())) {
    throw new Error("Nicht angemeldet.")
  }

  await replaceInvestmentAssets(parseInvestmentAssetsForm(formData))
  updateTag("dashboard:investment-assets")
  revalidatePath("/myDashboard/vermoegen")
}
