export type PlanningTask = { id: string; title: string; status: "open" | "done" | "missed" }
export const emptyPlanningTasks = (): PlanningTask[] => Array.from({ length: 11 }, (_, i) => ({ id: String(i), title: "", status: "open" }))

export function planningCalendar(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  const day = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00Z`)
  const sunday = day.getUTCDay() === 0
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7)
  return { week: day.toISOString().slice(0, 10), sunday }
}

export function nextPlanningWeek(week: string) {
  const date = new Date(`${week}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 7)
  return date.toISOString().slice(0, 10)
}

export function planningWeekLabel(week: string) {
  const date = new Date(`${week}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 3)
  const year = date.getUTCFullYear()
  const number = Math.ceil(((date.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)
  return `KW ${String(number).padStart(2, "0")} · ${year}`
}

export function planningScore(tasks: PlanningTask[], closed = true) {
  return tasks.reduce((sum, task, index) => sum + (!task.title ? 0 : task.status === "done" ? 12 - index : task.status === "open" && closed ? -1 : 0), 0)
}

export function carryPlanningTasks(tasks: PlanningTask[]): PlanningTask[] {
  return tasks.map((task) => ({ ...task, title: task.status === "done" ? "" : task.title, status: "open" }))
}

export function validatePlanningTasks(value: unknown, maxLength = 100): PlanningTask[] {
  if (!Array.isArray(value) || value.length !== 11) throw new Error("Es braucht genau elf Aufgabenplätze.")
  const tasks = value.map((task: PlanningTask) => {
    if (!task || typeof task.id !== "string" || !/^([0-9]|10)$/.test(task.id) || typeof task.title !== "string" || task.title.trim().length > maxLength || !["open", "done", "missed"].includes(task.status)) throw new Error("Ungültige Aufgabe.")
    const title = task.title.trim()
    return { id: task.id, title, status: title ? task.status : "open" as const }
  })
  if (new Set(tasks.map((task) => task.id)).size !== 11) throw new Error("Aufgabenplätze dürfen nicht doppelt vorkommen.")
  return tasks
}
