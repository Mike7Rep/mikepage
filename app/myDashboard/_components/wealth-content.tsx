"use client"

import { useState } from "react"
import { Plus, TrendingUp, Vault, WalletCards, Landmark } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

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
import type { WealthSnapshotView } from "@/lib/wealth-data"
import { createOrUpdateWealthSnapshotAction } from "../actions"
import { formatCurrency, valueTone } from "../format"
import { KpiCard } from "./kpi-card"

const wealthTooltipLabels: Record<string, string> = {
  total: "Gesamt",
  safeCapital: "Stabil",
  platforms: "P2P",
  alpaca: "Alpaca",
  liquid: "Liquid",
  legacyDegiro: "Legacy",
}

const wealthChartConfig = {
  total: {
    label: wealthTooltipLabels.total,
    color: "#8bc7ff",
  },
  safeCapital: {
    label: wealthTooltipLabels.safeCapital,
    color: "#84cc16",
  },
  platforms: {
    label: wealthTooltipLabels.platforms,
    color: "#2dd4bf",
  },
  alpaca: {
    label: wealthTooltipLabels.alpaca,
    color: "#38bdf8",
  },
  liquid: {
    label: wealthTooltipLabels.liquid,
    color: "#facc15",
  },
  legacyDegiro: {
    label: wealthTooltipLabels.legacyDegiro,
    color: "#94a3b8",
  },
} satisfies ChartConfig

export function WealthContent({ snapshots }: { snapshots: WealthSnapshotView[] }) {
  const latest = snapshots.at(-1)
  const previous = snapshots.length > 1 ? snapshots.at(-2) : null
  const currency = latest?.currency ?? "CHF"
  const chartRows = snapshots.map((snapshot) => ({
    ...snapshot,
    liquid: snapshot.cashReserve + snapshot.bankAccount + snapshot.card,
    platforms: snapshot.mintos + snapshot.bondora,
    safeCapital: snapshot.savings + snapshot.investments,
  }))

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard description={latest ? `KW ${latest.weekKey}` : "Noch kein Eintrag"} icon={Vault} title="Gesamt" value={formatCurrency(latest?.total ?? null, currency)} />
        <KpiCard description={previous ? "Gegen vorherigen Eintrag" : "Keine Vorwoche"} icon={TrendingUp} title="Diff" tone={latest?.diff ?? 0} value={formatCurrency(latest?.diff ?? null, currency)} />
        <KpiCard description="Save + Anlagen" icon={Landmark} title="Stabil" value={formatCurrency(latest ? latest.savings + latest.investments : null, currency)} />
        <KpiCard description="Konto + Card + BAR_res" icon={WalletCards} title="Liquid" value={formatCurrency(latest ? latest.bankAccount + latest.card + latest.cashReserve : null, currency)} />
      </section>

      <div className="flex justify-end">
        <WealthEntryDialog defaultWeekKey={nextWeekKey(latest?.weekKey)} />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
          <CardHeader>
            <div>
              <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
                Verlauf
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-white/55">
                Wöchentliche Vermögensentwicklung in CHF.
              </CardDescription>
            </div>
            <CardAction>
              <Badge className="bg-primary text-primary-foreground">
                {snapshots.length} KWs
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={wealthChartConfig} className="h-[360px] w-full">
              <AreaChart accessibilityLayer data={chartRows} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="wealth-total-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis axisLine={false} dataKey="weekKey" minTickGap={32} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickFormatter={(value) => compactCurrency(Number(value), currency)} tickLine={false} width={58} />
                <ChartTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      className="border-white/10 bg-background/95"
                      indicator="line"
                      labelFormatter={(value) => `KW ${value}`}
                      formatter={(value, name, item) => (
                        <>
                          <span className="text-muted-foreground">
                            {wealthTooltipLabel(String(item.dataKey ?? name))}
                          </span>
                          <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
                            {formatCurrency(numberValue(value), currency)}
                          </span>
                        </>
                      )}
                    />
                  }
                />
                <Area dataKey="total" dot={false} fill="url(#wealth-total-fill)" fillOpacity={1} stroke="var(--color-total)" strokeWidth={2.5} type="monotone" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
          <CardHeader>
            <div>
              <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
                Zusammensetzung
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-white/55">
                Save, Anlagen, P2P, Alpaca und Liquidität.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={wealthChartConfig} className="h-[360px] w-full">
              <BarChart accessibilityLayer data={chartRows.slice(-18)} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis axisLine={false} dataKey="weekKey" minTickGap={18} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickFormatter={(value) => compactCurrency(Number(value), currency)} tickLine={false} width={52} />
                <ChartTooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  content={
                    <ChartTooltipContent
                      className="border-white/10 bg-background/95"
                      indicator="dot"
                      labelFormatter={(value) => `KW ${value}`}
                      formatter={(value, name, item) => (
                        <>
                          <span className="text-muted-foreground">
                            {wealthTooltipLabel(String(item.dataKey ?? name))}
                          </span>
                          <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
                            {formatCurrency(numberValue(value), currency)}
                          </span>
                        </>
                      )}
                    />
                  }
                />
                <Bar dataKey="safeCapital" fill="var(--color-safeCapital)" stackId="wealth" />
                <Bar dataKey="platforms" fill="var(--color-platforms)" stackId="wealth" />
                <Bar dataKey="alpaca" fill="var(--color-alpaca)" stackId="wealth" />
                <Bar dataKey="liquid" fill="var(--color-liquid)" stackId="wealth" />
                <Bar dataKey="legacyDegiro" fill="var(--color-legacyDegiro)" stackId="wealth" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <WealthTable currency={currency} snapshots={snapshots} />
    </div>
  )
}

