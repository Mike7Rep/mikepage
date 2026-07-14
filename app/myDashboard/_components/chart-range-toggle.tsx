"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

export type ChartRange = "1m" | "3m" | "6m" | "1y" | "max"

export const dashboardChartClassName = "aspect-[16/5] min-h-[220px] w-full"

const chartRanges = [
  { label: "1 Monat", shortLabel: "1M", value: "1m" },
  { label: "3 Monate", shortLabel: "3M", value: "3m" },
  { label: "6 Monate", shortLabel: "6M", value: "6m" },
  { label: "1 Jahr", shortLabel: "1J", value: "1y" },
  { label: "Max", shortLabel: "Max", value: "max" },
] satisfies Array<{ label: string; shortLabel: string; value: ChartRange }>

export function ChartRangeToggle({
  className,
  onRangeChange,
  range,
}: {
  className?: string
  onRangeChange: (range: ChartRange) => void
  range: ChartRange
}) {
  return (
    <ToggleGroup
      aria-label="Diagrammzeitraum"
      className={cn("max-w-full", className)}
      onValueChange={(value) => {
        if (value) onRangeChange(value as ChartRange)
      }}
      size="lg"
      spacing={0}
      type="single"
      value={range}
      variant="outline"
    >
      {chartRanges.map((option) => (
        <ToggleGroupItem aria-label={option.label} key={option.value} value={option.value}>
          <span className="sm:hidden">{option.shortLabel}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export function filterChartRange<T>(
  items: T[],
  range: ChartRange,
  dateValue: (item: T) => string
) {
  if (range === "max" || items.length === 0) return items

  const end = new Date(`${dateValue(items.at(-1)!)}T00:00:00.000Z`)
  const start = chartRangeStart(end, range)!
  return items.filter((item) => new Date(`${dateValue(item)}T00:00:00.000Z`) >= start)
}

export function chartRangeStart(end: Date, range: ChartRange) {
  const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12, max: null }[range]
  if (months === null) return null

  const result = new Date(end)
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() - months)
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result
}
