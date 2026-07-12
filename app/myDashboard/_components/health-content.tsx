"use client"

import { type ReactNode, useMemo, useState } from "react"
import { Plus, Target, Trash2 } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
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
import type { HealthEntryView, HealthGoalMetric, HealthGoalsView } from "@/lib/health-data"
import {
  createOrUpdateHealthEntryAction,
  deleteHealthEntryAction,
  updateHealthGoalsAction,
} from "../actions"
import { DashboardDatePicker, formatDashboardDate, todayInputValue } from "./dashboard-date-picker"

const bloodPressureChartConfig = {
  bloodPressure1: { label: "Blutdruck 1", color: "#8bc7ff" },
  bloodPressure2: { label: "Blutdruck 2", color: "#45C456" },
} satisfies ChartConfig

type SingleMetric = Exclude<HealthGoalMetric, "bloodPressure">
type SingleMetricDefinition = {
  key: SingleMetric
  title: string
  unit: string
  color: string
  offset: number
}

const singleMetrics: SingleMetricDefinition[] = [
  { key: "waistCm", title: "Verlauf Bauchumfang", unit: "cm", color: "#f5c778", offset: 2 },
  { key: "weightKg", title: "Verlauf Gewicht", unit: "kg", color: "#8bc7ff", offset: 2 },
  { key: "bodyFatPercent", title: "Verlauf Fettgehalt", unit: "%", color: "#c4a7ff", offset: 2 },
  { key: "pulse", title: "Verlauf Puls", unit: "bpm", color: "#45C456", offset: 5 },
]

const decimalFormatter = new Intl.NumberFormat("de-CH", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function HealthContent({
  entries,
  goals,
}: {
  entries: HealthEntryView[]
  goals: HealthGoalsView
}) {
  const newestFirst = useMemo(() => [...entries].reverse(), [entries])

  return (
    <div className="flex flex-col gap-5">
      <section className="flex w-full flex-col gap-4">
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
          <ChartContainer config={bloodPressureChartConfig} className="h-[320px] w-full">
            <LineChart accessibilityLayer data={entries} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis axisLine={false} dataKey="date" minTickGap={32} tickFormatter={formatChartDate} tickLine={false} tickMargin={10} />
              <YAxis axisLine={false} domain={["dataMin - 5", "dataMax + 5"]} tickLine={false} width={40} />
              <ChartTooltip
                cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
                content={<ChartTooltipContent className="border-white/10 bg-background/95" indicator="line" labelFormatter={formatChartDate} />}
              />
              {goals.bloodPressure1 !== null ? <GoalLine color="#ef4444" value={goals.bloodPressure1} /> : null}
              {goals.bloodPressure2 !== null ? <GoalLine color="#fb7185" value={goals.bloodPressure2} /> : null}
              <Line dataKey="bloodPressure1" dot={false} stroke="var(--color-bloodPressure1)" strokeWidth={2.5} type="monotone" />
              <Line dataKey="bloodPressure2" dot={false} stroke="var(--color-bloodPressure2)" strokeWidth={2.5} type="monotone" />
            </LineChart>
          </ChartContainer>
        </HealthChartCard>

        {singleMetrics.map((metric) => (
          <HealthChartCard
            goalAction={<HealthGoalDialog goals={goals} metric={metric.key} title={`Zielwert ${metric.title.replace("Verlauf ", "")}`} />}
            key={metric.key}
            title={metric.title}
          >
            <SingleMetricChart entries={entries} goal={goals[metric.key]} metric={metric} />
          </HealthChartCard>
        ))}
      </section>

      <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
            Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table className="min-w-[1180px] text-white">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-white/45">Datum</TableHead>
                  <TableHead className="text-right text-white/45">Blutdruck 1</TableHead>
                  <TableHead className="text-right text-white/45">Blutdruck 2</TableHead>
                  <TableHead className="text-right text-white/45">Puls</TableHead>
                  <TableHead className="text-right text-white/45">Gewicht (kg)</TableHead>
                  <TableHead className="text-right text-white/45">Fettgehalt (%)</TableHead>
                  <TableHead className="text-right text-white/45">Bauchumfang (cm)</TableHead>
                  <TableHead className="w-10 pr-4 text-right text-white/45" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {newestFirst.map((entry) => (
                  <TableRow key={entry.id} className="border-white/10 hover:bg-white/[0.045]">
                    <TableCell className="px-4 font-medium text-white">{formatDate(entry.date)}</TableCell>
                    <MetricCell value={entry.bloodPressure1} />
                    <MetricCell value={entry.bloodPressure2} />
                    <MetricCell value={entry.pulse} />
                    <MetricCell value={entry.weightKg} />
                    <MetricCell value={entry.bodyFatPercent} />
                    <MetricCell value={entry.waistCm} />
                    <TableCell className="pr-4 text-right">
                      <DeleteHealthEntryDialog entry={entry} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
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

  return (
    <ChartContainer config={config} className="h-[320px] w-full">
      <AreaChart accessibilityLayer data={entries} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor={`var(--color-${metric.key})`} stopOpacity={0.42} />
            <stop offset="95%" stopColor={`var(--color-${metric.key})`} stopOpacity={0.06} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis axisLine={false} dataKey="date" minTickGap={32} tickFormatter={formatChartDate} tickLine={false} tickMargin={10} />
        <YAxis
          axisLine={false}
          domain={[`dataMin - ${metric.offset}`, `dataMax + ${metric.offset}`]}
          tickFormatter={(value) => `${decimalFormatter.format(Number(value))} ${metric.unit}`}
          tickLine={false}
          width={62}
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
    <Card className="w-full border-white/10 bg-white/[0.035] text-white ring-white/10">
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

export function HealthEntryDialog() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(todayInputValue())

  async function submitEntry(formData: FormData) {
    await createOrUpdateHealthEntryAction(formData)
    setOpen(false)
    setDate(todayInputValue())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Eintrag hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-md overflow-y-auto border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle>Eintrag hinzufügen</DialogTitle>
          <DialogDescription>Messwerte vom Morgen eintragen.</DialogDescription>
        </DialogHeader>
        <form action={submitEntry} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="health-date">Datum</FieldLabel>
              <DashboardDatePicker id="health-date" name="date" value={date} onChange={setDate} />
            </Field>
            <HealthNumberField label="Blutdruck 1 (mmHg)" name="bloodPressure1" />
            <HealthNumberField label="Blutdruck 2 (mmHg)" name="bloodPressure2" />
            <HealthNumberField label="Puls (bpm)" name="pulse" />
            <HealthNumberField decimal label="Gewicht (kg)" name="weightKg" />
            <HealthNumberField decimal label="Fettgehalt (%)" name="bodyFatPercent" />
            <HealthNumberField decimal label="Bauchumfang (cm)" name="waistCm" />
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
}: {
  decimal?: boolean
  defaultValue?: number | null
  id?: string
  label: string
  name: string
}) {
  const inputId = id ?? name

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        defaultValue={defaultValue ?? undefined}
        id={inputId}
        inputMode={decimal ? "decimal" : "numeric"}
        min="0"
        name={name}
        pattern={decimal ? "\\d+([\\.,]\\d)?" : "\\d*"}
        required
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

function MetricCell({ value }: { value: number | null }) {
  return (
    <TableCell className="text-right text-white/70 tabular-nums">
      {value === null ? "–" : decimalFormatter.format(value)}
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
