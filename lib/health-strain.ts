const DAY_MS = 24 * 60 * 60 * 1_000
const LOOKBACK_MS = 7 * DAY_MS
const MINUTE_DURATION = 1
const NEUTRAL_INTENSITY = 0.5
const MAX_RECOVERY_RATE = 0.3
const MAX_LOAD_RATE = 3

export type HealthStrainScore = {
  restingHeartRate: number | null
  score: number | null
}

type HeartRateSample = {
  beatsPerMinute: number
  measuredAt: Date
}

export function updateHealthStrainScore({
  currentScore,
  durationMinutes,
  heartRate,
  maxHeartRate,
  restingHeartRate,
}: {
  currentScore: number
  durationMinutes: number
  heartRate: number
  maxHeartRate: number
  restingHeartRate: number
}) {
  const boundedCurrentScore = Number.isFinite(currentScore)
    ? clamp(currentScore, 0, 10)
    : 0

  if (
    !Number.isFinite(heartRate)
    || heartRate <= 0
    || !Number.isFinite(restingHeartRate)
    || !Number.isFinite(maxHeartRate)
    || maxHeartRate <= restingHeartRate
    || !Number.isFinite(durationMinutes)
    || durationMinutes <= 0
  ) {
    return boundedCurrentScore
  }

  const intensity = clamp(
    (heartRate - restingHeartRate) / (maxHeartRate - restingHeartRate),
    0,
    1
  )
  const rate = intensity < NEUTRAL_INTENSITY
    ? -MAX_RECOVERY_RATE * (
        (NEUTRAL_INTENSITY - intensity) / NEUTRAL_INTENSITY
      )
    : MAX_LOAD_RATE * (
        (intensity - NEUTRAL_INTENSITY) / (1 - NEUTRAL_INTENSITY)
      ) ** 2
  const scoreChange = rate * (durationMinutes / 60)

  return clamp(boundedCurrentScore + scoreChange, 0, 10)
}

export function calculateHealthStrainScore({
  currentScore = 0,
  heartRateSamples,
  maximumHeartRate,
  now = new Date(),
}: {
  currentScore?: number
  heartRateSamples: HeartRateSample[]
  maximumHeartRate: number
  now?: Date
}): HealthStrainScore {
  if (!Number.isFinite(maximumHeartRate) || maximumHeartRate <= 0) {
    return { restingHeartRate: null, score: null }
  }

  const nowTime = now.getTime()
  const lookbackStart = nowTime - LOOKBACK_MS
  const restingHeartRate = maximumHeartRate * 0.5
  const minuteAverages = heartRateSamples
    .filter(({ beatsPerMinute, measuredAt }) => {
      const measuredTime = measuredAt.getTime()
      return Number.isFinite(beatsPerMinute)
        && beatsPerMinute > 0
        && Number.isFinite(measuredTime)
        && measuredTime >= lookbackStart
        && measuredTime <= nowTime
    })
    .sort((left, right) => left.measuredAt.getTime() - right.measuredAt.getTime())

  if (minuteAverages.length === 0) {
    return {
      restingHeartRate: roundToOneDecimal(restingHeartRate),
      score: null,
    }
  }

  const score = minuteAverages.reduce(
    (value, { beatsPerMinute }) => updateHealthStrainScore({
      currentScore: value,
      durationMinutes: MINUTE_DURATION,
      heartRate: beatsPerMinute,
      maxHeartRate: maximumHeartRate,
      restingHeartRate,
    }),
    currentScore
  )

  return {
    restingHeartRate: roundToOneDecimal(restingHeartRate),
    score: roundToOneDecimal(score),
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}
