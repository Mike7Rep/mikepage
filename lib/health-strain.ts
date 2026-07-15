const DAY_MS = 24 * 60 * 60 * 1_000
const LOOKBACK_MS = 7 * DAY_MS
const RECENT_WINDOW_MS = DAY_MS
const DECAY_HALF_LIFE_MS = 2 * DAY_MS
const MINIMUM_SLEEP_SAMPLES = 12
const LOWEST_SLEEP_FRACTION = 0.1
const NORMALIZATION_LOAD = 50

export type HealthStrainScore = {
  restingHeartRate: number | null
  score: number | null
}

type HeartRateSample = {
  beatsPerMinute: number
  measuredAt: Date
}

type SleepInterval = {
  endedAt: Date
  startedAt: Date
}

export function calculateHealthStrainScore({
  heartRateSamples,
  maximumHeartRate,
  now = new Date(),
  sleepIntervals,
}: {
  heartRateSamples: HeartRateSample[]
  maximumHeartRate: number
  now?: Date
  sleepIntervals: SleepInterval[]
}): HealthStrainScore {
  const nowTime = now.getTime()
  const lookbackStart = nowTime - LOOKBACK_MS
  const intervals = sleepIntervals
    .map(({ endedAt, startedAt }) => ({ end: endedAt.getTime(), start: startedAt.getTime() }))
    .filter(({ end, start }) => Number.isFinite(start) && Number.isFinite(end) && end > start)
  const sleepHeartRates = heartRateSamples
    .filter(({ beatsPerMinute, measuredAt }) => {
      const measuredTime = measuredAt.getTime()
      return Number.isFinite(beatsPerMinute)
        && beatsPerMinute > 0
        && measuredTime >= lookbackStart
        && measuredTime <= nowTime
        && intervals.some(({ end, start }) => measuredTime >= start && measuredTime < end)
    })
    .map(({ beatsPerMinute }) => beatsPerMinute)
    .sort((left, right) => left - right)

  if (sleepHeartRates.length < MINIMUM_SLEEP_SAMPLES) {
    return { restingHeartRate: null, score: null }
  }

  const lowestCount = Math.max(1, Math.ceil(sleepHeartRates.length * LOWEST_SLEEP_FRACTION))
  const restingHeartRate = sleepHeartRates
    .slice(0, lowestCount)
    .reduce((total, heartRate) => total + heartRate, 0) / lowestCount
  const heartRateReserve = maximumHeartRate - restingHeartRate

  if (!Number.isFinite(heartRateReserve) || heartRateReserve <= 0) {
    return { restingHeartRate: roundToOneDecimal(restingHeartRate), score: null }
  }

  const weightedLoad = heartRateSamples.reduce((total, { beatsPerMinute, measuredAt }) => {
    const age = nowTime - measuredAt.getTime()
    if (
      !Number.isFinite(beatsPerMinute)
      || beatsPerMinute <= restingHeartRate
      || !Number.isFinite(age)
      || age < 0
      || age > LOOKBACK_MS
    ) {
      return total
    }

    const intensity = Math.min(1.25, (beatsPerMinute - restingHeartRate) / heartRateReserve)
    const decay = age <= RECENT_WINDOW_MS
      ? 1
      : 0.5 ** ((age - RECENT_WINDOW_MS) / DECAY_HALF_LIFE_MS)

    return total + intensity ** 3 * decay
  }, 0)
  const score = Math.min(10, 10 * (1 - Math.exp(-weightedLoad / NORMALIZATION_LOAD)))

  return {
    restingHeartRate: roundToOneDecimal(restingHeartRate),
    score: roundToOneDecimal(score),
  }
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}
