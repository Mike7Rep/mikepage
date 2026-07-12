import { cacheLife, cacheTag } from "next/cache"

import { prisma } from "@/lib/prisma"

export type WealthSnapshotView = {
  id: number
  weekKey: string
  year: number
  week: number
  currency: string
  total: number
  diff: number | null
  savings: number
  cashReserve: number
  investments: number
  mintos: number
  bondora: number
  alpaca: number
  bankAccount: number
  card: number
  legacyDegiro: number
  updatedAt: string
}

export type WealthSnapshotInput = {
  weekKey: string
  savings: number
  cashReserve: number
  investments: number
  mintos: number
  bondora: number
  alpaca: number
  bankAccount: number
  card: number
}

export type InvestmentAssetView = {
  id: number
  name: string
  value: number
  totalValue: number | null
  sharePercent: number | null
  valuationDate: string | null
  sortOrder: number
  updatedAt: string
}

export type InvestmentAssetInput = {
  name: string
  value: number
  totalValue: number | null
  sharePercent: number | null
  valuationDate: Date | null
  sortOrder: number
}

export async function getWealthSnapshots(): Promise<WealthSnapshotView[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("dashboard:wealth")

  const rows = await prisma.wealthSnapshot.findMany({
    orderBy: [{ year: "asc" }, { week: "asc" }, { id: "asc" }],
  })

  let previousTotal: number | null = null
  return rows.map((row) => {
    const total = Number(row.total)
    const snapshot: WealthSnapshotView = {
      id: row.id,
      weekKey: row.weekKey,
      year: row.year,
      week: row.week,
      currency: row.currency,
      total,
      diff: previousTotal === null ? null : total - previousTotal,
      savings: Number(row.savings),
      cashReserve: Number(row.cashReserve),
      investments: Number(row.investments),
      mintos: Number(row.mintos),
      bondora: Number(row.bondora),
      alpaca: Number(row.alpaca),
      bankAccount: Number(row.bankAccount),
      card: Number(row.card),
      legacyDegiro: Number(row.legacyDegiro),
      updatedAt: row.updatedAt.toISOString(),
    }
    previousTotal = total
    return snapshot
  })
}

