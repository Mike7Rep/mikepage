const HOUR_MS = 60 * 60 * 1_000
const MAX_SAMPLE_DURATION_MS = 60 * 1_000

export const HEART_RATE_SCORE_ZONES = [
  { from: 0, label: "Erholung", rate: -1, to: 0.4 },
  { from: 0.4, label: "Sehr leicht", rate: -0.25, to: 0.5 },
  { from: 0.5, label: "Leicht", rate: 0, to: 0.6 },
  { from: 0.6, label: "Mittel", rate: 1, to: 0.7 },
  { from: 0.7, label: "Stark", rate: 2, to: 0.8 },
  { from: 0.8, label: "Maximal", rate: 4, to: Number.POSITIVE_INFINITY },
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
    const duration = adjacent
      ? Math.min(Math.abs(adjacent.measuredAt.getTime() - sample.measuredAt.getTime()), MAX_SAMPLE_DURATION_MS)
      : MAX_SAMPLE_DURATION_MS
    const intensity = sample.beatsPerMinute / maximumHeartRate
    const zone = HEART_RATE_SCORE_ZONES.find(({ to }) => intensity <= to)
    const change = (zone?.rate ?? 4) * duration / HOUR_MS
    score = clamp(score + change, 0, 10)
  }

  return { score: roundToOneDecimal(score) }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function roundToOneDecimal(value: number) {
  return Math.round((value + 1e-9) * 10) / 10
}
