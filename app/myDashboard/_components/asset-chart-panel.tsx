"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, X } from "lucide-react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { AssetChartData, AssetChartFill } from "@/lib/python-api"
import { getAssetChartAction } from "../actions"
import { formatCurrency, formatDate, formatQuantity } from "../format"

type LoadState = "idle" | "loading" | "ready" | "error"

const assetChartConfig = {
  close: {
    label: "Kurs",
    color: "#8bc7ff",
  },
  averageEntryPrice: {
    label: "Ø EK",
    color: "#facc15",
  },
} satisfies ChartConfig

export function AssetChartPanel({ symbol, onClose }: { symbol: string | null; onClose: () => void }) {
  const [chart, setChart] = useState<AssetChartData | null>(null)
  const [state, setState] = useState<LoadState>("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    let active = true
    Promise.resolve()
      .then(() => {
        if (!active) return null
        setState("loading")
        setError(null)
        return getAssetChartAction(symbol)
      })
      .then((data) => {
        if (!active || !data) return
        setChart(data)
        setState("ready")
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : "Chart konnte nicht geladen werden.")
        setState("error")
      })
    return () => {
      active = false
    }
  }, [symbol])

  const chartRows = useMemo(
    () => chart?.bars.map((bar) => ({ ...bar, averageEntryPrice: bar.averageEntryPrice ?? null })) ?? [],
    [chart]
  )
  const fills = useMemo(
    () => chart?.fills.toSorted((left, right) => right.transactionTime.localeCompare(left.transactionTime)) ?? [],
    [chart]
  )

  if (!symbol) return null

  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
            {chart?.symbol ?? symbol} Verlauf
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-white/55">
            {chart ? `${chart.name} · ${formatDate(chart.periodStart)} bis ${formatDate(chart.periodEnd)}` : "2 Jahre Tagesdaten"}
          </CardDescription>
        </div>
        <CardAction>
          <Button aria-label="Chart schliessen" size="icon" variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="h-[320px] w-full">
            {state === "loading" ? <LoadingState /> : null}
            {state === "error" ? <ErrorState message={error} /> : null}
            {state === "ready" && chartRows.length === 0 ? <EmptyState /> : null}
            {state === "ready" && chartRows.length > 0 && chart ? (
              <ChartContainer config={assetChartConfig} className="h-[320px] w-full">
                <ComposedChart accessibilityLayer data={chartRows} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="asset-close-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-close)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--color-close)" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis axisLine={false} dataKey="date" minTickGap={36} tickLine={false} tickFormatter={shortDate} tickMargin={10} />
                  <YAxis axisLine={false} domain={["auto", "auto"]} tickFormatter={(value) => compactCurrency(Number(value), chart.currency)} tickLine={false} width={58} />
                  <ChartTooltip
                    cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
                    content={
                      <ChartTooltipContent
                        className="border-white/10 bg-background/95"
                        indicator="line"
                        labelFormatter={(value) => (typeof value === "string" ? formatDate(value) : "")}
                        formatter={(value, name, item) => (
                          <>
                            <span className="text-muted-foreground">
                              {tooltipLabel(String(item.dataKey ?? name))}
                            </span>
                            <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
                              {formatCurrency(numberValue(value), chart.currency)}
                            </span>
                          </>
                        )}
                      />
                    }
                  />
                  <Area dataKey="close" dot={false} fill="url(#asset-close-fill)" fillOpacity={1} stroke="var(--color-close)" strokeWidth={2.25} type="monotone" />
                  <Line connectNulls={false} dataKey="averageEntryPrice" dot={false} isAnimationActive={false} stroke="var(--color-averageEntryPrice)" strokeDasharray="6 5" strokeWidth={2} type="stepAfter" />
                  {chart.fills.map((fill) => (
                    <ReferenceDot key={fill.id} x={fill.date} y={fill.price} r={4} fill={fill.side === "buy" ? "#2dd4bf" : "#fb7185"} stroke="#050505" strokeWidth={1.5} />
                  ))}
                </ComposedChart>
              </ChartContainer>
            ) : null}
          </div>
          {state === "ready" && chart ? <FillList currency={chart.currency} fills={fills} /> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-white/60">
      <Loader2 className="size-4 animate-spin" />
      Chart lädt
    </div>
  )
}

function ErrorState({ message }: { message: string | null }) {
  return <div className="flex h-full items-center justify-center text-sm text-destructive">{message}</div>
}

function EmptyState() {
  return <div className="flex h-full items-center justify-center text-sm text-white/55">Keine Chartdaten verfügbar.</div>
}

function FillList({ currency, fills }: { currency: string; fills: AssetChartFill[] }) {
  return (
    <div className="flex h-[320px] flex-col rounded-md border border-white/10 bg-black/20">
      <div className="border-b border-white/10 px-3 py-2">
        <div className="text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">Käufe & Verkäufe</div>
      </div>
      {fills.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-3 text-center text-xs text-white/45">
          Keine Kauf- oder Verkaufsaktivitäten im Zeitraum.
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {fills.map((fill) => (
            <div key={fill.id} className="grid gap-1 border-b border-white/10 px-3 py-2 last:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <span className={fill.side === "buy" ? "text-primary" : "text-destructive"}>
                  {fill.side === "buy" ? "Kauf" : "Verkauf"}
                </span>
                <span className="text-white/55">{formatDate(fill.date)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-white/70">
                <span>{formatQuantity(fill.qty)} Stk.</span>
                <span>{formatCurrency(fill.price, currency)}</span>
              </div>
              <div className="text-right font-medium text-white">
                {formatCurrency(fill.notional, currency)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("de-CH", { month: "2-digit", year: "2-digit" }).format(new Date(value))
}

function tooltipLabel(key: string) {
  return key === "averageEntryPrice" ? "Ø EK" : "Kurs"
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
