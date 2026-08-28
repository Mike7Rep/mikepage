"use client"

import { useMemo, useRef, useState } from "react"
import { Plus } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { PullUpChallengeView, PullUpEntryView } from "@/lib/pull-up-data"
import { createPullUpChallengeAction, incrementPullUpsAction } from "../actions"
import { dashboardChartClassName } from "./chart-range-toggle"
import { DashboardDatePicker } from "./dashboard-date-picker"

type SaveState = "idle" | "queued" | "saving" | "saved" | "error"

type ChallengeChartRow = {
  date: string
  actual: number | null
  projection?: number | null
}

const challengeChartConfig = {
  actual: {
    label: "Aktuell",
    color: "var(--chart-3)",
  },
  projection: {
    label: "Benötigter Verlauf",
    color: "var(--primary)",
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

const rarityTiers = [
  {
    max: 20,
    name: "Gewöhnlich",
    panel: "border-zinc-400 bg-zinc-400/20",
    marker: "border-zinc-200",
    text: "text-zinc-300",
  },
  {
    max: 40,
    name: "Ungewöhnlich",
    panel: "border-emerald-500 bg-emerald-500/20",
    marker: "border-emerald-300",
    text: "text-emerald-400",
  },
  {
    max: 60,
    name: "Selten",
    panel: "border-sky-500 bg-sky-500/20",
    marker: "border-sky-300",
    text: "text-sky-400",
  },
  {
    max: 80,
    name: "Legendär",
    panel: "border-orange-500 bg-orange-500/20",
    marker: "border-orange-300",
    text: "text-orange-400",
  },
  {
    max: Number.POSITIVE_INFINITY,
    name: "Mythisch",
    panel: "border-amber-400 bg-amber-400/20",
    marker: "border-amber-200",
    text: "text-amber-300",
  },
] as const

export function ChallengeContent({
  activeChallenge,
  completedChallenges,
  entries,
  today,
}: {
  activeChallenge: PullUpChallengeView | null
  completedChallenges: PullUpChallengeView[]
  entries: PullUpEntryView[]
  today: string
}) {
  const initialTodayTotal = entries.find((entry) => entry.date === today)?.count ?? 0
  const [persistedTodayTotal, setPersistedTodayTotal] = useState(initialTodayTotal)
  const [currentSetCount, setCurrentSetCount] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const pendingCount = useRef(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saving = useRef(false)
  const todayTotal = persistedTodayTotal + currentSetCount
  const rarityProgress = Math.min(100, Math.max(0, todayTotal))
  const rarityTier = rarityTiers.find((tier) => todayTotal <= tier.max) ?? rarityTiers.at(-1)!

  const displayedEntries = useMemo(() => {
    const nextEntries = entries.map((entry) => (
      entry.date === today ? { ...entry, count: todayTotal } : entry
    ))

    if (!nextEntries.some((entry) => entry.date === today)) {
      nextEntries.push({ count: todayTotal, date: today })
    }

    return nextEntries
  }, [entries, today, todayTotal])

  const activeTotal = activeChallenge
    ? challengeTotal(activeChallenge, displayedEntries, today)
    : 0
  const difference = activeChallenge ? activeChallenge.targetCount - activeTotal : 0
  const dailyTarget = activeChallenge
    ? Math.ceil(Math.max(0, difference) / remainingChallengeDays(today, activeChallenge.targetDate))
    : 0
  const activeChartRows = useMemo(
    () => activeChallenge
      ? activeChallengeRows(activeChallenge, displayedEntries, today, activeTotal)
      : [],
    [activeChallenge, activeTotal, displayedEntries, today]
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
      setPersistedTodayTotal(entry.count)
      setCurrentSetCount(pendingCount.current)
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
    setCurrentSetCount((current) => current + 1)
    setSaveState("queued")
    scheduleSave()
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <section className="flex min-h-[calc(100svh-12rem)] flex-col items-center justify-center px-4 pb-8 sm:min-h-[560px] sm:px-0 lg:min-h-[640px]">
        <div
          aria-label={`${todayTotal} Reps heute, Stufe ${rarityTier.name}`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={rarityProgress}
          className={`mb-12 w-full max-w-xl rounded-md border-4 p-5 transition-[border-color,background-color] duration-300 ${rarityTier.panel}`}
          role="progressbar"
        >
          <div className="relative pt-9">
            <span
              aria-hidden="true"
              className={`absolute top-0 min-w-10 -translate-x-1/2 rounded-sm border-2 bg-black px-2 py-1 text-center text-xs font-bold tabular-nums transition-[left,border-color,color] duration-300 ${rarityTier.marker} ${rarityTier.text}`}
              style={{ left: `clamp(24px, ${rarityProgress}%, calc(100% - 24px))` }}
            >
              {todayTotal}
            </span>
            <div aria-hidden="true" className="grid h-3 grid-cols-5 overflow-hidden rounded-full">
              <span className="bg-zinc-400" title="Gewöhnlich: 0 bis 20 Reps" />
              <span className="bg-emerald-500" title="Ungewöhnlich: 21 bis 40 Reps" />
              <span className="bg-sky-500" title="Selten: 41 bis 60 Reps" />
              <span className="bg-orange-500" title="Legendär: 61 bis 80 Reps" />
              <span className="bg-amber-400" title="Mythisch: mehr als 80 Reps" />
            </div>
            <span
              aria-hidden="true"
              className={`absolute bottom-1.5 size-5 -translate-x-1/2 translate-y-1/2 rounded-full border-[3px] bg-black shadow-[0_0_0_2px_rgba(0,0,0,0.8)] transition-[left,border-color] duration-300 ${rarityTier.marker}`}
              style={{ left: `clamp(10px, ${rarityProgress}%, calc(100% - 10px))` }}
            />
          </div>
          <p className={`mt-4 text-center text-sm font-bold uppercase tracking-[0] ${rarityTier.text}`}>
            {rarityTier.name}
          </p>
        </div>
        <Button
          aria-describedby="rep-count"
          aria-label="Eine Wiederholung hinzufügen"
          className="size-52 touch-manipulation rounded-full text-5xl font-bold tracking-[0] shadow-2xl active:scale-95 sm:size-64 sm:text-6xl"
          onClick={addPullUp}
          type="button"
        >
          +1
        </Button>
        <p className="mt-10 text-sm font-semibold leading-none text-white/70 tabular-nums" id="rep-count">
          {currentSetCount} x Reps
        </p>
        <p aria-live="polite" className="sr-only">
          {saveStatusMessage(saveState)}
        </p>
        {saveState === "error" ? (
          <p className="text-sm text-destructive">Speichern fehlgeschlagen. Beim nächsten Rep wird es erneut versucht.</p>
        ) : null}
      </section>

      <section>
        <Card className="bg-white/[0.035] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
              {activeChallenge?.name ?? "Keine aktive Challenge"}
            </CardTitle>
            {activeChallenge ? (
              <CardAction className="flex items-center gap-3 text-lg font-semibold text-white tabular-nums sm:text-2xl">
                <span>{activeTotal}</span>
                <span className="text-white/25">|</span>
                <span>{signedNumber(difference)}</span>
                <span className="text-white/25">|</span>
                <span>{dailyTarget}/d</span>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            {activeChallenge ? (
              <ChallengeChart
                rows={activeChartRows}
                target={activeChallenge.targetCount}
              />
            ) : (
              <div className={`flex items-center justify-center text-sm text-white/45 ${dashboardChartClassName}`}>
                Starte eine neue Challenge.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="pb-6">
        <Card className="bg-white/[0.035] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
              Abgeschlossene Challenges
            </CardTitle>
            <CardAction>
              <NewChallengeDialog today={today} />
            </CardAction>
          </CardHeader>
          <CardContent className="px-0 pb-3">
            <ChallengeHistory challenges={completedChallenges} entries={displayedEntries} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function NewChallengeDialog({ today }: { today: string }) {
  const [open, setOpen] = useState(false)
  const [targetDate, setTargetDate] = useState(() => addDays(today, 30))

  async function submitChallenge(formData: FormData) {
    await createPullUpChallengeAction(formData)
    setOpen(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setTargetDate(addDays(today, 30))
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Neue Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle>Neue Challenge</DialogTitle>
          <DialogDescription>
            Eine aktive Challenge wird mit dem aktuellen Stand abgeschlossen.
          </DialogDescription>
        </DialogHeader>
        <form action={submitChallenge} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="challenge-name">Name</FieldLabel>
              <Input id="challenge-name" maxLength={80} name="name" placeholder="Pullup Challenge" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="challenge-target">Ziel</FieldLabel>
              <Input
                id="challenge-target"
                inputMode="numeric"
                min={1}
                name="targetCount"
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "")
                }}
                pattern="[0-9]*"
                required
                type="text"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="challenge-target-date">Zieldatum</FieldLabel>
              <DashboardDatePicker
                id="challenge-target-date"
                name="targetDate"
                onChange={setTargetDate}
                value={targetDate}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button type="submit">Starten</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ChallengeHistory({
  challenges,
  entries,
}: {
  challenges: PullUpChallengeView[]
  entries: PullUpEntryView[]
}) {
  const [selectedChallenge, setSelectedChallenge] = useState<PullUpChallengeView | null>(null)

  return (
    <>
      {challenges.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challenge Name</TableHead>
              <TableHead className="text-right">Tage</TableHead>
              <TableHead className="text-right">Ziel</TableHead>
              <TableHead className="text-right">% erreicht</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {challenges.map((challenge) => (
              <TableRow
                aria-label={`${challenge.name} öffnen`}
                className="cursor-pointer text-white hover:bg-white/[0.055] focus-visible:bg-white/[0.055] focus-visible:outline-none"
                key={challenge.id}
                onClick={() => setSelectedChallenge(challenge)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedChallenge(challenge)
                }}
                role="button"
                tabIndex={0}
              >
                <TableCell className="font-medium">{challenge.name}</TableCell>
                <TableCell className="text-right tabular-nums">{challengeDays(challenge)}</TableCell>
                <TableCell className="text-right tabular-nums">{challenge.targetCount}</TableCell>
                <TableCell className="text-right tabular-nums">{challengePercent(challenge)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="px-6 py-10 text-sm text-white/45">Noch keine abgeschlossenen Challenges.</p>
      )}

      <ChallengeDetailDialog
        challenge={selectedChallenge}
        entries={entries}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedChallenge(null)
        }}
      />
    </>
  )
}

function ChallengeDetailDialog({
  challenge,
  entries,
  onOpenChange,
}: {
  challenge: PullUpChallengeView | null
  entries: PullUpEntryView[]
  onOpenChange: (open: boolean) => void
}) {
  const rows = challenge ? completedChallengeRows(challenge, entries) : []

  return (
    <Dialog open={Boolean(challenge)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle>{challenge?.name ?? "Challenge"}</DialogTitle>
          <DialogDescription>
            {challenge ? `${challenge.finalCount ?? 0} von ${challenge.targetCount} · ${challengePercent(challenge)}%` : null}
          </DialogDescription>
        </DialogHeader>
        {challenge ? <ChallengeChart rows={rows} target={challenge.targetCount} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function ChallengeChart({ rows, target }: { rows: ChallengeChartRow[]; target: number }) {
  return (
    <ChartContainer config={challengeChartConfig} className={dashboardChartClassName}>
      <AreaChart accessibilityLayer data={rows} margin={{ top: 16, right: 12, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="challenge-actual-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="var(--color-actual)" stopOpacity={0.45} />
            <stop offset="95%" stopColor="var(--color-actual)" stopOpacity={0.06} />
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
        <YAxis allowDecimals={false} axisLine={false} domain={[0, (max: number) => Math.max(max, target)]} tickLine={false} width={48} />
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
        <ReferenceLine
          ifOverflow="extendDomain"
          label={{ fill: "rgba(255,255,255,0.55)", position: "insideTopRight", value: target }}
          stroke="var(--destructive)"
          strokeDasharray="5 5"
          strokeWidth={2}
          y={target}
        />
        <Area
          connectNulls={false}
          dataKey="actual"
          dot={false}
          fill="url(#challenge-actual-fill)"
          fillOpacity={1}
          stroke="var(--color-actual)"
          strokeWidth={2.5}
          type="monotone"
        />
        <Line
          connectNulls={false}
          dataKey="projection"
          dot={false}
          stroke="var(--color-projection)"
          strokeDasharray="8 7"
          strokeWidth={2}
          type="linear"
        />
      </AreaChart>
    </ChartContainer>
  )
}

function activeChallengeRows(
  challenge: PullUpChallengeView,
  entries: PullUpEntryView[],
  today: string,
  currentTotal: number
) {
  const rows = challengeRows(challenge, entries, challenge.targetDate)
  const todayIndex = rows.findIndex((row) => row.date === today)
  const lastActualIndex = todayIndex >= 0 ? todayIndex : rows.length - 1
  const projectionDays = Math.max(1, rows.length - 1 - lastActualIndex)

  return rows.map((row, index) => {
    if (index <= lastActualIndex) return row

    const progress = (index - lastActualIndex) / projectionDays
    return {
      ...row,
      actual: null,
      projection: currentTotal + (challenge.targetCount - currentTotal) * progress,
    }
  }).map((row, index) => (
    index === lastActualIndex ? { ...row, projection: currentTotal } : row
  ))
}

function completedChallengeRows(challenge: PullUpChallengeView, entries: PullUpEntryView[]) {
  return challengeRows(challenge, entries, challenge.endDate ?? challenge.targetDate)
}

function challengeRows(
  challenge: PullUpChallengeView,
  entries: PullUpEntryView[],
  endDate: string
): ChallengeChartRow[] {
  const counts = new Map(entries.map((entry) => [entry.date, entry.count]))
  const cursor = dateFromValue(challenge.startDate)
  const end = dateFromValue(endDate)
  let cumulative = 0
  const rows: ChallengeChartRow[] = []

  while (cursor <= end) {
    const date = dateValue(cursor)
    let count = counts.get(date) ?? 0
    if (date === challenge.endDate && challenge.endDayCount !== null) {
      count = Math.min(count, challenge.endDayCount)
    }
    if (date === challenge.startDate) count -= challenge.startDayCount
    cumulative += Math.max(0, count)
    rows.push({ actual: cumulative, date })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return rows
}

function challengeTotal(challenge: PullUpChallengeView, entries: PullUpEntryView[], today: string) {
  return challengeRows(challenge, entries, today).at(-1)?.actual ?? 0
}

function challengeDays(challenge: PullUpChallengeView) {
  return daysBetween(challenge.startDate, challenge.endDate ?? challenge.targetDate) + 1
}

function remainingChallengeDays(today: string, targetDate: string) {
  return Math.max(1, daysBetween(today, targetDate) + 1)
}

function challengePercent(challenge: PullUpChallengeView) {
  return Math.round(((challenge.finalCount ?? 0) / challenge.targetCount) * 100)
}

function daysBetween(start: string, end: string) {
  return Math.round((dateFromValue(end).getTime() - dateFromValue(start).getTime()) / 86_400_000)
}

function addDays(value: string, amount: number) {
  const date = dateFromValue(value)
  date.setUTCDate(date.getUTCDate() + amount)
  return dateValue(date)
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
  return value > 0 ? `+${value}` : String(value)
}

function saveStatusMessage(state: SaveState) {
  if (state === "queued" || state === "saving") return "Reps werden gespeichert."
  if (state === "saved") return "Reps gespeichert."
  if (state === "error") return "Reps konnten nicht gespeichert werden."
  return ""
}
