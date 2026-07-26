import assert from "node:assert/strict"
import test from "node:test"

import {
  calculateHealthStrainScore,
  personalMaximumHeartRate,
} from "./health-strain"

test("uses 220 minus age for the personal maximum heart rate", () => {
  assert.equal(personalMaximumHeartRate(new Date("2026-07-06T12:00:00Z")), 180)
  assert.equal(personalMaximumHeartRate(new Date("2026-07-07T12:00:00Z")), 179)
})

test("integrates every heart-rate value by its measured duration", () => {
  const heartRateSamples = samplesForHour(140, 10)

  assert.deepEqual(
    calculateHealthStrainScore({ heartRateSamples, maximumHeartRate: 200 }),
    { score: 1 }
  )
})

test("uses the requested hourly score for every heart-rate zone", () => {
  const maximumHeartRate = 200
  const hours = [
    ...samplesForHour(150, 10, 0),
    ...samplesForHour(100, 10, 3_600),
    ...samplesForHour(120, 10, 7_200),
    ...samplesForHour(140, 10, 10_800),
    ...samplesForHour(160, 10, 14_400),
    ...samplesForHour(170, 10, 18_000),
    ...samplesForHour(70, 10, 21_600),
  ]

  assert.deepEqual(
    calculateHealthStrainScore({ heartRateSamples: hours, maximumHeartRate }),
    { score: 7.8 }
  )
})

function samplesForHour(beatsPerMinute: number, intervalSeconds: number, startSeconds = 0) {
  return Array.from({ length: 3_600 / intervalSeconds }, (_, index) => ({
    beatsPerMinute,
    measuredAt: new Date((startSeconds + index * intervalSeconds) * 1_000),
  }))
}
