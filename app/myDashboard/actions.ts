"use server"

import { redirect } from "next/navigation"
import { revalidatePath, updateTag } from "next/cache"
import { headers } from "next/headers"

import {
  clearDashboardLoginAttempts,
  clearDashboardSession,
  createDashboardSession,
  getDashboardSessionStatus,
  isDashboardLoginRateLimited,
  normalizeDashboardPath,
  recordFailedDashboardLogin,
  validateDashboardLogin,
} from "@/lib/dashboard-auth"
import { getAssetChart } from "@/lib/python-api"
import {
  deleteHealthEntry,
  parseHealthEntryForm,
  parseHealthGoalsForm,
  upsertHealthEntry,
  upsertHealthGoals,
} from "@/lib/health-data"
import {
  deleteWealthSnapshot,
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
  const nextPath = normalizeDashboardPath(formData.get("next"))
  const identifier = await dashboardLoginIdentifier()

  let rateLimited = false
  try {
    rateLimited = await isDashboardLoginRateLimited(identifier)
  } catch {
    redirectToLogin("unavailable", nextPath)
  }

  if (rateLimited) {
    redirectToLogin("limited", nextPath)
  }

  if (!(await validateDashboardLogin(user, password))) {
    try {
      await recordFailedDashboardLogin(identifier)
    } catch {
      redirectToLogin("unavailable", nextPath)
    }

    redirectToLogin("failed", nextPath)
  }

  try {
    await createDashboardSession()
    await clearDashboardLoginAttempts(identifier)
  } catch {
    redirectToLogin("unavailable", nextPath)
  }

  redirect(nextPath)
}

export async function logoutDashboardAction() {
  await clearDashboardSession()
  redirect("/myDashboard")
}

export async function getAssetChartAction(symbol: string): Promise<AssetChartActionResult> {
  const sessionStatus = await getDashboardSessionStatus()
  if (sessionStatus !== "authenticated") {
    return {
      ok: false,
      error: sessionStatus === "unavailable"
        ? "Login-Service ist momentan nicht erreichbar."
        : "Nicht angemeldet.",
    }
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
  await requireDashboardSession()

  await upsertWealthSnapshot(parseWealthSnapshotForm(formData))
  updateTag("dashboard:wealth")
  revalidatePath("/myDashboard/vermoegen")
}

export async function deleteWealthSnapshotAction(formData: FormData) {
  await requireDashboardSession()

  const id = Number(formData.get("id"))
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Vermögenseintrag konnte nicht gelöscht werden.")
  }

  await deleteWealthSnapshot(id)
  updateTag("dashboard:wealth")
  revalidatePath("/myDashboard/vermoegen")
}

export async function updateInvestmentAssetsAction(formData: FormData) {
  await requireDashboardSession()

  await replaceInvestmentAssets(parseInvestmentAssetsForm(formData))
  updateTag("dashboard:investment-assets")
  revalidatePath("/myDashboard/vermoegen")
}

export async function createOrUpdateHealthEntryAction(formData: FormData) {
  await requireDashboardSession()

  await upsertHealthEntry(parseHealthEntryForm(formData))
  updateTag("dashboard:health")
  revalidatePath("/myDashboard/health")
}

export async function deleteHealthEntryAction(formData: FormData) {
  await requireDashboardSession()

  const id = Number(formData.get("id"))
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Health-Eintrag konnte nicht gelöscht werden.")
  }

  await deleteHealthEntry(id)
  updateTag("dashboard:health")
  revalidatePath("/myDashboard/health")
}

export async function updateHealthGoalsAction(formData: FormData) {
  await requireDashboardSession()

  await upsertHealthGoals(parseHealthGoalsForm(formData))
  updateTag("dashboard:health-goals")
  revalidatePath("/myDashboard/health")
}

async function requireDashboardSession() {
  const status = await getDashboardSessionStatus()

  if (status === "unavailable") {
    throw new Error("Login-Service ist momentan nicht erreichbar.")
  }

  if (status !== "authenticated") {
    throw new Error("Nicht angemeldet.")
  }
}

async function dashboardLoginIdentifier() {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwardedFor || requestHeaders.get("x-real-ip") || "unknown"
}

function redirectToLogin(reason: "failed" | "limited" | "unavailable", nextPath: string): never {
  const params = new URLSearchParams({ login: reason, next: nextPath })
  redirect(`/myDashboard?${params.toString()}`)
}
