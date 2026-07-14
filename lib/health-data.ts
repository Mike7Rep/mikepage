import { cacheLife, cacheTag } from "next/cache"

import { prisma } from "@/lib/prisma"

export type HealthEntryView = {
  id: number
  date: string
  bloodPressure1: number | null
  bloodPressure2: number | null
  waistCm: number | null
  bodyFatPercent: number | null
  weightKg: number | null
  pulse: number | null
  updatedAt: string
}

export type HealthGoalsView = {
  bloodPressure1: number | null
  bloodPressure2: number | null
  waistCm: number | null
  bodyFatPercent: number | null
  weightKg: number | null
  pulse: number | null
}

export type HealthGoalMetric =
  | "bloodPressure"
  | "waistCm"
  | "bodyFatPercent"
  | "weightKg"
  | "pulse"

type HealthEntryInput = {
  date: Date
  bloodPressure1: number | null
  bloodPressure2: number | null
  waistCm: number | null
  bodyFatPercent: number | null
  weightKg: number | null
  pulse: number | null
}

type HealthGoalInput = Partial<{
  bloodPressure1: number | null
  bloodPressure2: number | null
  waistCm: number | null
  bodyFatPercent: number | null
  weightKg: number | null
  pulse: number | null
}>

const emptyGoals: HealthGoalsView = {
  bloodPressure1: null,
  bloodPressure2: null,
  waistCm: null,
  bodyFatPercent: null,
  weightKg: null,
  pulse: null,
}

export async function getHealthEntries(): Promise<HealthEntryView[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("dashboard:health")

  const rows = await prisma.healthEntry.findMany({
    orderBy: [{ date: "asc" }, { id: "asc" }],
  })

  return rows.map((row) => ({
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    bloodPressure1: row.bloodPressure1,
    bloodPressure2: row.bloodPressure2,
    waistCm: row.waistCm === null ? null : Number(row.waistCm),
    bodyFatPercent: row.bodyFatPercent === null ? null : Number(row.bodyFatPercent),
    weightKg: row.weightKg === null ? null : Number(row.weightKg),
    pulse: row.pulse,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getHealthGoals(): Promise<HealthGoalsView> {
  "use cache"
  cacheLife("hours")
  cacheTag("dashboard:health-goals")

  const goal = await prisma.healthGoal.findUnique({ where: { id: 1 } })
  if (!goal) {
    return emptyGoals
  }

  return {
    bloodPressure1: goal.bloodPressure1,
    bloodPressure2: goal.bloodPressure2,
    waistCm: goal.waistCm === null ? null : Number(goal.waistCm),
    bodyFatPercent: goal.bodyFatPercent === null ? null : Number(goal.bodyFatPercent),
    weightKg: goal.weightKg === null ? null : Number(goal.weightKg),
    pulse: goal.pulse,
  }
}

export async function upsertHealthEntry(input: HealthEntryInput) {
  return prisma.healthEntry.upsert({
    where: { date: input.date },
    create: input,
    update: {
      ...(input.bloodPressure1 === null ? {} : { bloodPressure1: input.bloodPressure1 }),
      ...(input.bloodPressure2 === null ? {} : { bloodPressure2: input.bloodPressure2 }),
      ...(input.waistCm === null ? {} : { waistCm: input.waistCm }),
      ...(input.bodyFatPercent === null ? {} : { bodyFatPercent: input.bodyFatPercent }),
      ...(input.weightKg === null ? {} : { weightKg: input.weightKg }),
      ...(input.pulse === null ? {} : { pulse: input.pulse }),
    },
  })
}

export async function upsertHealthGoals(input: HealthGoalInput) {
  return prisma.healthGoal.upsert({
    where: { id: 1 },
    create: { id: 1, ...input },
    update: input,
  })
}

export async function deleteHealthEntry(id: number) {
  return prisma.healthEntry.delete({ where: { id } })
}

export function parseHealthEntryForm(formData: FormData): HealthEntryInput {
  return {
    date: parseDate(String(formData.get("date") ?? "")),
    bloodPressure1: parsePositiveInt(formData, "bloodPressure1", "Blutdruck 1", true),
    bloodPressure2: parsePositiveInt(formData, "bloodPressure2", "Blutdruck 2", true),
    waistCm: parsePositiveDecimal(formData, "waistCm", "Bauchumfang", true),
    bodyFatPercent: parsePositiveDecimal(formData, "bodyFatPercent", "Fettgehalt", true),
    weightKg: parsePositiveDecimal(formData, "weightKg", "Gewicht", true),
    pulse: parsePositiveInt(formData, "pulse", "Puls", true),
  }
}

export function parseHealthGoalsForm(formData: FormData): HealthGoalInput {
  const metric = String(formData.get("metric") ?? "") as HealthGoalMetric

  if (metric === "bloodPressure") {
    return {
      bloodPressure1: parsePositiveInt(formData, "bloodPressure1", "Blutdruck 1"),
      bloodPressure2: parsePositiveInt(formData, "bloodPressure2", "Blutdruck 2"),
    }
  }

  if (metric === "pulse") {
    return { pulse: parsePositiveInt(formData, "pulse", "Puls") }
  }

  if (metric === "waistCm" || metric === "bodyFatPercent" || metric === "weightKg") {
    const labels = {
      waistCm: "Bauchumfang",
      bodyFatPercent: "Fettgehalt",
      weightKg: "Gewicht",
    } as const
    return { [metric]: parsePositiveDecimal(formData, metric, labels[metric]) }
  }

  throw new Error("Unbekannter Zielwert.")
}

function parseDate(raw: string) {
  const value = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Datum muss im Format YYYY-MM-DD sein.")
  }

  return new Date(`${value}T00:00:00.000Z`)
}

function parsePositiveInt(formData: FormData, key: string, label: string, optional = false) {
  const raw = String(formData.get(key) ?? "").trim()
  if (!raw && optional) return null

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label} muss eine positive ganze Zahl sein.`)
  }

  const value = Number(raw)
  if (value <= 0) {
    throw new Error(`${label} muss groesser als 0 sein.`)
  }

  return value
}

function parsePositiveDecimal(formData: FormData, key: string, label: string, optional = false) {
  const raw = String(formData.get(key) ?? "").trim().replace(",", ".")
  if (!raw && optional) return null

  if (!/^\d+(\.\d)?$/.test(raw)) {
    throw new Error(`${label} muss eine positive Zahl mit maximal einer Dezimalstelle sein.`)
  }

  const value = Number(raw)
  if (value <= 0) {
    throw new Error(`${label} muss groesser als 0 sein.`)
  }

  return value
}
