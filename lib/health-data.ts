import { cacheLife, cacheTag } from "next/cache"

import { prisma } from "@/lib/prisma"

export type HealthEntryView = {
  id: number
  date: string
  bloodPressure1: number
  bloodPressure2: number
  waistCm: number
  updatedAt: string
}

export type HealthEntryInput = {
  date: Date
  bloodPressure1: number
  bloodPressure2: number
  waistCm: number
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
    waistCm: Number(row.waistCm),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function upsertHealthEntry(input: HealthEntryInput) {
  return prisma.healthEntry.upsert({
    where: { date: input.date },
    create: input,
    update: {
      bloodPressure1: input.bloodPressure1,
      bloodPressure2: input.bloodPressure2,
      waistCm: input.waistCm,
    },
  })
}

export async function deleteHealthEntry(id: number) {
  return prisma.healthEntry.delete({
    where: { id },
  })
}

export function parseHealthEntryForm(formData: FormData): HealthEntryInput {
  return {
    date: parseDate(String(formData.get("date") ?? "")),
    bloodPressure1: parsePositiveInt(formData, "bloodPressure1", "Blutdruck 1"),
    bloodPressure2: parsePositiveInt(formData, "bloodPressure2", "Blutdruck 2"),
    waistCm: parseWaistCm(formData),
  }
}

function parseDate(raw: string) {
  const value = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Datum muss im Format YYYY-MM-DD sein.")
  }

  return new Date(`${value}T00:00:00.000Z`)
}

function parsePositiveInt(formData: FormData, key: string, label: string) {
  const raw = String(formData.get(key) ?? "").trim()
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label} muss eine positive ganze Zahl sein.`)
  }

  const value = Number(raw)
  if (value <= 0) {
    throw new Error(`${label} muss groesser als 0 sein.`)
  }

  return value
}

function parseWaistCm(formData: FormData) {
  const raw = String(formData.get("waistCm") ?? "").trim().replace(",", ".")
  if (!/^\d+(\.\d)?$/.test(raw)) {
    throw new Error("Bauchumfang muss eine positive Zahl mit maximal einer Dezimalstelle sein.")
  }

  const value = Number(raw)
  if (value <= 0) {
    throw new Error("Bauchumfang muss groesser als 0 sein.")
  }

  return value
}
