"use client"

import { useMemo, useRef, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { PullUpEntryView } from "@/lib/pull-up-data"
import { incrementPullUpsAction } from "../actions"
import {
  ChartRangeToggle,
  chartRangeStart,
  dashboardChartClassName,
  type ChartRange,
} from "./chart-range-toggle"

type SaveState = "idle" | "queued" | "saving" | "saved" | "error"

const pullUpChartConfig = {
  count: {
    label: "Pullups",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const shortDateFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
})

const longDateFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export function PullUpsContent({
  entries,
  today,
}: {
  entries: PullUpEntryView[]
  today: string
}) {
  const initialTotal = entries.find((entry) => entry.date === today)?.count ?? 0
  const [todayTotal, setTodayTotal] = useState(initialTotal)
  const [range, setRange] = useState<ChartRange>("1m")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const pendingCount = useRef(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saving = useRef(false)

  const displayedEntries = useMemo(() => {
    const nextEntries = entries.map((entry) => (
      entry.date === today ? { ...entry, count: todayTotal } : entry
    ))

    if (!nextEntries.some((entry) => entry.date === today)) {
      nextEntries.push({ count: todayTotal, date: today })
    }

    return nextEntries
  }, [entries, today, todayTotal])

  const chartRows = useMemo(
    () => dailyChartRows(displayedEntries, today, range),
    [displayedEntries, range, today]
  )
  const week = useMemo(
    () => weeklyPullUps(displayedEntries, today),
    [displayedEntries, today]
  )

  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(savePendingPullUps, 1_000)
  }

  async function savePendingPullUps() {
    saveTimer.current = null
    if (saving.current) {
      scheduleSave()
      return
    }

    const amount = pendingCount.current
    if (amount === 0) return

    saving.current = true
    pendingCount.current -= amount
    setSaveState("saving")
    let failed = false

    try {
      const entry = await incrementPullUpsAction(amount)
      setTodayTotal(entry.count + pendingCount.current)
      setSaveState("saved")
    } catch {
      failed = true
      pendingCount.current += amount
      setSaveState("error")
    } finally {
      saving.current = false
      if (!failed && pendingCount.current > 0) scheduleSave()
    }
  }

  function addPullUp() {
    pendingCount.current += 1
    setTodayTotal((current) => current + 1)
    setSaveState("queued")
    scheduleSave()
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <section className="flex min-h-[calc(100svh-12rem)] flex-col items-center justify-center gap-6 px-4 pb-8 sm:min-h-[560px] sm:px-0 lg:min-h-[640px]">
        <Button
          aria-describedby="pull-up-count"
          aria-label="Einen Pullup hinzufügen"
          className="size-52 touch-manipulation rounded-full text-5xl font-bold tracking-[-0.04em] shadow-2xl active:scale-95 sm:size-64 sm:text-6xl"
          onClick={addPullUp}
          type="button"
        >
          +1
        </Button>
        <p className="text-xl font-normal text-white tabular-nums" id="pull-up-count">
          {todayTotal} Pullups
        </p>
        <p aria-live="polite" className="sr-only">
          {saveStatusMessage(saveState)}
        </p>
        {saveState === "error" ? (
          <p className="text-sm text-destructive">Speichern fehlgeschlagen. Beim nächsten Pullup wird es erneut versucht.</p>
        ) : null}
      </section>

      <section className="pb-6">
        <Card className="bg-white/[0.035] text-white">
          <CardHeader>
            <div>
              <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
                Pullups pro Tag
              </CardTitle>
              <CardDescription className="mt-1 text-white/50">
                Diese Woche · Änderung zur Vorwoche
              </CardDescription>
            </div>
            <CardAction className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-white tabular-nums">{week.current}</span>
              <Badge variant={week.change < 0 ? "destructive" : "default"}>
                {signedNumber(week.change)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ChartRangeToggle className="self-end" onRangeChange={setRange} range={range} />

            <ChartContainer config={pullUpChartConfig} className={dashboardChartClassName}>
              <AreaChart accessibilityLayer data={chartRows} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="pull-up-count-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  minTickGap={36}
                  tickFormatter={shortChartDate}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={40} />
                <ChartTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
                  content={(
                    <ChartTooltipContent
                      className="border-white/10 bg-background/95"
                      indicator="line"
                      labelFormatter={longChartDate}
                    />
                  )}
                />
                <Area
                  dataKey="count"
                  dot={false}
                  fill="url(#pull-up-count-fill)"
                  fillOpacity={1}
                  stroke="var(--color-count)"
                  strokeWidth={2.5}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function dailyChartRows(entries: PullUpEntryView[], today: string, range: ChartRange) {
  const counts = new Map(entries.map((entry) => [entry.date, entry.count]))
  const end = dateFromValue(today)
  const start = chartRangeStart(end, range)
  const cursor = start ?? dateFromValue(entries.at(0)?.date ?? today)
  const rows: PullUpEntryView[] = []

  while (cursor <= end) {
    const date = dateValue(cursor)
    rows.push({ count: counts.get(date) ?? 0, date })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return rows
}

function weeklyPullUps(entries: PullUpEntryView[], today: string) {
  const currentWeekStart = startOfWeek(dateFromValue(today))
  const nextWeekStart = new Date(currentWeekStart)
  nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7)
  const previousWeekStart = new Date(currentWeekStart)
  previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7)
  let current = 0
  let previous = 0

  for (const entry of entries) {
    const date = dateFromValue(entry.date)
    if (date >= currentWeekStart && date < nextWeekStart) current += entry.count
    if (date >= previousWeekStart && date < currentWeekStart) previous += entry.count
  }

  return { change: current - previous, current }
}

function startOfWeek(date: Date) {
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return date
}

function dateFromValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function shortChartDate(value: string) {
  return shortDateFormatter.format(dateFromValue(value))
}

function longChartDate(value: unknown) {
  return longDateFormatter.format(dateFromValue(String(value)))
}

function signedNumber(value: number) {
  return value >= 0 ? `+${value}` : String(value)
}

function saveStatusMessage(state: SaveState) {
  if (state === "queued" || state === "saving") return "Pullups werden gespeichert."
  if (state === "saved") return "Pullups gespeichert."
  if (state === "error") return "Pullups konnten nicht gespeichert werden."
  return ""
}
