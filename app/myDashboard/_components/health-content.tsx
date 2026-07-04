"use client"

import { type ReactNode, useMemo, useState } from "react"
import { CalendarDays, Plus, Trash2 } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
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
import { Calendar } from "@/components/ui/calendar"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { HealthEntryView } from "@/lib/health-data"
import { createOrUpdateHealthEntryAction, deleteHealthEntryAction } from "../actions"

const bloodPressureChartConfig = {
  bloodPressure1: {
    label: "Blutdruck 1",
    color: "#8bc7ff",
  },
  bloodPressure2: {
    label: "Blutdruck 2",
    color: "#45C456",
  },
} satisfies ChartConfig

const waistChartConfig = {
  waistCm: {
    label: "Bauchumfang",
    color: "#f5c778",
  },
} satisfies ChartConfig

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "medium",
})

const decimalFormatter = new Intl.NumberFormat("de-CH", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function HealthContent({ entries }: { entries: HealthEntryView[] }) {
  const newestFirst = useMemo(() => [...entries].reverse(), [entries])

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 xl:grid-cols-2">
        <HealthChartCard description="Messpunkte für Blutdruck 1 und 2." title="Verlauf Blutdruck">
          <ChartContainer config={bloodPressureChartConfig} className="h-[320px] w-full">
            <LineChart accessibilityLayer data={entries} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis axisLine={false} dataKey="date" minTickGap={32} tickFormatter={formatChartDate} tickLine={false} tickMargin={10} />
              <YAxis axisLine={false} domain={["dataMin - 5", "dataMax + 5"]} tickLine={false} width={40} />
              <ChartTooltip
                cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
                content={<ChartTooltipContent className="border-white/10 bg-background/95" indicator="line" labelFormatter={formatChartDate} />}
              />
              <Line dataKey="bloodPressure1" dot={false} stroke="var(--color-bloodPressure1)" strokeWidth={2.5} type="monotone" />
              <Line dataKey="bloodPressure2" dot={false} stroke="var(--color-bloodPressure2)" strokeWidth={2.5} type="monotone" />
            </LineChart>
          </ChartContainer>
        </HealthChartCard>

        <HealthChartCard description="Bauchumfang in Zentimeter." title="Verlauf Bauchumfang">
          <ChartContainer config={waistChartConfig} className="h-[320px] w-full">
            <AreaChart accessibilityLayer data={entries} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="waist-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-waistCm)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--color-waistCm)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis axisLine={false} dataKey="date" minTickGap={32} tickFormatter={formatChartDate} tickLine={false} tickMargin={10} />
              <YAxis axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} tickFormatter={(value) => `${decimalFormatter.format(Number(value))} cm`} tickLine={false} width={58} />
              <ChartTooltip
                cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
                content={<ChartTooltipContent className="border-white/10 bg-background/95" indicator="line" labelFormatter={formatChartDate} />}
              />
              <Area dataKey="waistCm" dot={false} fill="url(#waist-fill)" fillOpacity={1} stroke="var(--color-waistCm)" strokeWidth={2.5} type="monotone" />
            </AreaChart>
          </ChartContainer>
        </HealthChartCard>
      </section>

      <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
        <CardHeader>
          <div>
            <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
              Verlauf
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-white/55">
              Blutdruck und Bauchumfang, neueste Einträge oben.
            </CardDescription>
          </div>
          <CardAction>
            <HealthEntryDialog />
          </CardAction>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table className="min-w-[820px] text-white">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-white/45">Datum</TableHead>
                  <TableHead className="text-right text-white/45">Blutdruck 1 (mmHg)</TableHead>
                  <TableHead className="text-right text-white/45">Blutdruck 2 (mmHg)</TableHead>
                  <TableHead className="text-right text-white/45">Bauchumfang (cm)</TableHead>
                  <TableHead className="w-10 pr-4 text-right text-white/45" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {newestFirst.map((entry) => (
                  <TableRow key={entry.id} className="border-white/10 hover:bg-white/[0.045]">
                    <TableCell className="px-4 font-medium text-white">{formatDate(entry.date)}</TableCell>
                    <TableCell className="text-right text-white/70 tabular-nums">{entry.bloodPressure1}</TableCell>
                    <TableCell className="text-right text-white/70 tabular-nums">{entry.bloodPressure2}</TableCell>
                    <TableCell className="text-right text-white/70 tabular-nums">{decimalFormatter.format(entry.waistCm)}</TableCell>
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

function HealthChartCard({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
            {title}
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-white/55">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

function HealthEntryDialog() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(currentDateInputValue())
  const selectedDate = dateFromInputValue(date)

  async function submitEntry(formData: FormData) {
    await createOrUpdateHealthEntryAction(formData)
    setOpen(false)
    setDate(currentDateInputValue())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Eintrag hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle>Eintrag hinzufügen</DialogTitle>
          <DialogDescription>
            Datum und Messwerte eintragen.
          </DialogDescription>
        </DialogHeader>
        <form action={submitEntry} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="health-date">Datum</FieldLabel>
              <input id="health-date" name="date" type="hidden" value={date} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-full justify-start text-left font-normal" type="button" variant="outline">
                    <CalendarDays data-icon="inline-start" />
                    {formatDate(date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto border-white/10 bg-black p-3 text-white">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(nextDate) => {
                      if (nextDate) setDate(toDateInputValue(nextDate))
                    }}
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <HealthNumberField label="Blutdruck 1" name="bloodPressure1" />
            <HealthNumberField label="Blutdruck 2" name="bloodPressure2" />
            <HealthNumberField decimal label="Bauchumfang in cm" name="waistCm" />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit">
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HealthNumberField({
  decimal = false,
  label,
  name,
}: {
  decimal?: boolean
  label: string
  name: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
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
          <AlertDialogDescription>
            Der Eintrag vom {formatDate(entry.date)} wird dauerhaft entfernt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Abbrechen</AlertDialogCancel>
          <form action={deleteHealthEntryAction}>
            <input name="id" type="hidden" value={entry.id} />
            <AlertDialogAction type="submit" variant="destructive">
              Löschen
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function currentDateInputValue() {
  return toDateInputValue(new Date())
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function dateFromInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(value: string) {
  return dateFormatter.format(dateFromInputValue(value))
}

function formatChartDate(value: ReactNode) {
  return formatDate(String(value))
}
