"use client"

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { HeartPulse, Loader2, Plus, Target, Trash2 } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type {
  DailyStepsPoint,
  GoogleHealthStatus,
  HeartRateChartRange,
  HeartRateChartSeries,
} from "@/lib/google-health"
import type { HealthEntryView, HealthGoalMetric, HealthGoalsView } from "@/lib/health-data"
import type { HealthStrainScore } from "@/lib/health-strain"
import { cn } from "@/lib/utils"
import {
  createOrUpdateHealthEntryAction,
  deleteHealthEntryAction,
  syncGoogleHealthAction,
  updateHealthGoalsAction,
} from "../actions"
import {
  ChartRangeToggle,
  filterChartRange,
  type ChartRange,
} from "./chart-range-toggle"
import { DashboardDatePicker, formatDashboardDate, todayInputValue } from "./dashboard-date-picker"
import { HealthStrainIndicator } from "./health-strain-indicator"

const bloodPressureChartConfig = {
  bloodPressure1: { label: "Blutdruck 1", color: "#8bc7ff" },
  bloodPressure2: { label: "Blutdruck 2", color: "#45C456" },
} satisfies ChartConfig

const heartRateChartConfig = {
  bpm: { label: "Herzfrequenz", color: "#fb7185" },
} satisfies ChartConfig

const dailyStepsChartConfig = {
  steps: { label: "Schritte", color: "var(--chart-2)" },
} satisfies ChartConfig

const healthChartClassName = "aspect-[16/5] min-h-[440px] w-full sm:min-h-[220px]"

const heartRateRangeOptions = [
  { label: "1 Stunde", shortLabel: "1h", value: "1h" },
  { label: "1 Tag", shortLabel: "1T", value: "1d" },
  { label: "1 Woche", shortLabel: "1W", value: "1w" },
] satisfies Array<{ label: string; shortLabel: string; value: HeartRateChartRange }>

type StepsChartRange = "1w" | "1m" | "3m"

const stepsRangeOptions = [
  { label: "1 Woche", shortLabel: "1W", value: "1w" },
  { label: "1 Monat", shortLabel: "1M", value: "1m" },
  { label: "3 Monate", shortLabel: "3M", value: "3m" },
] satisfies Array<{ label: string; shortLabel: string; value: StepsChartRange }>

const currentDate = Object.fromEntries(
  new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Zurich",
    year: "numeric",
  })
    .formatToParts(new Date())
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, Number(part.value)])
) as Record<"day" | "month" | "year", number>
const age = currentDate.year - 1985 - (
  currentDate.month < 7 || (currentDate.month === 7 && currentDate.day < 7) ? 1 : 0
)
const heartRateMaximum = 208 - 0.7 * age
const heartRateZones = [
  { color: "var(--heart-zone-recovery)", from: 0, label: "Erholung", to: 0.5 },
  { color: "var(--heart-zone-very-light)", from: 0.5, label: "Sehr leicht", to: 0.6 },
  { color: "var(--heart-zone-light)", from: 0.6, label: "Leicht", to: 0.7 },
  { color: "var(--heart-zone-medium)", from: 0.7, label: "Mittel", to: 0.8 },
  { color: "var(--heart-zone-strong)", from: 0.8, label: "Stark", to: 0.9 },
  { color: "var(--heart-zone-maximum)", from: 0.9, label: "Maximal", to: 1 },
] as const

type SingleMetric = Exclude<HealthGoalMetric, "bloodPressure">
type SingleMetricDefinition = {
  key: SingleMetric
  title: string
  color: string
}

const singleMetrics: SingleMetricDefinition[] = [
  { key: "pulse", title: "Verlauf Puls", color: "#45C456" },
  { key: "waistCm", title: "Verlauf Bauchumfang", color: "#f5c778" },
  { key: "weightKg", title: "Verlauf Gewicht", color: "#8bc7ff" },
  { key: "bodyFatPercent", title: "Verlauf Fettgehalt", color: "#c4a7ff" },
]

