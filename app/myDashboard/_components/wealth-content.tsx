"use client"

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react"
import { Landmark, Plus, Save, Trash2, TrendingUp, Vault, WalletCards } from "lucide-react"
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
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InvestmentAssetView, WealthSnapshotView } from "@/lib/wealth-data"
import { createOrUpdateWealthSnapshotAction, updateInvestmentAssetsAction } from "../actions"
import { valueTone } from "../format"
import { KpiCard } from "./kpi-card"

const wealthTooltipLabels: Record<string, string> = {
  total: "Gesamt",
}

const wealthChartConfig = {
  total: {
    label: wealthTooltipLabels.total,
    color: "#8bc7ff",
  },
} satisfies ChartConfig

type InvestmentAssetDraft = {
  key: string
  name: string
  value: string
  totalValue: string
  sharePercent: string
  valuationDate: string
}

export function WealthContent({
  investmentAssets,
  snapshots,
}: {
  investmentAssets: InvestmentAssetView[]
  snapshots: WealthSnapshotView[]
}) {
  const latest = snapshots.at(-1)
  const previous = snapshots.length > 1 ? snapshots.at(-2) : null
  const currency = latest?.currency ?? "CHF"
  const [assetRows, setAssetRows] = useState<InvestmentAssetDraft[]>(() => investmentAssets.map(investmentAssetToDraft))
  const investmentAssetsTotal = useMemo(
    () => assetRows.reduce((sum, row) => sum + draftNumber(row.value), 0),
    [assetRows]
  )

  useEffect(() => {
    setAssetRows(investmentAssets.map(investmentAssetToDraft))
  }, [investmentAssets])

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard description={latest ? `KW ${latest.weekKey}` : "Noch kein Eintrag"} icon={Vault} title="Gesamt" value={formatWealthCurrency(latest?.total ?? null, currency)} />
        <KpiCard description={previous ? "Gegen vorherigen Eintrag" : "Keine Vorwoche"} icon={TrendingUp} title="Diff" tone={latest?.diff ?? 0} value={formatWealthCurrency(latest?.diff ?? null, currency)} />
        <KpiCard description="Save + Anlagen" icon={Landmark} title="Stabil" value={formatWealthCurrency(latest ? latest.savings + latest.investments : null, currency)} />
        <KpiCard description="Konto + Card + BAR_res" icon={WalletCards} title="Liquid" value={formatWealthCurrency(latest ? latest.bankAccount + latest.card + latest.cashReserve : null, currency)} />
      </section>

      <div className="flex justify-end">
        <WealthEntryDialog defaultInvestments={investmentAssetsTotal} defaultWeekKey={currentWeekKey()} />
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
              <AreaChart accessibilityLayer data={snapshots} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
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
                            {formatWealthCurrency(numberValue(value), currency)}
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

        <InvestmentAssetsTable
          currency={currency}
          rows={assetRows}
          setRows={setAssetRows}
          total={investmentAssetsTotal}
        />
      </section>

      <WealthTable currency={currency} snapshots={snapshots} />
    </div>
  )
}

