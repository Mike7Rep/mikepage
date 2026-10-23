"use server"

import { getDashboardSessionStatus } from "@/lib/dashboard-auth"
import { getPlanningDashboard } from "@/lib/planning-data"

export async function planningAction(page: number, update?: { week: string; version: number; tasks: unknown }) {
  if (await getDashboardSessionStatus() !== "authenticated") return { ok: false as const, error: "Bitte erneut anmelden." }
  try {
    return { ok: true as const, data: await getPlanningDashboard(page, update) }
  } catch (error) {
    console.error("Planning:", error)
    return { ok: false as const, error: error instanceof Error && /Woche|Aufgabe|Seite|Sonntag/.test(error.message) ? error.message : "Speichern oder Laden fehlgeschlagen. Bitte erneut versuchen." }
  }
}
