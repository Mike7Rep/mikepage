import { cacheLife, cacheTag } from "next/cache"

import { prisma } from "@/lib/prisma"

export type PullUpEntryView = {
  date: string
  count: number
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

export function todayInZurich() {
  const parts = Object.fromEntries(
    zurichDateFormatter
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}