function WealthEntryDialog({
  defaultInvestments,
  defaultWeekKey,
}: {
  defaultInvestments: number
  defaultWeekKey: string
}) {
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
            <MoneyField defaultValue={defaultWeekKey} label="KW" name="weekKey" kind="week" />
            <MoneyField label="save" name="savings" />
            <MoneyField label="BAR_res" name="cashReserve" />
            <MoneyField defaultValue={formatMoneyInput(defaultInvestments)} label="Anlagen" name="investments" />
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

function InvestmentAssetsTable({
  currency,
  rows,
  setRows,
  total,
}: {
  currency: string
  rows: InvestmentAssetDraft[]
  setRows: Dispatch<SetStateAction<InvestmentAssetDraft[]>>
  total: number
}) {
  async function saveAssets(formData: FormData) {
    await updateInvestmentAssetsAction(formData)
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        key: `new-${Date.now()}`,
        name: "",
        value: "0",
        totalValue: "",
        sharePercent: "",
        valuationDate: currentDateInputValue(),
      },
    ])
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  function updateRow(key: string, field: keyof Omit<InvestmentAssetDraft, "key">, value: string) {
    setRows((current) => current.map((row) => {
      if (row.key !== key) return row

      const next = { ...row, [field]: value }
      if (field === "totalValue" || field === "sharePercent") {
        next.value = valueFromTotalAndShare(next.totalValue, next.sharePercent) ?? next.value
      }

      return next
    }))
  }

  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
            Anlagen
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-white/55">
            Aufstellung der Anlagen für den Wert im nächsten Eintrag.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-4">
        <form action={saveAssets} className="flex flex-col gap-4">
          <Table className="min-w-[860px] text-white">
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-white/45">Name</TableHead>
                <TableHead className="text-right text-white/45">Wert</TableHead>
                <TableHead className="text-right text-white/45">Gesamt Anlage</TableHead>
                <TableHead className="text-right text-white/45">Anteile</TableHead>
                <TableHead className="text-white/45">Datum</TableHead>
                <TableHead className="w-10 pr-4 text-right text-white/45" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.key} className="border-white/10 hover:bg-white/[0.035]">
                  <TableCell className="min-w-[230px] px-4">
                    <Input
                      aria-label={`Name Anlage ${index + 1}`}
                      name="investmentAssetName"
                      onChange={(event) => updateRow(row.key, "name", event.target.value)}
                      required
                      value={row.name}
                    />
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <Input
                      aria-label={`Wert Anlage ${index + 1}`}
                      className="text-right tabular-nums"
                      inputMode="numeric"
                      name="investmentAssetValue"
                      onChange={(event) => updateRow(row.key, "value", wholeNumberInputValue(event.target.value))}
                      pattern="\\d*"
                      required
                      type="text"
                      value={row.value}
                    />
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <Input
                      aria-label={`Gesamt Anlage ${index + 1}`}
                      className="text-right tabular-nums"
                      inputMode="numeric"
                      name="investmentAssetTotalValue"
                      onChange={(event) => updateRow(row.key, "totalValue", wholeNumberInputValue(event.target.value))}
                      pattern="\\d*"
                      type="text"
                      value={row.totalValue}
                    />
                  </TableCell>
                  <TableCell className="min-w-[100px]">
                    <Input
                      aria-label={`Anteile Anlage ${index + 1}`}
                      className="text-right tabular-nums"
                      inputMode="numeric"
                      name="investmentAssetSharePercent"
                      onChange={(event) => updateRow(row.key, "sharePercent", wholeNumberInputValue(event.target.value, 100))}
                      pattern="\\d*"
                      type="text"
                      value={row.sharePercent}
                    />
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <Input
                      aria-label={`Datum Anlage ${index + 1}`}
                      name="investmentAssetValuationDate"
                      onChange={(event) => updateRow(row.key, "valuationDate", event.target.value)}
                      type="date"
                      value={row.valuationDate}
                    />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      aria-label={`${row.name || "Anlage"} entfernen`}
                      onClick={() => removeRow(row.key)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="border-white/10 bg-white/[0.045]">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell className="px-4 font-semibold text-white">Summe</TableCell>
                <TableCell className="text-right font-semibold text-white tabular-nums">
                  {formatWealthCurrency(total, currency)}
                </TableCell>
                <TableCell colSpan={4} />
              </TableRow>
            </TableFooter>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <p className="text-xs text-white/55">
              Diese Summe wird im neuen Eintrag für Anlagen vorbelegt.
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={addRow} type="button" variant="outline">
                <Plus data-icon="inline-start" />
                Zeile
              </Button>
              <Button type="submit">
                <Save data-icon="inline-start" />
                Speichern
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function MoneyField({
  defaultValue = "0",
  kind = "money",
  label,
  name,
}: {
  defaultValue?: string
  kind?: "money" | "week"
  label: string
  name: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        defaultValue={defaultValue}
        id={name}
        inputMode={kind === "money" ? "numeric" : "text"}
        name={name}
        onInput={(event) => {
          if (kind === "money") {
            event.currentTarget.value = wholeNumberInputValue(event.currentTarget.value)
          }
        }}
        pattern={kind === "money" ? "\\d*" : "\\d{2}_\\d{2}"}
        required
        type="text"
      />
    </Field>
  )
}

function WealthTable({ snapshots }: { currency: string; snapshots: WealthSnapshotView[] }) {
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
                <TableCell className="text-right font-medium text-white">{formatWealthNumber(snapshot.total)}</TableCell>
                <TableCell className={`text-right font-medium ${valueTone(snapshot.diff ?? 0)}`}>{formatWealthNumber(snapshot.diff)}</TableCell>
                <TableCell className="text-right text-white/70">{formatWealthNumber(snapshot.savings)}</TableCell>
                <TableCell className="text-right text-white/70">{formatWealthNumber(snapshot.cashReserve)}</TableCell>
                <TableCell className="text-right text-white/70">{formatWealthNumber(snapshot.investments)}</TableCell>
                <TableCell className="text-right text-white/70">{formatWealthNumber(snapshot.mintos)}</TableCell>
                <TableCell className="text-right text-white/70">{formatWealthNumber(snapshot.bondora)}</TableCell>
                <TableCell className="text-right text-white/70">{formatWealthNumber(snapshot.alpaca)}</TableCell>
                <TableCell className="text-right text-white/70">{formatWealthNumber(snapshot.bankAccount)}</TableCell>
                <TableCell className="pr-4 text-right text-white/70">{formatWealthNumber(snapshot.card)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
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

function investmentAssetToDraft(asset: InvestmentAssetView): InvestmentAssetDraft {
  return {
    key: String(asset.id),
    name: asset.name,
    value: formatMoneyInput(asset.value),
    totalValue: formatMoneyInput(asset.totalValue),
    sharePercent: formatPlainInput(asset.sharePercent),
    valuationDate: asset.valuationDate ?? "",
  }
}

function formatMoneyInput(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return ""
  return String(Math.round(value))
}

function formatPlainInput(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return ""
  return String(Math.round(value))
}

function draftNumber(value: string) {
  const parsed = Number(wholeNumberInputValue(value))
  return Number.isFinite(parsed) ? parsed : 0
}

function valueFromTotalAndShare(totalValue: string, sharePercent: string) {
  if (!totalValue.trim() || !sharePercent.trim()) return null
  const total = draftNumber(totalValue)
  const share = draftNumber(sharePercent)
  if (!Number.isFinite(total) || !Number.isFinite(share)) return null
  return formatMoneyInput((total * share) / 100)
}

function currentDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function wealthTooltipLabel(key: string) {
  return wealthTooltipLabels[key] ?? key
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : Number(value)
}

function wholeNumberInputValue(value: string, max?: number) {
  const parsed = value.replace(/\D/g, "")
  if (!parsed) return ""
  const number = Number(parsed)
  if (max !== undefined && number > max) {
    return String(max)
  }
  return parsed
}

function formatWealthCurrency(value: number | null, currency: string) {
  if (value === null || Number.isNaN(value)) return `${currency} 0`

  return normalizeSwissNumber(new Intl.NumberFormat("de-CH", {
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(Math.round(value)))
}

function formatWealthNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "0"

  return normalizeSwissNumber(new Intl.NumberFormat("de-CH", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(value)))
}

function compactCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("de-CH", {
    currency,
    maximumFractionDigits: 0,
    notation: "compact",
    style: "currency",
  }).format(value)
}

function normalizeSwissNumber(value: string) {
  return value.replace(/\u2019/g, "'")
}
