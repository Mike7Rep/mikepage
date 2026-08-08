"use client"

import { type Dispatch, type ReactNode, type SetStateAction, useId, useMemo, useState } from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { InvestmentAssetView, WealthSnapshotView } from "@/lib/wealth-data"
import { createOrUpdateWealthSnapshotAction, deleteWealthSnapshotAction, updateInvestmentAssetsAction } from "../actions"
import { valueTone } from "../format"
import {
  ChartRangeToggle,
  dashboardChartClassName,
  filterChartRange,
  type ChartRange,
} from "./chart-range-toggle"
import { DashboardDatePicker, todayInputValue } from "./dashboard-date-picker"

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
  const currency = latest?.currency ?? "CHF"
  const [chartRange, setChartRange] = useState<ChartRange>("max")
  const [assetRows, setAssetRows] = useState<InvestmentAssetDraft[]>(() => investmentAssets.map(investmentAssetToDraft))
  const investmentAssetsTotal = useMemo(
    () => assetRows.reduce((sum, row) => sum + draftNumber(calculatedInvestmentAssetValue(row)), 0),
    [assetRows]
  )
  const monthlyDiff = useMemo(() => monthlyWealthSlope(snapshots), [snapshots])
  const chartSnapshots = useMemo(
    () => filterChartRange(snapshots, chartRange, wealthSnapshotDate),
    [chartRange, snapshots]
  )

  return (
    <div className="flex flex-col gap-5">
      <section className="sm:max-w-sm">
        <WealthKpiCard
          title="DIFF (CHF/m)"
          tone={monthlyDiff ?? 0}
          value={monthlyDiff === null ? "–" : formatWealthNumber(monthlyDiff)}
        />
      </section>

      <section>
        <Card className="bg-white/[0.035] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
              Verlauf
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ChartRangeToggle className="self-end" onRangeChange={setChartRange} range={chartRange} />
            <ChartContainer config={wealthChartConfig} className={dashboardChartClassName}>
              <AreaChart accessibilityLayer data={chartSnapshots} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="wealth-total-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis axisLine={false} dataKey="weekKey" minTickGap={32} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickFormatter={(value) => compactNumber(Number(value))} tickLine={false} width={52} />
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
      </section>

      <section>
        <InvestmentAssetsTable
          currency={currency}
          rows={assetRows}
          setRows={setAssetRows}
          total={investmentAssetsTotal}
        />
      </section>

      <WealthTable
        defaultInvestments={investmentAssetsTotal}
        snapshots={snapshots}
      />
    </div>
  )
}

