import assert from "node:assert/strict"
import test from "node:test"
import { equitySeries, requiredNumber, sixMonthsAgo, tradingDate } from "./depot-calculations"

test("six-month retention clamps month ends and excludes an extra day", () => {
  assert.equal(sixMonthsAgo(new Date("2026-08-31T23:50:00Z")).toISOString(), "2026-02-28T00:00:00.000Z")
  assert.equal(sixMonthsAgo(new Date("2026-09-09T10:00:00Z")).toISOString(), "2026-03-09T00:00:00.000Z")
})

test("execution dates follow New York across midnight and daylight saving", () => {
  assert.equal(tradingDate("2026-09-10T00:30:00Z"), "2026-09-09")
  assert.equal(tradingDate("2026-01-10T04:30:00Z"), "2026-01-09")
  assert.equal(tradingDate("2026-09-10T04:30:00Z"), "2026-09-10")
})

test("capital comparison treats deposits and withdrawals as capital, not earnings", () => {
  const timestamp = ["2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"].map((date) => Date.parse(`${date}T12:00:00Z`) / 1000)
  const series = equitySeries({ timestamp, equity: [1000, 2010, 1530, 1550] }, [
    { activity_type: "CSD", date: "2026-03-10", net_amount: "1000" },
    { activity_type: "CSD", date: "2026-03-11", net_amount: "1000" },
    { activity_type: "CSW", date: "2026-03-12", net_amount: "-500" },
    { activity_type: "DIV", date: "2026-03-12", net_amount: "20" },
  ], "2026-03-09", "2026-03-13")
  assert.deepEqual(series.map((point) => point.capital), [1000, 2000, 1500])
  assert.equal(series.at(-1)!.equity - series.at(-1)!.capital, 30)
})

test("missing financial values are rejected instead of silently becoming zero", () => {
  for (const value of [null, undefined, "", " ", true, [], {}, "invalid", NaN]) assert.throws(() => requiredNumber(value, "Test"))
  assert.equal(requiredNumber("0", "Test"), 0)
  assert.throws(() => equitySeries({ timestamp: [1, 2], equity: [10] }, [], "2026-01-01", "2026-03-01"))
})
