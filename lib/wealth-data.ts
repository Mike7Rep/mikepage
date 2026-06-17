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

export async function getWealthSnapshots(): Promise<WealthSnapshotView[]> {
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

  const normalized = raw.replace(/'/g, "").replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Beträge müssen positiv sein und maximal 2 Nachkommastellen haben.")
  }

  return Number(normalized)
}
