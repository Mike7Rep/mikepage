import { cacheLife, cacheTag } from "next/cache"

import { prisma } from "@/lib/prisma"

export type HealthEntryView = {
  id: number | null
  date: string
  bloodPressure1: number | null
  bloodPressure2: number | null
  waistCm: number | null
  bodyFatPercent: number | null
  weightKg: number | null
  updatedAt: string
}

export type HealthGoalsView = {
  bloodPressure1: number | null
  bloodPressure2: number | null
  waistCm: number | null
  bodyFatPercent: number | null
  weightKg: number | null
}

export type HealthGoalMetric =
  | "bloodPressure"
  | "waistCm"
  | "bodyFatPercent"
  | "weightKg"

type HealthEntryInput = {
  date: Date
  bloodPressure1: number | null
  bloodPressure2: number | null
  waistCm: number | null
}

type HealthGoalInput = Partial<{
  bloodPressure1: number | null
  bloodPressure2: number | null
  waistCm: number | null
  bodyFatPercent: number | null
  weightKg: number | null
}>

const emptyGoals: HealthGoalsView = {
  bloodPressure1: null,
  bloodPressure2: null,
  waistCm: null,
  bodyFatPercent: null,
  weightKg: null,
}

const HEALTH_RETENTION_YEARS = 1

export async function getHealthEntries(): Promise<HealthEntryView[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("dashboard:health")

  const retentionStart = healthRetentionStart()
  const [rows, withingsMeasurements] = await Promise.all([
    prisma.healthEntry.findMany({
      orderBy: [{ date: "asc" }, { id: "asc" }],
      where: { date: { gte: retentionStart } },
    }),
    prisma.withingsMeasurement.findMany({
      orderBy: [{ measuredAt: "asc" }, { groupId: "asc" }],
      where: {
        isDeleted: false,
        measuredAt: { gte: retentionStart },
      },
    }),
  ])
  const entries = new Map<string, HealthEntryView>()

  for (const row of rows) {
    const date = row.date.toISOString().slice(0, 10)
    entries.set(date, {
      id: row.id,
      date,
      bloodPressure1: row.bloodPressure1,
      bloodPressure2: row.bloodPressure2,
      waistCm: row.waistCm === null ? null : Number(row.waistCm),
      bodyFatPercent: null,
      weightKg: null,
      updatedAt: row.updatedAt.toISOString(),
    })
  }

  for (const measurement of withingsMeasurements) {
    const date = zurichDate(measurement.measuredAt)
    const entry = entries.get(date) ?? {
      id: null,
      date,
      bloodPressure1: null,
      bloodPressure2: null,
      waistCm: null,
      bodyFatPercent: null,
      weightKg: null,
      updatedAt: measurement.updatedAt.toISOString(),
    }

    entries.set(date, {
      ...entry,
      bodyFatPercent: measurement.bodyFatPercent === null
        ? entry.bodyFatPercent
        : Number(measurement.bodyFatPercent),
      weightKg: measurement.weightKg === null
        ? entry.weightKg
        : Number(measurement.weightKg),
      updatedAt: measurement.updatedAt > new Date(entry.updatedAt)
        ? measurement.updatedAt.toISOString()
        : entry.updatedAt,
    })
  }

  return [...entries.values()].sort((left, right) => left.date.localeCompare(right.date))
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
  }
}

export async function upsertHealthEntry(input: HealthEntryInput) {
  const retentionStart = healthRetentionStart()
  if (input.date < retentionStart) {
    throw new Error("Health-Einträge können höchstens ein Jahr zurückliegen.")
  }

  return prisma.$transaction(async (transaction) => {
    const entry = await transaction.healthEntry.upsert({
      where: { date: input.date },
      create: {
        ...input,
        bodyFatPercent: null,
        weightKg: null,
      },
      update: {
        ...(input.bloodPressure1 === null ? {} : { bloodPressure1: input.bloodPressure1 }),
        ...(input.bloodPressure2 === null ? {} : { bloodPressure2: input.bloodPressure2 }),
        ...(input.waistCm === null ? {} : { waistCm: input.waistCm }),
      },
    })
    await transaction.healthEntry.deleteMany({
      where: { date: { lt: retentionStart } },
    })
    return entry
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

function zurichDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Zurich",
    year: "numeric",
  }).format(value)
}

function healthRetentionStart(reference = new Date()) {
  const start = new Date(reference)
  start.setUTCFullYear(start.getUTCFullYear() - HEALTH_RETENTION_YEARS)
  start.setUTCHours(0, 0, 0, 0)
  return start
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