const decimalFormatter = new Intl.NumberFormat("de-CH", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

const heartRateAxisFormatter = new Intl.DateTimeFormat("de-CH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Zurich",
})

const chartDateFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Zurich",
})

const heartRateTooltipFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Zurich",
})

const stepsTooltipFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "full",
  timeZone: "Europe/Zurich",
})

type GoogleHealthSyncState = "idle" | "syncing" | "synced" | "error"

export function HealthContent({
  entries,
  goals,
  googleHealthResult,
  googleHealthStatus: initialGoogleHealthStatus,
  initialDailySteps,
  initialHealthStrainScore,
  initialHeartRateSeries,
}: {
  entries: HealthEntryView[]
  goals: HealthGoalsView
  googleHealthResult?: string
  googleHealthStatus: GoogleHealthStatus
  initialDailySteps: DailyStepsPoint[]
  initialHealthStrainScore: HealthStrainScore
  initialHeartRateSeries: HeartRateChartSeries
}) {
  const newestFirst = useMemo(() => [...entries].reverse(), [entries])
  const [editingEntry, setEditingEntry] = useState<HealthEntryView | null>(null)
  const [chartRange, setChartRange] = useState<ChartRange>("max")
  const [heartRateRange, setHeartRateRange] = useState<HeartRateChartRange>("1d")
  const [stepsRange, setStepsRange] = useState<StepsChartRange>("1w")
  const [googleHealthStatus, setGoogleHealthStatus] = useState(initialGoogleHealthStatus)
  const [dailySteps, setDailySteps] = useState(initialDailySteps)
  const [healthStrainScore, setHealthStrainScore] = useState(initialHealthStrainScore)
  const [heartRateSeries, setHeartRateSeries] = useState(initialHeartRateSeries)
  const [googleHealthSyncState, setGoogleHealthSyncState] = useState<GoogleHealthSyncState>(
    initialGoogleHealthStatus.state === "connected" ? "syncing" : "idle"
  )
  const [googleHealthSyncMessage, setGoogleHealthSyncMessage] = useState<string | null>(
    initialGoogleHealthStatus.state === "connected"
      ? "Neue Gesundheitsdaten werden geladen …"
      : null
  )
  const syncStarted = useRef(false)
  const chartEntries = useMemo(
    () => filterChartRange(entries, chartRange, (entry) => entry.date),
    [chartRange, entries]
  )
  const bloodPressureScale = chartScale([
    ...chartEntries.flatMap((entry) => [entry.bloodPressure1, entry.bloodPressure2]),
    goals.bloodPressure1,
    goals.bloodPressure2,
  ], 10)

  useEffect(() => {
    if (googleHealthStatus.state !== "connected" || syncStarted.current) return
    syncStarted.current = true

    void syncGoogleHealthAction().then((result) => {
      if (!result.ok) {
        setGoogleHealthSyncState("error")
        setGoogleHealthSyncMessage(result.error)
        return
      }

      setDailySteps(result.steps)
      setHealthStrainScore(result.strainScore)
      setHeartRateSeries(result.series)
      setGoogleHealthStatus(result.status)
      setGoogleHealthSyncState("synced")
      setGoogleHealthSyncMessage(
        result.skipped
          ? "Gesundheitsdaten sind bereits aktuell."
          : result.insertedHeartRate > 0 || result.updatedStepDays > 0 || result.updatedSleepIntervals > 0
            ? `${result.insertedHeartRate} neue Herzfrequenz-Minutenwerte gespeichert, ${result.updatedStepDays} Schritttage und ${result.updatedSleepIntervals} Schlafintervalle abgeglichen.`
            : "Keine neuen Gesundheitsdaten gefunden."
      )
    })
  }, [googleHealthStatus.state])

  return (
    <div className="flex flex-col gap-5">
      <section className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-8 sm:gap-10">
          <HeartRateChartCard
            entries={heartRateSeries[heartRateRange]}
            googleHealthResult={googleHealthResult}
            healthStrainScore={healthStrainScore}
            onRangeChange={setHeartRateRange}
            range={heartRateRange}
            status={googleHealthStatus}
            syncMessage={googleHealthSyncMessage}
            syncState={googleHealthSyncState}
          />

          <DailyStepsChartCard
            entries={dailySteps}
            onRangeChange={setStepsRange}
            range={stepsRange}
          />

          <div className="flex justify-end px-4 sm:px-0">
            <ChartRangeToggle onRangeChange={setChartRange} range={chartRange} />
          </div>

          <HealthChartCard
            goalAction={
              <HealthGoalDialog
                goals={goals}
                metric="bloodPressure"
                title="Zielwert Blutdruck"
              />
            }
            title="Verlauf Blutdruck"
          >
            <ChartContainer config={bloodPressureChartConfig} className={healthChartClassName}>
              <LineChart accessibilityLayer data={chartEntries} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis axisLine={false} dataKey="date" minTickGap={32} tickFormatter={formatChartDate} tickLine={false} tickMargin={10} />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  domain={bloodPressureScale.domain}
                  ticks={bloodPressureScale.ticks}
                  tickLine={false}
                  width={40}
                />
                <ChartTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
                  content={<ChartTooltipContent className="border-white/10 bg-background/95" indicator="line" labelFormatter={formatChartDate} />}
                />
                {goals.bloodPressure1 !== null ? <GoalLine color="#ef4444" value={goals.bloodPressure1} /> : null}
                {goals.bloodPressure2 !== null ? <GoalLine color="#fb7185" value={goals.bloodPressure2} /> : null}
                <Line connectNulls dataKey="bloodPressure1" dot={false} stroke="var(--color-bloodPressure1)" strokeWidth={2.5} type="monotone" />
                <Line connectNulls dataKey="bloodPressure2" dot={false} stroke="var(--color-bloodPressure2)" strokeWidth={2.5} type="monotone" />
              </LineChart>
            </ChartContainer>
          </HealthChartCard>

          {singleMetrics.map((metric) => (
            <HealthChartCard
              goalAction={<HealthGoalDialog goals={goals} metric={metric.key} title={`Zielwert ${metric.title.replace("Verlauf ", "")}`} />}
              key={metric.key}
              title={metric.title}
            >
              <SingleMetricChart entries={chartEntries} goal={goals[metric.key]} metric={metric} />
            </HealthChartCard>
          ))}
        </div>
      </section>

      <Card className="bg-white/[0.035] text-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
            Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <Table className="block min-w-0 text-white md:table md:min-w-[1180px]">
            <TableHeader className="hidden md:table-header-group">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-white/45">Datum</TableHead>
                <TableHead className="text-right text-white/45">Blutdruck 1</TableHead>
                <TableHead className="text-right text-white/45">Blutdruck 2</TableHead>
                <TableHead className="text-right text-white/45">Puls</TableHead>
                <TableHead className="text-right text-white/45">Bauchumfang (cm)</TableHead>
                <TableHead className="text-right text-white/45">Gewicht (kg)</TableHead>
                <TableHead className="text-right text-white/45">Fettgehalt (%)</TableHead>
                <TableHead className="w-10 pr-4 text-right text-white/45" />
              </TableRow>
            </TableHeader>
            <TableBody className="flex flex-col gap-2 px-3 md:table-row-group md:px-0">
              {newestFirst.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="relative grid cursor-pointer grid-cols-2 gap-3 rounded-lg bg-white/[0.04] p-3 hover:bg-white/[0.055] focus-visible:bg-white/[0.06] focus-visible:outline-none md:table-row md:rounded-none md:bg-transparent md:p-0"
                  onClick={() => setEditingEntry(entry)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setEditingEntry(entry)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <TableCell className="col-span-2 p-0 pr-10 font-medium text-white md:table-cell md:px-4 md:py-2">{formatDate(entry.date)}</TableCell>
                  <MetricCell label="Blutdruck 1" unit="mmHg" value={entry.bloodPressure1} />
                  <MetricCell label="Blutdruck 2" unit="mmHg" value={entry.bloodPressure2} />
                  <MetricCell label="Puls" unit="bpm" value={entry.pulse} />
                  <MetricCell label="Bauchumfang" unit="cm" value={entry.waistCm} />
                  <MetricCell label="Gewicht" unit="kg" value={entry.weightKg} />
                  <MetricCell label="Fettgehalt" unit="%" value={entry.bodyFatPercent} />
                  <TableCell
                    className="absolute top-2 right-2 p-0 text-right md:static md:table-cell md:p-2 md:pr-4"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <DeleteHealthEntryDialog entry={entry} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <HealthEntryDialog
          entries={entries}
          entry={editingEntry}
          key={editingEntry?.id ?? "health-entry-editor"}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null)
          }}
          open={Boolean(editingEntry)}
        />
      </Card>
    </div>
  )
}