function WealthEntryDialog({ defaultWeekKey }: { defaultWeekKey: string }) {
  const [open, setOpen] = useState(false)

  async function submitEntry(formData: FormData) {
    await createOrUpdateWealthSnapshotAction(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Eintrag hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle>Eintrag hinzufügen</DialogTitle>
          <DialogDescription>
            KW und CHF-Werte eintragen.
          </DialogDescription>
        </DialogHeader>
        <form action={submitEntry} className="flex flex-col gap-4">
          <FieldGroup className="grid gap-3 sm:grid-cols-2">
            <MoneyField defaultValue={defaultWeekKey} label="KW" name="weekKey" step={undefined} type="text" />
            <MoneyField label="save" name="savings" />
            <MoneyField label="BAR_res" name="cashReserve" />
            <MoneyField label="Anlagen" name="investments" />
            <MoneyField label="mintos" name="mintos" />
            <MoneyField label="bondora" name="bondora" />
            <MoneyField label="Alpaca" name="alpaca" />
            <MoneyField label="konto" name="bankAccount" />
            <MoneyField label="card" name="card" />
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

function MoneyField({
  defaultValue = "0",
  label,
  name,
  step = "0.01",
  type = "number",
}: {
  defaultValue?: string
  label: string
  name: string
  step?: string
  type?: "number" | "text"
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        defaultValue={defaultValue}
        id={name}
        inputMode={type === "number" ? "decimal" : "text"}
        min={type === "number" ? "0" : undefined}
        name={name}
        pattern={type === "text" ? "\\d{2}_\\d{2}" : undefined}
        required
        step={step}
        type={type}
      />
    </Field>
  )
}

function WealthTable({ currency, snapshots }: { currency: string; snapshots: WealthSnapshotView[] }) {
  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
            Historie
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-white/55">
            Eine Zeile pro KW, neueste Einträge oben.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <Table className="min-w-[960px] text-white">
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              {["KW", "Gesamt", "Diff", "Save", "BAR", "Anlagen", "Mintos", "Bondora", "Alpaca", "Konto", "Card"].map((label) => (
                <TableHead key={label} className={label === "KW" ? "px-4 text-white/45" : "text-right text-white/45"}>
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...snapshots].reverse().map((snapshot) => (
              <TableRow key={snapshot.id} className="border-white/10 hover:bg-white/[0.045]">
                <TableCell className="px-4 font-medium text-white">{snapshot.weekKey}</TableCell>
                <TableCell className="text-right font-medium text-white">{formatCurrency(snapshot.total, currency)}</TableCell>
                <TableCell className={`text-right font-medium ${valueTone(snapshot.diff ?? 0)}`}>{formatCurrency(snapshot.diff, currency)}</TableCell>
                <TableCell className="text-right text-white/70">{formatCurrency(snapshot.savings, currency)}</TableCell>
                <TableCell className="text-right text-white/70">{formatCurrency(snapshot.cashReserve, currency)}</TableCell>
                <TableCell className="text-right text-white/70">{formatCurrency(snapshot.investments, currency)}</TableCell>
                <TableCell className="text-right text-white/70">{formatCurrency(snapshot.mintos, currency)}</TableCell>
                <TableCell className="text-right text-white/70">{formatCurrency(snapshot.bondora, currency)}</TableCell>
                <TableCell className="text-right text-white/70">{formatCurrency(snapshot.alpaca, currency)}</TableCell>
                <TableCell className="text-right text-white/70">{formatCurrency(snapshot.bankAccount, currency)}</TableCell>
                <TableCell className="pr-4 text-right text-white/70">{formatCurrency(snapshot.card, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function nextWeekKey(weekKey?: string) {
  if (!weekKey) return currentWeekKey()
  const match = /^(\d{2})_(\d{2})$/.exec(weekKey)
  if (!match) return currentWeekKey()
  const year = Number(match[1])
  const week = Number(match[2])
  if (week >= 53) return `${String(year + 1).padStart(2, "0")}_01`
  return `${String(year).padStart(2, "0")}_${String(week + 1).padStart(2, "0")}`
}

function currentWeekKey() {
  const now = new Date()
  const target = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const day = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${String(target.getUTCFullYear()).slice(-2)}_${String(week).padStart(2, "0")}`
}

function wealthTooltipLabel(key: string) {
  return wealthTooltipLabels[key] ?? key
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : Number(value)
}

function compactCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("de-CH", {
    currency,
    maximumFractionDigits: 0,
    notation: "compact",
    style: "currency",
  }).format(value)
}