export async function getInvestmentAssets(): Promise<InvestmentAssetView[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("dashboard:investment-assets")

  const rows = await prisma.investmentAsset.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    value: Number(row.value),
    totalValue: row.totalValue === null ? null : Number(row.totalValue),
    sharePercent: row.sharePercent === null ? null : Number(row.sharePercent),
    valuationDate: row.valuationDate ? row.valuationDate.toISOString().slice(0, 10) : null,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function upsertWealthSnapshot(input: WealthSnapshotInput) {
  const { year, week } = parseWeekKey(input.weekKey)
  const existing = await prisma.wealthSnapshot.findUnique({
    where: { weekKey: input.weekKey },
  })
  const legacyDegiro = existing ? Number(existing.legacyDegiro) : 0
  const total = totalFromInput(input, legacyDegiro)

  return prisma.wealthSnapshot.upsert({
    where: { weekKey: input.weekKey },
    create: {
      ...input,
      year,
      week,
      currency: "CHF",
      legacyDegiro,
      total,
    },
    update: {
      ...input,
      year,
      week,
      currency: "CHF",
      legacyDegiro,
      total,
    },
  })
}

export async function deleteWealthSnapshot(id: number) {
  return prisma.wealthSnapshot.delete({
    where: { id },
  })
}

export async function replaceInvestmentAssets(inputs: InvestmentAssetInput[]) {
  return prisma.$transaction(async (tx) => {
    await tx.investmentAsset.deleteMany()

    if (!inputs.length) {
      return
    }

    await tx.investmentAsset.createMany({
      data: inputs.map((input, index) => ({
        ...input,
        sortOrder: index,
      })),
    })
  })
}

export function parseWealthSnapshotForm(formData: FormData): WealthSnapshotInput {
  const weekKey = String(formData.get("weekKey") ?? "").trim()
  parseWeekKey(weekKey)

  return {
    weekKey,
    savings: parseMoney(formData, "savings"),
    cashReserve: parseMoney(formData, "cashReserve"),
    investments: parseMoney(formData, "investments"),
    mintos: parseMoney(formData, "mintos"),
    bondora: parseMoney(formData, "bondora"),
    alpaca: parseMoney(formData, "alpaca"),
    bankAccount: parseMoney(formData, "bankAccount"),
    card: parseMoney(formData, "card"),
  }
}

export function parseInvestmentAssetsForm(formData: FormData): InvestmentAssetInput[] {
  const names = formData.getAll("investmentAssetName")
  const totalValues = formData.getAll("investmentAssetTotalValue")
  const sharePercents = formData.getAll("investmentAssetSharePercent")
  const valuationDates = formData.getAll("investmentAssetValuationDate")

  return names.flatMap((rawName, index) => {
    const name = String(rawName ?? "").trim()
    const rawTotalValue = String(totalValues[index] ?? "").trim()
    const rawSharePercent = String(sharePercents[index] ?? "").trim()
    const rawValuationDate = String(valuationDates[index] ?? "").trim()

    if (!name && !rawTotalValue && !rawSharePercent) {
      return []
    }

    if (!name) {
      throw new Error("Anlagen-Zeilen brauchen einen Namen.")
    }
    if (!rawTotalValue || !rawSharePercent) {
      throw new Error("Anlagen-Zeilen brauchen Gesamt Anlage und Anteile.")
    }

    const totalValue = parseOptionalMoneyString(rawTotalValue)
    const sharePercent = parseOptionalPercentString(rawSharePercent)

    return [{
      name,
      value: Math.round(((totalValue ?? 0) * (sharePercent ?? 0)) / 100),
      totalValue,
      sharePercent,
      valuationDate: parseOptionalDateString(rawValuationDate),
      sortOrder: index,
    }]
  })
}

function totalFromInput(input: WealthSnapshotInput, legacyDegiro: number) {
  return [
    input.savings,
    input.cashReserve,
    input.investments,
    input.mintos,
    input.bondora,
    legacyDegiro,
    input.alpaca,
    input.bankAccount,
    input.card,
  ].reduce((sum, value) => sum + value, 0)
}

function parseWeekKey(weekKey: string) {
  const match = /^(\d{2})_(\d{2})$/.exec(weekKey)
  if (!match) {
    throw new Error("KW muss im Format YY_KW sein, z. B. 26_21.")
  }

  const year = 2000 + Number(match[1])
  const week = Number(match[2])
  if (week < 1 || week > 53) {
    throw new Error("KW muss zwischen 01 und 53 liegen.")
  }

  return { year, week }
}

function parseMoney(formData: FormData, key: keyof Omit<WealthSnapshotInput, "weekKey">) {
  const raw = String(formData.get(key) ?? "").trim()
  if (!raw) return 0

  return parseMoneyString(raw)
}

function parseMoneyString(raw: string) {
  const normalized = raw.replace(/'/g, "")
  if (!/^\d+$/.test(normalized)) {
    throw new Error("Beträge müssen ganze positive Zahlen sein.")
  }

  return Number(normalized)
}

function parseOptionalMoneyString(raw: string) {
  if (!raw.trim()) return null
  return parseMoneyString(raw)
}

function parseOptionalPercentString(raw: string) {
  if (!raw.trim()) return null
  if (!/^\d+$/.test(raw)) {
    throw new Error("Anteile müssen ganze positive Zahlen sein.")
  }

  const value = Number(raw)
  if (value > 100) {
    throw new Error("Anteile dürfen maximal 100 sein.")
  }

  return value
}

function parseOptionalDateString(raw: string) {
  if (!raw.trim()) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error("Datum muss im Format YYYY-MM-DD sein.")
  }

  return new Date(`${raw}T00:00:00.000Z`)
}