function WealthKpiCard({
  title,
  tone = 0,
  value,
}: {
  title: string
  tone?: number
  value: string
}) {
  return (
    <Card className="bg-white/[0.035] text-white" size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-medium tracking-[0.14em] text-white/48 uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl leading-none font-extrabold tracking-[0] tabular-nums", tone === 0 ? "text-white" : valueTone(tone))}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function WealthEntryDialog({
  defaultInvestments,
  defaultWeekKey,
  onOpenChange,
  open: controlledOpen,
  snapshot,
  trigger,
}: {
  defaultInvestments: number
  defaultWeekKey: string
  onOpenChange?: (open: boolean) => void
  open?: boolean
  snapshot?: WealthSnapshotView | null
  trigger?: ReactNode
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const formId = useId()
  const deleteFormId = useId()
  const descriptionId = useId()
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const isEditing = Boolean(snapshot)
  const fieldDefaults = snapshot ? {
    alpaca: snapshot.alpaca,
    bankAccount: snapshot.bankAccount,
    bondora: snapshot.bondora,
    card: snapshot.card,
    cashReserve: snapshot.cashReserve,
    investments: snapshot.investments,
    mintos: snapshot.mintos,
    savings: snapshot.savings,
    weekKey: snapshot.weekKey,
  } : {
    alpaca: 0,
    bankAccount: 0,
    bondora: 0,
    card: 0,
    cashReserve: 0,
    investments: defaultInvestments,
    mintos: 0,
    savings: 0,
    weekKey: defaultWeekKey,
  }

  async function submitEntry(formData: FormData) {
    await createOrUpdateWealthSnapshotAction(formData)
    setOpen(false)
  }

  async function deleteEntry(formData: FormData) {
    await deleteWealthSnapshotAction(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent aria-describedby={descriptionId} className="max-w-2xl border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Eintrag bearbeiten" : "Eintrag hinzufügen"}</DialogTitle>
          <DialogDescription id={descriptionId} className="sr-only">
            Vermögenseintrag bearbeiten.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} key={fieldDefaults.weekKey} action={submitEntry} className="flex flex-col gap-4">
          <FieldGroup className="grid gap-3 sm:grid-cols-2">
            <MoneyField defaultValue={fieldDefaults.weekKey} label="KW" name="weekKey" kind="week" />
            <MoneyField defaultValue={formatMoneyInput(fieldDefaults.savings)} label="save" name="savings" />
            <MoneyField defaultValue={formatMoneyInput(fieldDefaults.cashReserve)} label="BAR_res" name="cashReserve" />
            <MoneyField defaultValue={formatMoneyInput(fieldDefaults.investments)} label="Anlagen" name="investments" />
            <MoneyField defaultValue={formatMoneyInput(fieldDefaults.mintos)} label="mintos" name="mintos" />
            <MoneyField defaultValue={formatMoneyInput(fieldDefaults.bondora)} label="bondora" name="bondora" />
            <MoneyField defaultValue={formatMoneyInput(fieldDefaults.alpaca)} label="Alpaca" name="alpaca" />
            <MoneyField defaultValue={formatMoneyInput(fieldDefaults.bankAccount)} label="konto" name="bankAccount" />
            <MoneyField defaultValue={formatMoneyInput(fieldDefaults.card)} label="card" name="card" />
          </FieldGroup>
        </form>
        <DialogFooter className="gap-2 sm:justify-between">
          {snapshot ? (
            <form id={deleteFormId} action={deleteEntry}>
              <input name="id" type="hidden" value={snapshot.id} />
              <Button type="submit" variant="destructive">
                <Trash2 data-icon="inline-start" />
                Löschen
              </Button>
            </form>
          ) : <span />}
          <div className="flex flex-wrap justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button form={formId} type="submit">
              Speichern
            </Button>
          </div>
        </DialogFooter>
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
  const formId = useId()

  async function saveAssets(formData: FormData) {
    await updateInvestmentAssetsAction(formData)
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        key: `new-${Date.now()}`,
        name: "",
        totalValue: "",
        sharePercent: "",
        valuationDate: todayInputValue(),
      },
    ])
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  function updateRow(key: string, field: keyof Omit<InvestmentAssetDraft, "key">, value: string) {
    setRows((current) => current.map((row) => {
      if (row.key !== key) return row
      return { ...row, [field]: value }
    }))
  }

  return (
    <Card className="bg-white/[0.035] text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
          Anlagen
        </CardTitle>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button onClick={addRow} type="button" variant="outline">
              <Plus data-icon="inline-start" />
              Zeile
            </Button>
            <Button form={formId} type="submit">
              <Save data-icon="inline-start" />
              Speichern
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pb-4">
        <form id={formId} action={saveAssets} className="flex flex-col gap-4">
          <div className="overflow-x-hidden">
            <Table className="block min-w-0 text-white md:table md:min-w-[860px]">
              <TableHeader className="hidden md:table-header-group">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-white/45">Name</TableHead>
                  <TableHead className="text-right text-white/45">Wert</TableHead>
                  <TableHead className="text-right text-white/45">Gesamt Anlage</TableHead>
                  <TableHead className="text-right text-white/45">Anteile</TableHead>
                  <TableHead className="text-white/45">Datum</TableHead>
                  <TableHead className="w-10 pr-4 text-right text-white/45" />
                </TableRow>
              </TableHeader>
              <TableBody className="flex flex-col gap-3 px-3 md:table-row-group md:px-0">
                {rows.map((row, index) => {
                  const calculatedValue = calculatedInvestmentAssetValue(row)

                  return (
                    <TableRow key={row.key} className="relative grid grid-cols-2 gap-3 rounded-lg bg-white/[0.04] p-3 hover:bg-white/[0.055] md:table-row md:rounded-none md:bg-transparent md:p-0">
                      <ResponsiveTableCell className="col-span-2 pr-10 md:min-w-[230px] md:px-4" label="Name">
                        <Input
                          aria-label={`Name Anlage ${index + 1}`}
                          name="investmentAssetName"
                          onChange={(event) => updateRow(row.key, "name", event.target.value)}
                          required
                          value={row.name}
                        />
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="col-span-2 grid-cols-[1fr_auto] items-end font-medium text-white md:min-w-[120px]" label="Wert">
                        {formatWealthNumber(draftNumber(calculatedValue))}
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="md:min-w-[140px]" label="Gesamt Anlage">
                        <Input
                          aria-label={`Gesamt Anlage ${index + 1}`}
                          className="text-right tabular-nums"
                          inputMode="numeric"
                          name="investmentAssetTotalValue"
                          onChange={(event) => updateRow(row.key, "totalValue", wholeNumberInputValue(event.target.value))}
                          pattern="[0-9]*"
                          required
                          type="text"
                          value={row.totalValue}
                        />
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="md:min-w-[100px]" label="Anteile">
                        <Input
                          aria-label={`Anteile Anlage ${index + 1}`}
                          className="text-right tabular-nums"
                          inputMode="numeric"
                          name="investmentAssetSharePercent"
                          onChange={(event) => updateRow(row.key, "sharePercent", wholeNumberInputValue(event.target.value, 100))}
                          pattern="[0-9]*"
                          required
                          type="text"
                          value={row.sharePercent}
                        />
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="col-span-2 md:min-w-[160px]" label="Datum">
                        <DashboardDatePicker
                          ariaLabel={`Datum Anlage ${index + 1}`}
                          id={`investment-asset-date-${row.key}`}
                          name="investmentAssetValuationDate"
                          onChange={(nextValue) => updateRow(row.key, "valuationDate", nextValue)}
                          value={row.valuationDate}
                        />
                      </ResponsiveTableCell>
                      <TableCell className="absolute top-2 right-2 p-0 text-right md:static md:table-cell md:p-2 md:pr-4">
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
                  )
                })}
              </TableBody>
              <TableFooter className="hidden border-white/10 bg-white/[0.045] md:table-footer-group">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableCell className="px-4 font-semibold text-white">Summe</TableCell>
                  <TableCell className="text-right font-semibold text-white tabular-nums">
                    {formatWealthCurrency(total, currency)}
                  </TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              </TableFooter>
            </Table>
            <div className="flex items-center justify-between px-3 pt-4 text-sm md:hidden">
              <span className="font-semibold text-white">Summe</span>
              <span className="font-semibold text-white tabular-nums">{formatWealthCurrency(total, currency)}</span>
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
        pattern={kind === "money" ? "[0-9]*" : "[0-9]{2}_[0-9]{2}"}
        required
        type="text"
      />
    </Field>
  )
}

