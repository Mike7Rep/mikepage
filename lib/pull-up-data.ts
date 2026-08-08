import { cacheLife, cacheTag } from "next/cache"

import type { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"

export type PullUpEntryView = {
  date: string
  count: number
}

export type PullUpChallengeView = {
  id: number
  name: string
  targetCount: number
  startDate: string
  targetDate: string
  startDayCount: number
  endDate: string | null
  endDayCount: number | null
  finalCount: number | null
}

export type PullUpChallengeDashboard = {
  activeChallenge: PullUpChallengeView | null
  completedChallenges: PullUpChallengeView[]
  entries: PullUpEntryView[]
}

export type PullUpChallengeInput = {
  name: string
  targetCount: number
  targetDate: string
}

const zurichDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Zurich",
  year: "numeric",
})

export async function getPullUpEntries(): Promise<PullUpEntryView[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("dashboard:pull-ups")

  const entries = await prisma.pullUpEntry.findMany({
    orderBy: { date: "asc" },
    select: { count: true, date: true },
  })

  return entries.map((entry) => ({
    count: entry.count,
    date: entry.date.toISOString().slice(0, 10),
  }))
}

export async function incrementPullUps(amount: number) {
  const date = new Date(`${todayInZurich()}T00:00:00.000Z`)

  return prisma.pullUpEntry.upsert({
    where: { date },
    create: { count: amount, date },
    update: { count: { increment: amount } },
    select: { count: true },
  })
}

export async function getPullUpChallengeDashboard(): Promise<PullUpChallengeDashboard> {
  const today = todayInZurich()
  await closeExpiredChallenge(today)

  const [entries, activeChallenge, completedChallenges] = await Promise.all([
    getPullUpEntries(),
    prisma.pullUpChallenge.findFirst({
      where: { closedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pullUpChallenge.findMany({
      where: { closedAt: { not: null } },
      orderBy: { closedAt: "desc" },
    }),
  ])

  return {
    activeChallenge: activeChallenge ? challengeView(activeChallenge) : null,
    completedChallenges: completedChallenges.map(challengeView),
    entries,
  }
}

export async function createPullUpChallenge(input: PullUpChallengeInput) {
  const today = todayInZurich()
  const startDate = dateFromValue(today)
  const targetDate = dateFromValue(input.targetDate)

  return prisma.$transaction(async (tx) => {
    const todayEntry = await tx.pullUpEntry.findUnique({ where: { date: startDate } })
    const todayCount = todayEntry?.count ?? 0
    const activeChallenge = await tx.pullUpChallenge.findFirst({
      where: { closedAt: null },
      orderBy: { createdAt: "desc" },
    })

    if (activeChallenge) {
      await closeChallenge(tx, activeChallenge, startDate, todayCount)
    }

    return tx.pullUpChallenge.create({
      data: {
        name: input.name,
        startDate,
        startDayCount: todayCount,
        targetCount: input.targetCount,
        targetDate,
      },
    })
  })
}

export function parsePullUpChallengeForm(formData: FormData): PullUpChallengeInput {
  const name = String(formData.get("name") ?? "").trim()
  const targetCount = Number(String(formData.get("targetCount") ?? "").trim())
  const targetDate = String(formData.get("targetDate") ?? "").trim()

  if (!name || name.length > 80) {
    throw new Error("Die Challenge braucht einen Namen mit maximal 80 Zeichen.")
  }
  if (!Number.isInteger(targetCount) || targetCount <= 0 || targetCount > 1_000_000) {
    throw new Error("Das Ziel muss eine positive ganze Zahl sein.")
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || Number.isNaN(dateFromValue(targetDate).getTime())) {
    throw new Error("Das Zieldatum ist ungültig.")
  }
  if (targetDate < todayInZurich()) {
    throw new Error("Das Zieldatum darf nicht in der Vergangenheit liegen.")
  }

  return { name, targetCount, targetDate }
}

export function todayInZurich() {
  const parts = Object.fromEntries(
    zurichDateFormatter
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

async function closeExpiredChallenge(today: string) {
  const activeChallenge = await prisma.pullUpChallenge.findFirst({
    where: { closedAt: null },
    orderBy: { createdAt: "desc" },
  })
  if (!activeChallenge || dateValue(activeChallenge.targetDate) >= today) return

  await prisma.$transaction(async (tx) => {
    const challenge = await tx.pullUpChallenge.findUnique({ where: { id: activeChallenge.id } })
    if (!challenge || challenge.closedAt) return

    const targetDayEntry = await tx.pullUpEntry.findUnique({ where: { date: challenge.targetDate } })
    await closeChallenge(tx, challenge, challenge.targetDate, targetDayEntry?.count ?? 0)
  })
}

async function closeChallenge(
  tx: Prisma.TransactionClient,
  challenge: {
    id: number
    startDate: Date
    startDayCount: number
  },
  endDate: Date,
  endDayCount: number
) {
  const entries = await tx.pullUpEntry.findMany({
    where: { date: { gte: challenge.startDate, lte: endDate } },
    orderBy: { date: "asc" },
    select: { count: true, date: true },
  })
  const startDate = dateValue(challenge.startDate)
  const endDateValue = dateValue(endDate)
  let finalCount = 0

  for (const entry of entries) {
    const entryDate = dateValue(entry.date)
    let count = entryDate === endDateValue ? Math.min(entry.count, endDayCount) : entry.count
    if (entryDate === startDate) count -= challenge.startDayCount
    finalCount += Math.max(0, count)
  }

  return tx.pullUpChallenge.update({
    where: { id: challenge.id },
    data: {
      closedAt: new Date(),
      endDate,
      endDayCount,
      finalCount,
    },
  })
}

function challengeView(challenge: {
  id: number
  name: string
  targetCount: number
  startDate: Date
  targetDate: Date
  startDayCount: number
  endDate: Date | null
  endDayCount: number | null
  finalCount: number | null
}): PullUpChallengeView {
  return {
    id: challenge.id,
    name: challenge.name,
    targetCount: challenge.targetCount,
    startDate: dateValue(challenge.startDate),
    targetDate: dateValue(challenge.targetDate),
    startDayCount: challenge.startDayCount,
    endDate: challenge.endDate ? dateValue(challenge.endDate) : null,
    endDayCount: challenge.endDayCount,
    finalCount: challenge.finalCount,
  }
}

function dateFromValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10)
}