function SingleMetricChart({
  entries,
  goal,
  metric,
}: {
  entries: HealthEntryView[]
  goal: number | null
  metric: SingleMetricDefinition
}) {
  const config = {
    [metric.key]: { label: metric.title.replace("Verlauf ", ""), color: metric.color },
  } satisfies ChartConfig
  const gradientId = `${metric.key}-fill`
  const scale = chartScale([
    ...entries.map((entry) => entry[metric.key]),
    goal,
  ], 5)

  return (
    <ChartContainer config={config} className={healthChartClassName}>
      <AreaChart accessibilityLayer data={entries} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor={`var(--color-${metric.key})`} stopOpacity={0.42} />
            <stop offset="95%" stopColor={`var(--color-${metric.key})`} stopOpacity={0.06} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis axisLine={false} dataKey="date" minTickGap={32} tickFormatter={formatChartDate} tickLine={false} tickMargin={10} />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          domain={scale.domain}
          ticks={scale.ticks}
          tickLine={false}
          width={40}
        />
        <ChartTooltip
          cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
          content={<ChartTooltipContent className="border-white/10 bg-background/95" indicator="line" labelFormatter={formatChartDate} />}
        />
        {goal !== null ? <GoalLine color="#ef4444" value={goal} /> : null}
        <Area
          connectNulls
          dataKey={metric.key}
          dot={false}
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          stroke={`var(--color-${metric.key})`}
          strokeWidth={2.5}
          type="monotone"
        />
      </AreaChart>
    </ChartContainer>
  )
}