function WealthTable({
  defaultInvestments,
  snapshots,
}: {
  defaultInvestments: number
  snapshots: WealthSnapshotView[]
}) {
  const [editingSnapshot, setEditingSnapshot] = useState<WealthSnapshotView | null>(null)

  return (
    <Card className="bg-white/[0.035] text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
          Historie
        </CardTitle>
        <CardAction>
          <WealthEntryDialog
            defaultInvestments={defaultInvestments}
            defaultWeekKey={currentWeekKey()}
            trigger={(
              <Button>
                <Plus data-icon="inline-start" />
                Eintrag hinzufügen
              </Button>
            )}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-hidden">
          <Table className="block min-w-0 text-white md:table md:min-w-[960px]">
            <TableHeader className="hidden md:table-header-group">
              <TableRow className="border-white/10 hover:bg-transparent">
                {["KW", "Gesamt", "Diff", "Save", "BAR", "Anlagen", "Mintos", "Bondora", "Alpaca", "Konto", "Card"].map((label) => (
                  <TableHead key={label} className={label === "KW" ? "px-4 text-white/45" : "text-right text-white/45"}>
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="flex flex-col gap-2 px-3 md:table-row-group md:px-0">
              {[...snapshots].reverse().map((snapshot) => (
                <TableRow
                  key={snapshot.id}
                  className="grid cursor-pointer grid-cols-2 gap-3 rounded-lg bg-white/[0.04] p-3 hover:bg-white/[0.055] focus-visible:bg-white/[0.06] focus-visible:outline-none md:table-row md:rounded-none md:bg-transparent md:p-0"
                  onClick={() => setEditingSnapshot(snapshot)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setEditingSnapshot(snapshot)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <ResponsiveTableCell className="col-span-2 text-base font-medium text-white md:px-4 md:text-xs/relaxed" label="KW">{snapshot.weekKey}</ResponsiveTableCell>
                  <ResponsiveTableCell className="font-medium text-white" label="Gesamt">{formatWealthNumber(snapshot.total)}</ResponsiveTableCell>
                  <ResponsiveTableCell className={cn("font-medium", valueTone(snapshot.diff ?? 0))} label="Diff">{formatWealthNumber(snapshot.diff)}</ResponsiveTableCell>
                  <ResponsiveTableCell label="Save">{formatWealthNumber(snapshot.savings)}</ResponsiveTableCell>
                  <ResponsiveTableCell label="BAR">{formatWealthNumber(snapshot.cashReserve)}</ResponsiveTableCell>
                  <ResponsiveTableCell label="Anlagen">{formatWealthNumber(snapshot.investments)}</ResponsiveTableCell>
                  <ResponsiveTableCell label="Mintos">{formatWealthNumber(snapshot.mintos)}</ResponsiveTableCell>
                  <ResponsiveTableCell label="Bondora">{formatWealthNumber(snapshot.bondora)}</ResponsiveTableCell>
                  <ResponsiveTableCell label="Alpaca">{formatWealthNumber(snapshot.alpaca)}</ResponsiveTableCell>
                  <ResponsiveTableCell label="Konto">{formatWealthNumber(snapshot.bankAccount)}</ResponsiveTableCell>
                  <ResponsiveTableCell className="md:pr-4" label="Card">{formatWealthNumber(snapshot.card)}</ResponsiveTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <WealthEntryDialog
        defaultInvestments={defaultInvestments}
        defaultWeekKey={currentWeekKey()}
        onOpenChange={(open) => {
          if (!open) setEditingSnapshot(null)
        }}
        open={Boolean(editingSnapshot)}
        snapshot={editingSnapshot}
      />
    </Card>
  )
}

function ResponsiveTableCell({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <TableCell
      className={cn(
        "grid gap-1 p-0 text-left text-white/70 tabular-nums before:text-[0.625rem] before:font-medium before:tracking-[0.08em] before:text-white/40 before:uppercase before:content-[attr(data-label)] md:table-cell md:p-2 md:text-right md:before:hidden",
        className
      )}
      data-label={label}
    >
      {children}
    </TableCell>
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

function wealthSnapshotDate(snapshot: WealthSnapshotView) {
  const januaryFourth = new Date(Date.UTC(snapshot.year, 0, 4))
  const januaryFourthDay = januaryFourth.getUTCDay() || 7
  januaryFourth.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1 + (snapshot.week - 1) * 7)
  return januaryFourth.toISOString().slice(0, 10)
}

function investmentAssetToDraft(asset: InvestmentAssetView): InvestmentAssetDraft {
  const hasCalculationBasis = asset.totalValue !== null && asset.sharePercent !== null

  return {
    key: String(asset.id),
    name: asset.name,
    totalValue: formatMoneyInput(hasCalculationBasis ? asset.totalValue : asset.value),
    sharePercent: formatPlainInput(hasCalculationBasis ? asset.sharePercent : 100),
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

function calculatedInvestmentAssetValue(row: InvestmentAssetDraft) {
  return valueFromTotalAndShare(row.totalValue, row.sharePercent) ?? "0"
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

function compactNumber(value: number) {
  return new Intl.NumberFormat("de-CH", {
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(value)
}

function monthlyWealthSlope(snapshots: WealthSnapshotView[]) {
  if (snapshots.length < 2) return null

  const weekMs = 7 * 24 * 60 * 60 * 1000
  const points = snapshots.map((snapshot) => {
    const januaryFourth = new Date(Date.UTC(snapshot.year, 0, 4))
    const januaryFourthDay = januaryFourth.getUTCDay() || 7
    const week = januaryFourth.getTime() - (januaryFourthDay - 1) * 24 * 60 * 60 * 1000
      + (snapshot.week - 1) * weekMs
    return { total: snapshot.total, week }
  })
  const latestWeek = points.at(-1)!.week
  const recent = points.filter((point) => latestWeek - point.week < 48 * weekMs)
  if (recent.length < 2) return null

  const firstWeek = recent[0].week
  const meanX = recent.reduce((sum, point) => sum + (point.week - firstWeek) / weekMs, 0) / recent.length
  const meanY = recent.reduce((sum, point) => sum + point.total, 0) / recent.length
  const { covariance, variance } = recent.reduce((result, point) => {
    const x = (point.week - firstWeek) / weekMs - meanX
    return {
      covariance: result.covariance + x * (point.total - meanY),
      variance: result.variance + x * x,
    }
  }, { covariance: 0, variance: 0 })

  return variance === 0 ? null : covariance / variance * 4
}

function normalizeSwissNumber(value: string) {
  return value.replace(/\u2019/g, "'")
}
