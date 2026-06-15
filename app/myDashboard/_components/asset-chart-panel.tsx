"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, X } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AssetChartData } from "@/lib/python-api"
import { getAssetChartAction } from "../actions"
import { formatCurrency, formatDate } from "../format"

type LoadState = "idle" | "loading" | "ready" | "error"

export function AssetChartPanel({ symbol, onClose }: { symbol: string | null; onClose: () => void }) {
  const [chart, setChart] = useState<AssetChartData | null>(null)
  const [state, setState] = useState<LoadState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [chartWidth, setChartWidth] = useState(0)
  const chartRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const node = chartRef.current
    if (!node) return
    const updateWidth = () => setChartWidth(Math.max(0, Math.floor(node.getBoundingClientRect().width)))
    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)
    requestAnimationFrame(updateWidth)
    return () => observer.disconnect()
  }, [symbol])

  const chartRows = useMemo(
    () => chart?.bars.map((bar) => ({ ...bar, ek: chart.averageEntryPrice })) ?? [],
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
        <div ref={chartRef} className="h-[320px] w-full">
          {state === "loading" ? <LoadingState /> : null}
          {state === "error" ? <ErrorState message={error} /> : null}
          {state === "ready" && chartRows.length === 0 ? <EmptyState /> : null}
          {state === "ready" && chartRows.length > 0 && chart && chartWidth > 0 ? (
            <LineChart data={chartRows} height={320} margin={{ top: 12, right: 18, bottom: 4, left: 0 }} width={chartWidth}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" minTickGap={36} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} tickFormatter={shortDate} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} tickFormatter={(value) => compactCurrency(Number(value), chart.currency)} width={58} />
              <Tooltip content={<ChartTooltip currency={chart.currency} />} />
              <Line dataKey="close" dot={false} name="Close" stroke="hsl(var(--primary))" strokeWidth={2} type="monotone" />
              {chart.averageEntryPrice ? (
                <ReferenceLine y={chart.averageEntryPrice} stroke="rgba(255,255,255,0.55)" strokeDasharray="5 5" label={{ value: "Ø EK", fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
              ) : null}
              {chart.fills.map((fill) => (
                <ReferenceDot key={fill.id} x={fill.date} y={fill.price} r={4} fill={fill.side === "buy" ? "#2dd4bf" : "#fb7185"} stroke="#050505" strokeWidth={1.5} />
              ))}
            </LineChart>
          ) : null}
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

function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean
  payload?: Array<{ value?: number; dataKey?: string }>
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  const close = payload.find((item) => item.dataKey === "close")?.value ?? null
  return (
    <div className="rounded-md border border-white/10 bg-background/95 px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-white">{label ? formatDate(label) : ""}</div>
      <div className="text-white/65">{formatCurrency(close, currency)}</div>
    </div>
  )
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("de-CH", { month: "2-digit", year: "2-digit" }).format(new Date(value))
}

function compactCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("de-CH", {
    currency,
    maximumFractionDigits: 0,
    notation: "compact",
    style: "currency",
  }).format(value)
}
