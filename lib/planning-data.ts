import { prisma } from "@/lib/prisma"
import { carryPlanningTasks, emptyPlanningTasks, nextPlanningWeek, planningCalendar, planningScore, validatePlanningTasks, type PlanningTask } from "@/lib/planning"

export async function getPlanningDashboard(page = 1, update?: { week: string; version: number; tasks: unknown }) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw new Error("Ungültige Seite.")
  return prisma.$transaction(async (tx) => {
    // Serialize rollover and edits, including concurrent requests on different instances.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(770012)`
    const calendar = planningCalendar()
    let current = await tx.planningWeek.findFirst({ orderBy: { week: "desc" } })
    if (!current) current = await tx.planningWeek.create({ data: { week: calendar.week, tasks: emptyPlanningTasks() } })
    while (current.week < calendar.week) {
      const tasks = validatePlanningTasks(current.tasks)
      const score = planningScore(tasks)
      const previous = await tx.planningWeek.findFirst({ where: { week: { lt: current.week } }, orderBy: { week: "desc" }, select: { total: true } })
      await tx.planningWeek.update({ where: { week: current.week }, data: { score, total: (previous?.total ?? 0) + score } })
      current = await tx.planningWeek.create({ data: { week: nextPlanningWeek(current.week), tasks: carryPlanningTasks(tasks) } })
    }
    if (update) {
      if (update.week !== current.week || update.version !== current.version) throw new Error("Die Woche wurde inzwischen geändert. Bitte neu laden.")
      const tasks = validatePlanningTasks(update.tasks)
      const existing = validatePlanningTasks(current.tasks)
      if (!calendar.sunday && tasks.some((task) => task.status !== existing.find((old) => old.id === task.id)?.status)) throw new Error("Aufgaben können am Sonntag bewertet werden.")
      current = await tx.planningWeek.update({ where: { week: current.week }, data: { tasks, version: { increment: 1 } } })
    }
    const where = { score: { not: null } }
    const count = await tx.planningWeek.count({ where })
    const pageCount = Math.max(1, Math.ceil(count / 10))
    const actualPage = Math.min(page, pageCount)
    const select = { week: true, score: true, total: true } as const
    const history = await tx.planningWeek.findMany({ where, orderBy: { week: "desc" }, skip: (actualPage - 1) * 10, take: 10, select })
    const chart = await tx.planningWeek.findMany({ where, orderBy: { week: "desc" }, take: 26, select })
    return { week: current.week, version: current.version, tasks: current.tasks as PlanningTask[], sunday: calendar.sunday, history, chart: chart.reverse(), page: actualPage, pageCount }
  }, { timeout: 30000 })
}

export type PlanningDashboard = Awaited<ReturnType<typeof getPlanningDashboard>>