function HeartRateChartCard({
  entries,
  googleHealthResult,
  healthStrainScore,
  onRangeChange,
  range,
  status,
  syncMessage,
  syncState,
}: {
  entries: HeartRateChartSeries[HeartRateChartRange]
  googleHealthResult?: string
  healthStrainScore: HealthStrainScore
  onRangeChange: (range: HeartRateChartRange) => void
  range: HeartRateChartRange
  status: GoogleHealthStatus
  syncMessage: string | null
  syncState: GoogleHealthSyncState
}) {
  const chartMaximum = Math.ceil(
    Math.max(heartRateMaximum, ...entries.map((entry) => entry.bpm)) / 30
  ) * 30
  const ticks = Array.from({ length: chartMaximum / 30 + 1 }, (_, index) => index * 30)
  const resultMessage = googleHealthResultMessage(googleHealthResult)
  const statusMessage = syncMessage ?? resultMessage ?? googleHealthStatusMessage(status)
  const hasError = syncState === "error" || googleHealthResultIsError(googleHealthResult)

  return (
    <Card className="w-full bg-white/[0.035] text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
          Herzfrequenz
        </CardTitle>
        <CardDescription
          aria-live="polite"
          className={cn(hasError ? "text-destructive" : "text-white/50")}
        >
          {statusMessage}
        </CardDescription>
        <CardAction>
          <GoogleHealthAction status={status} syncState={syncState} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HealthStrainIndicator score={healthStrainScore.score} />
          <DataRangeToggle
            ariaLabel="Herzfrequenzzeitraum"
            onRangeChange={onRangeChange}
            options={heartRateRangeOptions}
            range={range}
          />
        </div>
        <ChartContainer config={heartRateChartConfig} className={healthChartClassName}>
          <AreaChart accessibilityLayer data={entries} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="heart-rate-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-bpm)" stopOpacity={0.14} />
                <stop offset="95%" stopColor="var(--color-bpm)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {heartRateZones.map((zone) => (
              <ReferenceArea
                fill={zone.color}
                fillOpacity={0.18}
                ifOverflow="hidden"
                key={zone.label}
                strokeOpacity={0}
                y1={heartRateMaximum * zone.from}
                y2={zone.to === 1 ? chartMaximum : heartRateMaximum * zone.to}
                zIndex={0}
              />
            ))}
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="measuredAt"
              minTickGap={42}
              tickFormatter={range === "1w" ? formatChartAxisDate : formatHeartRateAxis}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              domain={[0, chartMaximum]}
              ticks={ticks}
              tickLine={false}
              width={40}
            />
            <ChartTooltip
              cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
              content={(
                <ChartTooltipContent
                  className="border-white/10 bg-background/95"
                  indicator="line"
                  labelFormatter={formatHeartRateTooltip}
                />
              )}
            />
            <Area
              dataKey="bpm"
              dot={false}
              fill="url(#heart-rate-fill)"
              fillOpacity={1}
              stroke="var(--color-bpm)"
              strokeWidth={2.5}
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function DailyStepsChartCard({
  entries,
  onRangeChange,
  range,
}: {
  entries: DailyStepsPoint[]
  onRangeChange: (range: StepsChartRange) => void
  range: StepsChartRange
}) {
  const days = { "1w": 7, "1m": 30, "3m": 90 }[range]
  const chartEntries = entries.slice(-days)
  const hasData = chartEntries.some((entry) => entry.steps !== null)

  return (
    <Card className="w-full bg-white/[0.035] text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
          Tägliche Schritte
        </CardTitle>
        <CardAction>
          <DataRangeToggle
            ariaLabel="Schrittezeitraum"
            onRangeChange={onRangeChange}
            options={stepsRangeOptions}
            range={range}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={dailyStepsChartConfig} className={healthChartClassName}>
            <BarChart accessibilityLayer data={chartEntries} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                minTickGap={32}
                tickFormatter={formatChartAxisDate}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickFormatter={formatStepsAxis}
                tickLine={false}
                width={44}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                content={(
                  <ChartTooltipContent
                    className="border-white/10 bg-background/95"
                    labelFormatter={formatStepsTooltip}
                  />
                )}
              />
              <Bar dataKey="steps" fill="var(--color-steps)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className={`${healthChartClassName} grid place-items-center rounded-md border border-dashed border-white/10 text-center text-white/50`}>
            Noch keine Schrittdaten für diesen Zeitraum vorhanden.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DataRangeToggle<T extends string>({
  ariaLabel,
  onRangeChange,
  options,
  range,
}: {
  ariaLabel: string
  onRangeChange: (range: T) => void
  options: Array<{ label: string; shortLabel: string; value: T }>
  range: T
}) {
  return (
    <ToggleGroup
      aria-label={ariaLabel}
      onValueChange={(value) => {
        if (value) onRangeChange(value as T)
      }}
      size="sm"
      spacing={0}
      type="single"
      value={range}
      variant="outline"
    >
      {options.map((option) => (
        <ToggleGroupItem aria-label={option.label} key={option.value} value={option.value}>
          <span className="sm:hidden">{option.shortLabel}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function GoogleHealthAction({
  status,
  syncState,
}: {
  status: GoogleHealthStatus
  syncState: GoogleHealthSyncState
}) {
  if (status.state === "configuration_missing") {
    return <Badge variant="destructive">OAuth fehlt</Badge>
  }

  if (
    status.state === "not_connected" ||
    status.state === "expired" ||
    status.state === "scope_update_required" ||
    syncState === "error"
  ) {
    return (
      <Button asChild variant="outline">
        <a href="/myDashboard/google-health/connect">
          <HeartPulse data-icon="inline-start" />
          {status.state === "not_connected" ? "Verbinden" : "Neu verbinden"}
        </a>
      </Button>
    )
  }

  if (syncState === "syncing") {
    return (
      <Badge variant="secondary">
        <Loader2 className="animate-spin" data-icon="inline-start" />
        Synchronisiert
      </Badge>
    )
  }

  return <Badge>Google Health verbunden</Badge>
}

function GoalLine({ color, value }: { color: string; value: number }) {
  return (
    <ReferenceLine
      ifOverflow="extendDomain"
      stroke={color}
      strokeDasharray="7 6"
      strokeOpacity={0.9}
      strokeWidth={1.5}
      y={value}
    />
  )
}

function HealthChartCard({
  children,
  goalAction,
  title,
}: {
  children: ReactNode
  goalAction: ReactNode
  title: string
}) {
  return (
    <Card className="w-full bg-white/[0.035] text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
          {title}
        </CardTitle>
        <CardAction>{goalAction}</CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function HealthEntryDialog({
  entries,
  entry = null,
  onOpenChange,
  open: controlledOpen,
}: {
  entries: HealthEntryView[]
  entry?: HealthEntryView | null
  onOpenChange?: (open: boolean) => void
  open?: boolean
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [date, setDate] = useState(entry?.date ?? todayInputValue())
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const selectedEntry = entries.find((candidate) => candidate.date === date)

  useEffect(() => {
    const dialogContent = dialogContentRef.current
    const viewport = window.visualViewport

    if (!open || !dialogContent || !viewport) return
    const visibleDialog = dialogContent
    const visibleViewport = viewport

    function fitDialogToVisibleViewport() {
      visibleDialog.style.top = `${visibleViewport.offsetTop + visibleViewport.height / 2}px`
      visibleDialog.style.maxHeight = `${Math.max(visibleViewport.height - 16, 0)}px`
    }

    fitDialogToVisibleViewport()
    visibleViewport.addEventListener("resize", fitDialogToVisibleViewport)
    visibleViewport.addEventListener("scroll", fitDialogToVisibleViewport)

    return () => {
      visibleViewport.removeEventListener("resize", fitDialogToVisibleViewport)
      visibleViewport.removeEventListener("scroll", fitDialogToVisibleViewport)
    }
  }, [open])

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setDate(entry?.date ?? todayInputValue())
    setOpen(nextOpen)
  }

  async function submitEntry(formData: FormData) {
    await createOrUpdateHealthEntryAction(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined ? (
        <DialogTrigger asChild>
          <Button>
            <Plus data-icon="inline-start" />
            Eintrag hinzufügen
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent
        className="max-h-[calc(100dvh-1rem)] max-w-md overflow-y-auto overscroll-y-contain border-0 bg-black text-white"
        ref={dialogContentRef}
      >
        <DialogHeader>
          <DialogTitle>{selectedEntry ? "Eintrag bearbeiten" : "Eintrag hinzufügen"}</DialogTitle>
          <DialogDescription>
            {selectedEntry
              ? "Vorhandene Messwerte ergänzen oder ändern. Leere Felder bleiben erhalten."
              : "Nur vorhandene Messwerte eintragen."}
          </DialogDescription>
        </DialogHeader>
        <form action={submitEntry} className="flex flex-col gap-4" key={`${date}-${selectedEntry?.updatedAt ?? "new"}`}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="health-date">Datum</FieldLabel>
              <DashboardDatePicker id="health-date" name="date" value={date} onChange={setDate} />
            </Field>
            <HealthNumberField defaultValue={selectedEntry?.bloodPressure1} label="Blutdruck 1 (mmHg)" name="bloodPressure1" optional />
            <HealthNumberField defaultValue={selectedEntry?.bloodPressure2} label="Blutdruck 2 (mmHg)" name="bloodPressure2" optional />
            <HealthNumberField defaultValue={selectedEntry?.pulse} label="Puls (bpm)" name="pulse" optional />
            <HealthNumberField decimal defaultValue={selectedEntry?.waistCm} label="Bauchumfang (cm)" name="waistCm" optional />
            <HealthNumberField decimal defaultValue={selectedEntry?.weightKg} label="Gewicht (kg)" name="weightKg" optional />
            <HealthNumberField decimal defaultValue={selectedEntry?.bodyFatPercent} label="Fettgehalt (%)" name="bodyFatPercent" optional />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button type="submit">Speichern</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HealthGoalDialog({
  goals,
  metric,
  title,
}: {
  goals: HealthGoalsView
  metric: HealthGoalMetric
  title: string
}) {
  const [open, setOpen] = useState(false)
  const fields = goalFields(metric, goals)

  async function submitGoal(formData: FormData) {
    await updateHealthGoalsAction(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Target data-icon="inline-start" />
          {goalButtonLabel(metric, goals)}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Zielwert ohne Datum speichern.</DialogDescription>
        </DialogHeader>
        <form action={submitGoal} className="flex flex-col gap-4">
          <input name="metric" type="hidden" value={metric} />
          <FieldGroup>
            {fields.map((field) => (
              <HealthNumberField
                decimal={field.decimal}
                defaultValue={field.value}
                id={`goal-${metric}-${field.name}`}
                key={field.name}
                label={field.label}
                name={field.name}
              />
            ))}
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button type="submit">Speichern</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HealthNumberField({
  decimal = false,
  defaultValue,
  id,
  label,
  name,
  optional = false,
}: {
  decimal?: boolean
  defaultValue?: number | null
  id?: string
  label: string
  name: string
  optional?: boolean
}) {
  const inputId = id ?? name

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        className="h-auto min-h-10 px-4 py-2 text-base sm:min-h-9 sm:text-sm/5"
        defaultValue={defaultValue ?? undefined}
        id={inputId}
        inputMode={decimal ? "decimal" : "numeric"}
        min="0"
        name={name}
        pattern={decimal ? "\\d+([\\.,]\\d)?" : "\\d*"}
        required={!optional}
        step={decimal ? "0.1" : "1"}
        type="text"
      />
    </Field>
  )
}

function goalFields(metric: HealthGoalMetric, goals: HealthGoalsView) {
  if (metric === "bloodPressure") {
    return [
      { name: "bloodPressure1", label: "Blutdruck 1 (mmHg)", value: goals.bloodPressure1, decimal: false },
      { name: "bloodPressure2", label: "Blutdruck 2 (mmHg)", value: goals.bloodPressure2, decimal: false },
    ]
  }

  const fields = {
    waistCm: { label: "Bauchumfang (cm)", decimal: true },
    bodyFatPercent: { label: "Fettgehalt (%)", decimal: true },
    weightKg: { label: "Gewicht (kg)", decimal: true },
    pulse: { label: "Puls (bpm)", decimal: false },
  } as const

  return [{ name: metric, value: goals[metric], ...fields[metric] }]
}

function goalButtonLabel(metric: HealthGoalMetric, goals: HealthGoalsView) {
  if (metric === "bloodPressure") {
    return goals.bloodPressure1 !== null && goals.bloodPressure2 !== null
      ? `Ziel ${goals.bloodPressure1} / ${goals.bloodPressure2}`
      : "Zielwert"
  }

  const units = { waistCm: "cm", bodyFatPercent: "%", weightKg: "kg", pulse: "bpm" }
  const value = goals[metric]
  return value === null ? "Zielwert" : `Ziel ${decimalFormatter.format(value)} ${units[metric]}`
}

function MetricCell({
  label,
  unit,
  value,
}: {
  label: string
  unit: string
  value: number | null
}) {
  return (
    <TableCell
      className="grid gap-0.5 p-0 text-left text-white/70 tabular-nums before:text-[0.625rem] before:font-medium before:tracking-[0.08em] before:text-white/40 before:uppercase before:content-[attr(data-label)] md:table-cell md:p-2 md:text-right md:before:hidden"
      data-label={label}
    >
      <span>
        {value === null ? "–" : decimalFormatter.format(value)}
        {value === null ? null : <span className="text-white/40 md:hidden"> {unit}</span>}
      </span>
    </TableCell>
  )
}

function DeleteHealthEntryDialog({ entry }: { entry: HealthEntryView }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button aria-label={`Eintrag vom ${formatDate(entry.date)} löschen`} size="icon" type="button" variant="ghost">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-black text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
          <AlertDialogDescription>Der Eintrag vom {formatDate(entry.date)} wird dauerhaft entfernt.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Abbrechen</AlertDialogCancel>
          <form action={deleteHealthEntryAction}>
            <input name="id" type="hidden" value={entry.id} />
            <AlertDialogAction type="submit" variant="destructive">Löschen</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function formatDate(value: string) {
  return formatDashboardDate(value)
}

function formatChartDate(value: ReactNode) {
  return formatDate(String(value))
}

function formatHeartRateAxis(value: string) {
  return heartRateAxisFormatter.format(new Date(value))
}

function formatChartAxisDate(value: string) {
  return chartDateFormatter.format(new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`))
}

function formatHeartRateTooltip(value: ReactNode) {
  return heartRateTooltipFormatter.format(new Date(String(value)))
}

function formatStepsTooltip(value: ReactNode) {
  return stepsTooltipFormatter.format(new Date(`${String(value)}T00:00:00.000Z`))
}

function formatStepsAxis(value: number) {
  return Math.abs(value) >= 1_000
    ? `${decimalFormatter.format(value / 1_000)}k`
    : decimalFormatter.format(value)
}

function googleHealthStatusMessage(status: GoogleHealthStatus) {
  if (status.state === "configuration_missing") {
    return `OAuth-Konfiguration fehlt: ${status.missing.join(", ")}.`
  }
  if (status.state === "not_connected") {
    return "Verbinde einmal dein Google-Konto, danach werden neue Messwerte beim Öffnen der Seite geladen."
  }
  if (status.state === "expired") {
    return "Die Google-Health-Freigabe ist abgelaufen und muss erneuert werden."
  }
  if (status.state === "scope_update_required") {
    return "Für Schritte und Belastungsscore sind zusätzliche Google-Health-Freigaben nötig. Bitte einmal neu verbinden."
  }
  if (status.lastSyncedAt) {
    return `Zuletzt synchronisiert: ${heartRateTooltipFormatter.format(new Date(status.lastSyncedAt))}.`
  }
  return "Google Health ist verbunden. Die erste Synchronisierung startet automatisch."
}

function googleHealthResultMessage(result?: string) {
  if (result === "connected") return "Google Health wurde verbunden. Die erste Synchronisierung startet automatisch."
  if (result === "denied") return "Der Zugriff auf Google Health wurde nicht freigegeben."
  if (result === "invalid_state") return "Die OAuth-Sicherheitsprüfung ist abgelaufen. Bitte die Verbindung erneut starten."
  if (result === "oauth_error") return "Google OAuth konnte nicht abgeschlossen werden. Bitte erneut versuchen."
  if (result === "configuration_missing") return "Die Google-Health-Umgebungsvariablen sind noch nicht vollständig gesetzt."
  return null
}

function googleHealthResultIsError(result?: string) {
  return Boolean(result && result !== "connected")
}

function chartScale(values: Array<number | null | undefined>, step: number) {
  const numbers = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))

  if (numbers.length === 0) {
    return {
      domain: [0, step * 4] as [number, number],
      ticks: Array.from({ length: 5 }, (_, index) => index * step),
    }
  }

  const minimum = Math.max(0, Math.floor(Math.min(...numbers) / step) * step - step)
  const maximum = Math.ceil(Math.max(...numbers) / step) * step + step

  return {
    domain: [minimum, maximum] as [number, number],
    ticks: Array.from({ length: (maximum - minimum) / step + 1 }, (_, index) => minimum + index * step),
  }
}
