import assert from "node:assert/strict"
import test from "node:test"
import { carryPlanningTasks, emptyPlanningTasks, nextPlanningWeek, planningCalendar, planningScore, planningWeekLabel, validatePlanningTasks } from "./planning"

test("eleven ranked tasks total 77 and blank slots have no penalty", () => {
  const tasks = emptyPlanningTasks()
  assert.equal(planningScore(tasks), 0)
  assert.equal(planningScore(tasks.map((task) => ({ ...task, title: "Task", status: "done" }))), 77)
})
test("done earns rank points, missed zero, unreviewed minus one only when closed", () => {
  const tasks = emptyPlanningTasks()
  tasks[0] = { ...tasks[0], title: "Done", status: "done" }
  tasks[1] = { ...tasks[1], title: "Missed", status: "missed" }
  tasks[2].title = "Forgotten"
  assert.equal(planningScore(tasks), 11)
  assert.equal(planningScore(tasks, false), 12)
  const next = carryPlanningTasks(tasks)
  assert.equal(next[0].title, "")
  assert.equal(next[1].title, "Missed")
  assert.equal(next[2].title, "Forgotten")
  assert.ok(next.every((task) => task.status === "open"))
  assert.equal(planningScore(carryPlanningTasks(next)), -2)
})
test("Zurich Sunday deadline across DST and ISO year boundary", () => {
  assert.deepEqual(planningCalendar(new Date("2026-10-25T22:59:59Z")), { week: "2026-10-19", sunday: true })
  assert.deepEqual(planningCalendar(new Date("2026-10-25T23:00:00Z")), { week: "2026-10-26", sunday: false })
  assert.deepEqual(planningCalendar(new Date("2026-03-29T22:00:00Z")), { week: "2026-03-30", sunday: false })
  assert.equal(nextPlanningWeek("2026-12-28"), "2027-01-04")
  assert.equal(planningWeekLabel("2026-12-28"), "KW 53 · 2026")
  assert.equal(planningWeekLabel("2027-01-04"), "KW 01 · 2027")
})
test("reject malformed slots and normalize cleared tasks", () => {
  assert.throws(() => validatePlanningTasks([]))
  const tasks = emptyPlanningTasks()
  tasks[1].id = tasks[0].id
  assert.throws(() => validatePlanningTasks(tasks))
  const clean = emptyPlanningTasks()
  clean[0].status = "done"
  assert.equal(validatePlanningTasks(clean)[0].status, "open")
  clean[0].title = "a".repeat(100)
  assert.equal(validatePlanningTasks(clean)[0].title.length, 100)
  clean[0].title += "a"
  assert.throws(() => validatePlanningTasks(clean))
  assert.equal(validatePlanningTasks(clean, 200)[0].title.length, 101)
})

test("persist, weekday review, concurrent edits, Sunday deadline and paginated history", { skip: !process.env.PLANNING_TEST_DATABASE_URL }, async (t) => {
  const url = new URL(process.env.PLANNING_TEST_DATABASE_URL!)
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname) && url.pathname === "/planning_test")
  process.env.DATABASE_URL = url.toString()
  const { prisma } = await import("./prisma")
  const { getPlanningDashboard } = await import("./planning-data")
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-19T12:00:00Z") })
  try {
    await prisma.planningWeek.deleteMany()
    let data = await getPlanningDashboard()
    const tasks = emptyPlanningTasks()
    tasks[0].title = "Finish"
    tasks[1].title = "Carry"
    tasks[2].title = "Forgot"
    data = await getPlanningDashboard(1, { week: data.week, version: data.version, tasks })
    const rated = tasks.map((task, i) => ({ ...task, status: i === 0 ? "done" : i === 1 ? "missed" : "open" }))
    const results = await Promise.allSettled([getPlanningDashboard(1, { week: data.week, version: data.version, tasks: rated }), getPlanningDashboard(1, { week: data.week, version: data.version, tasks: rated })])
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1)
    const beforeDeadline = await getPlanningDashboard()
    assert.equal(beforeDeadline.history.length, 0)
    assert.equal(beforeDeadline.tasks[0].status, "done")
    t.mock.timers.setTime(new Date("2026-10-25T22:59:59Z").getTime())
    assert.equal((await getPlanningDashboard()).history.length, 0)
    t.mock.timers.setTime(new Date("2026-10-25T23:00:00Z").getTime())
    const [first, second] = await Promise.all([getPlanningDashboard(), getPlanningDashboard()])
    assert.equal(first.history[0].score, 11)
    assert.equal(first.history[0].total, 11)
    assert.equal(second.history.length, 1)
    assert.equal(first.tasks[0].title, "")
    assert.equal(first.tasks[1].title, "Carry")
    assert.equal(first.tasks[2].title, "Forgot")
    t.mock.timers.setTime(new Date("2027-01-11T12:00:00Z").getTime())
    data = await getPlanningDashboard()
    assert.equal(data.history.length, 10)
    assert.equal(data.pageCount, 2)
    assert.equal(data.history[0].total, -11)
    const older = await getPlanningDashboard(2)
    assert.equal(older.history.length, 2)
    assert.equal(older.history.at(-1)?.score, 11)
    assert.equal((await getPlanningDashboard(99)).page, 2)
  } finally {
    await prisma.planningWeek.deleteMany()
    await prisma.$disconnect()
    t.mock.timers.reset()
  }
})
