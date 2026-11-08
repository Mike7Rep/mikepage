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
import { alpacaAccountKey, createAlpacaClient, getAssetChart } from "@/lib/python-api"
import { getDepotData, syncDepot } from "@/lib/depot-data"
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

export async function getDepotHistoryAction(refresh = false) {
  return depotAction(async () => {
    if (typeof refresh !== "boolean") throw new Error("Ungültige Anfrage.")
    const account = await createAlpacaClient().getAccount()
    const accountKey = alpacaAccountKey(account)
    if (refresh) {
      await syncDepot(accountKey)
      updateTag("dashboard:portfolio")
      updateTag("dashboard:asset-chart")
    }
    return getDepotData(accountKey)
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

export async function getAlpacaEquityAction() {
  await requireDashboardSession()
  const account = await createAlpacaClient().getAccount()
  const value = Number(account.equity)
  if (!Number.isFinite(value)) throw new Error("Depotwert nicht verfügbar.")
  return { value, currency: String(account.currency) }
}

export async function searchStocksAction(query: string) {
  await requireDashboardSession()
  if (query.trim().length < 1) return []
  const assets = await createAlpacaClient().getAssets()
  const term = query.trim().toUpperCase()
  return assets.filter(a => a.tradable && (String(a.symbol).includes(term) || String(a.name).toUpperCase().includes(term)))
    .sort((a,b) => Number(String(b.symbol) === term) - Number(String(a.symbol) === term))
    .slice(0, 20).map(a => ({ symbol: String(a.symbol), name: String(a.name) }))
}

export async function placeStockOrderAction(input: { symbol: string; side: "buy" | "sell"; qty: string; type: "market" | "limit"; limit: string; id: string }) {
  try {
    await requireDashboardSession()
    if (!/^[A-Z0-9.-]{1,20}$/.test(input.symbol) || !["buy", "sell"].includes(input.side) || !["market", "limit"].includes(input.type) || !/^[0-9a-f-]{36}$/.test(input.id)) throw new Error("Ungültige Order.")
    if (!/^\d+(\.\d{1,9})?$/.test(input.qty) || Number(input.qty) <= 0) throw new Error("Ungültige Stückzahl.")
    if (input.type === "limit" && (!Number.isFinite(Number(input.limit)) || Number(input.limit) <= 0)) throw new Error("Ungültiges Limit.")
    const client = createAlpacaClient()
    // Reuse the same broker identifier after a timeout; never create a second order on retry.
    try {
      const existing = await client.getOrderByClientId(input.id)
      return { ok: true as const, status: String(existing.status) }
    } catch (error) {
      if (!(error instanceof Error && "status" in error && error.status === 404)) throw error
    }
    const [asset, positions, account] = await Promise.all([client.getAsset(input.symbol), client.getPositions(), client.getAccount()])
    if (!asset.tradable || asset.class !== "us_equity" || account.trading_blocked) throw new Error("Handel nicht verfügbar.")
    if (!Number.isInteger(Number(input.qty)) && !asset.fractionable) throw new Error("Nur ganze Aktien möglich.")
    const held = positions.find(p => p.symbol === input.symbol)
    if (input.side === "sell" && Number(input.qty) > Number(held?.qty_available ?? held?.qty ?? 0)) throw new Error("Nicht genügend verfügbare Aktien.")
    const order = await client.submitOrder({ symbol: input.symbol, side: input.side, qty: input.qty, type: input.type, time_in_force: "day", client_order_id: input.id, ...(input.type === "limit" ? { limit_price: input.limit } : {}) })
    updateTag("dashboard:portfolio")
    updateTag("dashboard:asset-chart")
    revalidatePath("/myDashboard/depot")
    return { ok: true as const, status: String(order.status) }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Order fehlgeschlagen." }
  }
}
