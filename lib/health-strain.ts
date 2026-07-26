const SECONDS_PER_HOUR = 3_600
const MAX_SAMPLE_DURATION_MS = 60 * 1_000

export const HEART_RATE_SCORE_ZONES = [
  { from: 0, label: "Erholung", rate: -0.25, to: 0.35 },
  { from: 0.35, label: "Sehr leicht", rate: -0.5, to: 0.45 },
  { from: 0.45, label: "Leicht", rate: 1, to: 0.65 },
  { from: 0.65, label: "Mittel", rate: 2, to: 0.75 },
  { from: 0.75, label: "Stark", rate: 4, to: 0.85 },
  { from: 0.85, label: "Maximal", rate: 6, to: Number.POSITIVE_INFINITY },
] as const

export type HealthStrainScore = {
  score: number | null
}

type HeartRateSample = {
  beatsPerMinute: number
  measuredAt: Date
}

export function personalMaximumHeartRate(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Zurich",
    year: "numeric",
  })
    .formatToParts(now)
    .reduce<Record<string, number>>((parts, part) => {
      if (part.type !== "literal") parts[part.type] = Number(part.value)
      return parts
    }, {})
  const age = date.year - 1985 - (
    date.month < 7 || (date.month === 7 && date.day < 7) ? 1 : 0
  )

  return 220 - age
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

  const samples = heartRateSamples
    .filter(({ beatsPerMinute, measuredAt }) => (
      Number.isFinite(beatsPerMinute)
      && beatsPerMinute > 0
      && Number.isFinite(measuredAt.getTime())
    ))
    .sort((left, right) => left.measuredAt.getTime() - right.measuredAt.getTime())

  if (samples.length === 0) return { score: null }

  let score = 0
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]
    const adjacent = samples[index + 1] ?? samples[index - 1]
    const durationSeconds = (adjacent
      ? Math.min(Math.abs(adjacent.measuredAt.getTime() - sample.measuredAt.getTime()), MAX_SAMPLE_DURATION_MS)
      : MAX_SAMPLE_DURATION_MS) / 1_000
    const intensity = sample.beatsPerMinute / maximumHeartRate
    const zone = HEART_RATE_SCORE_ZONES.find(({ to }) => intensity < to)
    score += (zone?.rate ?? 6) * durationSeconds / SECONDS_PER_HOUR
  }

  return { score: roundToOneDecimal(clamp(score, 0, 10)) }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function roundToOneDecimal(value: number) {
  return Math.round((value + 1e-9) * 10) / 10
}
