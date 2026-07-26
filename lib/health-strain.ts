const MINUTE_DURATION = 1

export type HealthStrainScore = {
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
}: {
  currentScore: number
  durationMinutes: number
  heartRate: number
  maxHeartRate: number
}) {
  const boundedCurrentScore = Number.isFinite(currentScore)
    ? clamp(currentScore, 0, 10)
    : 0

  if (
    !Number.isFinite(heartRate)
    || heartRate <= 0
    || !Number.isFinite(maxHeartRate)
    || maxHeartRate <= 0
    || !Number.isFinite(durationMinutes)
    || durationMinutes <= 0
  ) {
    return boundedCurrentScore
  }

  const intensity = heartRate / maxHeartRate
  const rate = intensity < 0.4
    ? -2
    : intensity < 0.5
      ? -1
      : intensity < 0.6
        ? 0.25
        : intensity < 0.7
          ? 1
          : intensity < 0.8
            ? 2
            : 4
  const scoreChange = rate * (durationMinutes / 60)

  return clamp(boundedCurrentScore + scoreChange, 0, 10)
}

export function calculateHealthStrainScore({
  heartRateSamples,
  maximumHeartRate,
}: {
  heartRateSamples: HeartRateSample[]
  maximumHeartRate: number
}): HealthStrainScore {
  if (!Number.isFinite(maximumHeartRate) || maximumHeartRate <= 0) {
    return { score: null }
  }

  const minuteAverages = heartRateSamples
    .filter(({ beatsPerMinute, measuredAt }) => {
      const measuredTime = measuredAt.getTime()
      return Number.isFinite(beatsPerMinute)
        && beatsPerMinute > 0
        && Number.isFinite(measuredTime)
    })
    .sort((left, right) => left.measuredAt.getTime() - right.measuredAt.getTime())

  if (minuteAverages.length === 0) {
    return { score: null }
  }

  const score = minuteAverages.reduce(
    (value, { beatsPerMinute }) => updateHealthStrainScore({
      currentScore: value,
      durationMinutes: MINUTE_DURATION,
      heartRate: beatsPerMinute,
      maxHeartRate: maximumHeartRate,
    }),
    0
  )

  return { score: roundToOneDecimal(score) }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}
