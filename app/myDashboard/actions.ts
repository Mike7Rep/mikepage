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
import { getDepotData, getTradingAccount } from "@/lib/depot-data"
import { advanceTrader, getTraderState, startTrader } from "@/lib/depot-trader"
import { getDepotOrders, previewOrder, refreshDepotOrders, submitMarketOrder } from "@/lib/depot-orders"
import {
  deleteHealthEntry,
  getHealthEntries,
  parseHealthEntryForm,
  parseHealthGoalsForm,
  upsertHealthEntry,
  upsertHealthGoals,
} from "@/lib/health-data"
import {
  getDailyCaloriesSeries,
  getDailySleepIndexSeries,
  getDailyStepsSeries,
  getGoogleHealthStatus,
  syncGoogleHealthData,
} from "@/lib/google-health"
import {
  createPullUpChallenge,
  incrementPullUps,
  parsePullUpChallengeForm,
} from "@/lib/pull-up-data"
import { getWithingsStatus, syncWithingsData } from "@/lib/withings"
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

export async function syncGoogleHealthAction() {
  await requireDashboardSession()

  try {
    const sync = await syncGoogleHealthData()
    const [calories, sleep, status, steps] = await Promise.all([
      getDailyCaloriesSeries(),
      getDailySleepIndexSeries(),
      getGoogleHealthStatus(),
      getDailyStepsSeries(),
    ])
    revalidatePath("/myDashboard/health")
    return {
      calories,
      ok: true,
      sleep,
      status,
      steps,
      ...sync,
    } as const
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error
        ? error.message
        : "Google Health konnte nicht synchronisiert werden.",
    } as const
  }
}

export async function syncWithingsAction() {
  await requireDashboardSession()

  try {
    const sync = await syncWithingsData()
    updateTag("dashboard:health")
    const [entries, status] = await Promise.all([
      getHealthEntries(),
      getWithingsStatus(),
    ])
    revalidatePath("/myDashboard/health")
    return { ok: true, entries, status, ...sync } as const
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error
        ? error.message
        : "Withings konnte nicht synchronisiert werden.",
    } as const
  }
}

export async function incrementPullUpsAction(amount: number) {
  await requireDashboardSession()

  if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000) {
    throw new Error("Pullups konnten nicht gespeichert werden.")
  }

  const entry = await incrementPullUps(amount)
  updateTag("dashboard:pull-ups")
  revalidatePath("/myDashboard/challenge")

  return { count: entry.count }
}

export async function createPullUpChallengeAction(formData: FormData) {
  await requireDashboardSession()

  const challenge = await createPullUpChallenge(parsePullUpChallengeForm(formData))
  updateTag("dashboard:pull-ups")
  revalidatePath("/myDashboard/challenge")

  return { id: challenge.id }
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

async function depotAction<T>(work: () => Promise<T>) {
  try {
    await requireDashboardSession()
    return { ok: true, data: await work() } as const
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && ["P2021", "P2022"].includes(String(error.code))) {
      return { ok: false, error: "Die Depot-Datenbank ist noch nicht eingerichtet. Bitte die neue Prisma-Migration beim Deployment ausführen." } as const
    }
    return { ok: false, error: error instanceof Error ? error.message : "Depot-Aktion fehlgeschlagen." } as const
  }
}

export async function getDepotWorkspaceAction() {
  return depotAction(async () => {
    const account = await getTradingAccount()
    const [depot, trader, orders] = await Promise.all([getDepotData(account.accountKey), getTraderState(account.accountKey), getDepotOrders(account.accountKey)])
    return { account, depot, trader, orders }
  })
}

export async function startTraderAction(analyze: boolean) {
  return depotAction(async () => {
    if (typeof analyze !== "boolean") throw new Error("Ungültiger Analyse-Modus.")
    return startTrader(analyze)
  })
}

export async function advanceTraderAction(runId: number) {
  return depotAction(async () => {
    if (!Number.isSafeInteger(runId) || runId <= 0) throw new Error("Ungültiger Analyse-Lauf.")
    const state = await advanceTrader(runId)
    updateTag("dashboard:portfolio")
    updateTag("dashboard:asset-chart")
    return state
  })
}

export async function previewDepotOrderAction(symbol: string, side: "buy" | "sell", qty: string) {
  return depotAction(() => previewOrder(symbol, side, qty))
}

export async function submitDepotOrderAction(id: string) {
  return depotAction(async () => {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Ungültige Order-ID.")
    const orders = await submitMarketOrder(id)
    updateTag("dashboard:portfolio")
    updateTag("dashboard:asset-chart")
    return orders
  })
}

export async function refreshDepotOrdersAction() {
  return depotAction(async () => {
    const data = await refreshDepotOrders()
    updateTag("dashboard:portfolio")
    return data
  })
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
