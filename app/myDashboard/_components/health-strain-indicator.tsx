"use client"

import type { CSSProperties } from "react"

import { Progress } from "@/components/ui/progress"

const levels = [
  { color: "var(--strain-green)", limit: 2, status: "Erholt" },
  { color: "var(--strain-light-green)", limit: 4, status: "Gut" },
  { color: "var(--strain-yellow)", limit: 6, status: "Belastet" },
  { color: "var(--strain-orange)", limit: 8, status: "Stark belastet" },
  { color: "var(--strain-red)", limit: 10.1, status: "Erholung empfohlen" },
] as const

export function HealthStrainIndicator({ score }: { score: number | null }) {
  const value = typeof score === "number" && Number.isFinite(score)
    ? Math.max(0, Math.min(10, score))
    : null
  const level = value === null
    ? { color: "var(--strain-unavailable)", status: "Noch nicht genügend Daten" }
    : levels.find(({ limit }) => value < limit) ?? levels.at(-1)!
  const label = value === null
    ? "Belastungsscore: noch nicht genügend Schlaf- und Herzfrequenzdaten"
    : `Belastungsscore ${value.toFixed(1)} von 10: ${level.status}`
  const style = { "--strain-color": level.color } as CSSProperties

  return (
    <div className="relative h-[50px] w-[300px] max-w-full overflow-hidden rounded-xl border border-white/10">
      <Progress
        aria-label={label}
        aria-valuetext={label}
        className="h-full rounded-xl bg-white/[0.07] [&>[data-slot=progress-indicator]]:bg-[var(--strain-color)]"
        style={style}
        value={(value ?? 0) * 10}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.9)]">
        <span className="text-base leading-4 font-bold tabular-nums">
          {value === null ? "–" : value.toFixed(1)}
        </span>
        <span className="max-w-[280px] truncate text-[10px] leading-3 font-medium">
          {level.status}
        </span>
      </div>
    </div>
  )
}
