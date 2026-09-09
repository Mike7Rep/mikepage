"use client"

import { useState } from "react"
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { DepotData } from "@/lib/depot-data"
import { formatCurrency, formatDate, formatDateTime, formatQuantity } from "../format"
import { ChartRangeToggle, dashboardChartClassName, filterChartRange, type ChartRange } from "./chart-range-toggle"

const ranges = [
  { value: "1m", label: "1 Monat", shortLabel: "1M" },
  { value: "3m", label: "3 Monate", shortLabel: "3M" },
  { value: "6m", label: "6 Monate", shortLabel: "6M" },
] as const

export function PortfolioChart({ data, currency }: { data: DepotData; currency: string }) {
  const [view, setView] = useState("total")
  const [range, setRange] = useState<ChartRange>("6m")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [visibleFills, setVisibleFills] = useState(20)
  const rows = filterChartRange(data.points, range, (row) => row.date).map((row) => ({
    ...row, value: view === "total" ? row.equity : row.marketValue,
    basis: view === "total" ? row.capital : row.costBasis,
  }))
  const points = new Map(rows.map((row) => [row.date, row]))
  const fills = data.fills.filter((fill) => points.has(fill.date))
  const groups = new Map<string, typeof fills>()
  for (const fill of fills) {
    const key = `${fill.date}:${fill.side}`
    groups.set(key, [...(groups.get(key) ?? []), fill])
  }
  const config = {
    value: { label: view === "total" ? "Depotwert inkl. Cash" : "Aktienwert", color: "#8bc7ff" },
    basis: { label: view === "total" ? "Startwert + Kapitalbewegungen" : "Einkaufswert", color: "#facc15" },
  }
  const selectedFills = selectedDate ? fills.filter((fill) => fill.date === selectedDate) : fills.slice(-visibleFills).reverse()

  return (
    <Card className="bg-white/[0.035] text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-[0] uppercase">Depot-Entwicklung</CardTitle>
        <CardDescription className="text-white/55">
          {data.lastSyncedAt ? `Gespeichert: ${formatDateTime(data.lastSyncedAt)} · Letzte 6 Monate` : "Starte AI Trader oder aktualisiere die Daten, um den Verlauf zu speichern."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ToggleGroup type="single" variant="outline" value={view} onValueChange={(value) => { if (value) setView(value) }} aria-label="Depotansicht">
            <ToggleGroupItem value="total">Gesamtdepot</ToggleGroupItem>
            <ToggleGroupItem value="stocks">Aktien & Einkauf</ToggleGroupItem>
          </ToggleGroup>
          <ChartRangeToggle range={range} onRangeChange={setRange} options={ranges} />
        </div>
        <div className={dashboardChartClassName}>
          {rows.length ? (
            <ChartContainer config={config} className="size-full min-h-0 aspect-auto">
              <ComposedChart accessibilityLayer data={rows} margin={{ top: 35, right: 22, bottom: 15, left: 0 }}>
                <defs><linearGradient id="depot-value-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.03} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={40} tickFormatter={(date) => new Intl.DateTimeFormat("de-CH", { month: "short", day: "2-digit", timeZone: "UTC" }).format(new Date(date))} />
                <YAxis axisLine={false} tickLine={false} width={65} domain={["auto", "auto"]} tickFormatter={(value) => new Intl.NumberFormat("de-CH", { notation: "compact" }).format(value)} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatDate(String(value))} formatter={(value, name) => <><span className="text-muted-foreground">{name === "value" ? config.value.label : config.basis.label}</span><span className="ml-auto font-mono">{value == null ? "–" : formatCurrency(Number(value), currency)}</span></>} />} />
                <Area dataKey="value" type="linear" isAnimationActive={false} connectNulls={false} stroke="var(--color-value)" strokeWidth={2.25} fill="url(#depot-value-fill)" dot={view === "stocks" || rows.length < 3 ? { r: 3 } : false} />
                <Line dataKey="basis" type="stepAfter" isAnimationActive={false} connectNulls={false} stroke="var(--color-basis)" strokeWidth={2} strokeDasharray="6 5" dot={view === "stocks" || rows.length < 3 ? { r: 3 } : false} />
                {[...groups].map(([key, items]) => {
                  const first = items[0]
                  const value = points.get(first.date)?.value
                  if (value == null) return null
                  const symbols = [...new Set(items.map((item) => item.symbol))]
                  const label = symbols.length > 2 ? `${symbols.slice(0, 2).join(", ")} +${symbols.length - 2}` : symbols.join(", ")
                  const color = first.side === "buy" ? "#2dd4bf" : "#fb7185"
                  const bothSides = groups.has(`${first.date}:${first.side === "buy" ? "sell" : "buy"}`)
                  return <ReferenceDot key={key} x={first.date} y={value} r={5} fill={color} stroke="#050505" strokeWidth={1.5} shape={({ cx, cy }: { cx?: number; cy?: number }) => <circle cx={(cx ?? 0) + (bothSides ? first.side === "buy" ? -4 : 4 : 0)} cy={cy} r={5} fill={color} stroke="#050505" strokeWidth={1.5} onClick={() => setSelectedDate(first.date)} />} label={{ value: label, position: first.side === "buy" ? "top" : "bottom", fill: color, fontSize: 10, offset: 10 }} />
                })}
              </ComposedChart>
            </ChartContainer>
          ) : <div className="flex h-full items-center justify-center text-sm text-white/55">Noch keine Depot-Historie gespeichert.</div>}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65">
          <span><span className="text-[#8bc7ff]">━</span> {config.value.label}</span>
          <span><span className="text-[#facc15]">┄</span> {config.basis.label}</span>
          <span><span className="text-primary">●</span> Kauf</span><span><span className="text-destructive">●</span> Verkauf</span>
        </div>
        <p className="text-xs leading-5 text-white/45">{view === "total" ? "Der Kapitalvergleich startet beim ersten Depotwert und berücksichtigt danach Ein-/Auszahlungen. Er ist kein historischer Einkaufswert. Tagesstände von Alpaca; der neueste Punkt zeigt den Stand bei der Synchronisierung." : "Markt- und Einkaufswerte der gehaltenen Aktien zum jeweiligen Synchronisierungszeitpunkt. Fehlende historische Bestände werden nicht geschätzt."}</p>
        {data.warnings.filter((warning) => view === "stocks" || warning.includes("überträge")).map((warning) => <p key={warning} className="text-xs text-white/55">{warning}</p>)}
        {fills.length > 0 ? <details className="text-sm" open={selectedDate !== null}>
          <summary className="cursor-pointer text-white/70">{selectedDate ? `Transaktionen am ${formatDate(selectedDate)}` : `Käufe & Verkäufe (${fills.length})`}</summary>
          <div className="mt-3 grid max-h-64 gap-2 overflow-auto">
            {selectedFills.map((fill) => <div key={fill.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-white/[0.025] px-3 py-2 text-xs">
              <span className={fill.side === "buy" ? "text-primary" : "text-destructive"}>{fill.side === "buy" ? "● Kauf" : "● Verkauf"} {fill.symbol}</span>
              <span>{formatQuantity(fill.qty)} × {formatCurrency(fill.price, currency)}</span><span className="ml-auto text-white/45">{formatDateTime(fill.timestamp)}</span>
            </div>)}
          </div>
          {selectedDate ? <button type="button" className="mt-2 text-xs text-white/55 underline" onClick={() => setSelectedDate(null)}>Letzte Transaktionen anzeigen</button> : null}
          {!selectedDate && visibleFills < fills.length ? <button type="button" className="mt-2 text-xs text-white/55 underline" onClick={() => setVisibleFills((count) => count + 20)}>Weitere Transaktionen anzeigen</button> : null}
        </details> : null}
      </CardContent>
    </Card>
  )
}
