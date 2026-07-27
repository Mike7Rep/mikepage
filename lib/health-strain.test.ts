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

test("adds every minute value divided by 60", () => {
  const heartRateSamples = samplesForHour(140)

  assert.deepEqual(
    calculateHealthStrainScore({ heartRateSamples, maximumHeartRate: 200 }),
    { score: 2 }
  )
})

test("does not weight minute values by the distance between timestamps", () => {
  const heartRateSamples = Array.from({ length: 3 }, (_, index) => ({
    beatsPerMinute: 170,
    measuredAt: new Date(index * 10 * 1_000),
  }))

  assert.deepEqual(
    calculateHealthStrainScore({ heartRateSamples, maximumHeartRate: 200 }),
    { score: 0.3 }
  )
})

test("uses the requested hourly score for every heart-rate zone", () => {
  const maximumHeartRate = 200
  const cases = [
    { beatsPerMinute: 69, score: 0.8 },
    { beatsPerMinute: 70, score: 0.5 },
    { beatsPerMinute: 89, score: 0.5 },
    { beatsPerMinute: 90, score: 2 },
    { beatsPerMinute: 129, score: 2 },
    { beatsPerMinute: 130, score: 3 },
    { beatsPerMinute: 149, score: 3 },
    { beatsPerMinute: 150, score: 5 },
    { beatsPerMinute: 169, score: 5 },
    { beatsPerMinute: 170, score: 7 },
    { beatsPerMinute: 220, score: 7 },
  ]

  for (const { beatsPerMinute, score } of cases) {
    const heartRateSamples = [
      ...samplesForHour(90),
      ...samplesForHour(beatsPerMinute, 3_600),
    ]

    assert.deepEqual(
      calculateHealthStrainScore({ heartRateSamples, maximumHeartRate }),
      { score },
      `${beatsPerMinute} BPM`
    )
  }
})

test("clamps the completed sum instead of every intermediate value", () => {
  const maximumHeartRate = 200
  const recoveryThenLoad = [
    ...samplesForHour(70),
    ...samplesForHour(90, 3_600),
  ]
  const loadThenRecovery = [
    ...samplesForHour(90),
    ...samplesForHour(70, 3_600),
  ]

  assert.deepEqual(
    calculateHealthStrainScore({ heartRateSamples: recoveryThenLoad, maximumHeartRate }),
    { score: 0.5 }
  )
  assert.deepEqual(
    calculateHealthStrainScore({ heartRateSamples: loadThenRecovery, maximumHeartRate }),
    { score: 0.5 }
  )
  assert.deepEqual(
    calculateHealthStrainScore({
      heartRateSamples: [
        ...samplesForHour(170),
        ...samplesForHour(170, 3_600),
      ],
      maximumHeartRate,
    }),
    { score: 10 }
  )
  assert.deepEqual(
    calculateHealthStrainScore({
      heartRateSamples: samplesForHour(70),
      maximumHeartRate,
    }),
    { score: 0 }
  )
})

function samplesForHour(beatsPerMinute: number, startSeconds = 0) {
  return Array.from({ length: 60 }, (_, index) => ({
    beatsPerMinute,
    measuredAt: new Date((startSeconds + index * 60) * 1_000),
  }))
}
