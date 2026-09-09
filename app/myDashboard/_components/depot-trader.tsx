"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CircleAlert, Loader2, Play, RefreshCw, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { AlpacaDashboardData } from "@/lib/python-api"
import type { OrderPreview } from "@/lib/depot-orders"
import type { TraderReview, TraderState } from "@/lib/depot-trader"
import { advanceTraderAction, getDepotWorkspaceAction, previewDepotOrderAction, refreshDepotOrdersAction, startTraderAction, submitDepotOrderAction } from "../actions"
import { formatCurrency, formatDate, formatDateTime, formatQuantity } from "../format"
import { PortfolioChart } from "./portfolio-chart"
import { clearAssetChartRequests } from "./asset-chart-panel"

type Workspace = Extract<Awaited<ReturnType<typeof getDepotWorkspaceAction>>, { ok: true }>["data"]
export type TradeSelection = { symbol: string; side: "buy" | "sell" }
const labels = { buy: "Nachkaufen", sell: "Verkaufen", hold: "Halten", insufficient_data: "Daten fehlen" }
const confidenceLabels = { low: "niedrig", medium: "mittel", high: "hoch" }
const orderLabels: Record<string, string> = {
  filled: "Ausgeführt", partially_filled: "Teilweise ausgeführt", accepted: "Angenommen", new: "Offen", pending_new: "Wird angenommen",
  canceled: "Storniert", expired: "Abgelaufen", rejected: "Abgelehnt", replaced: "Ersetzt", submitting: "Übermittlung prüfen", unknown: "Status unklar – bitte abgleichen",
}

export function DepotTrader({ data, trade, onTrade, onCloseTrade, onSelect }: {
  data: AlpacaDashboardData; trade: TradeSelection | null; onTrade: (trade: TradeSelection) => void
  onCloseTrade: () => void; onSelect: (symbol: string) => void
}) {
  const router = useRouter()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [trader, setTrader] = useState<TraderState | null>(null)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkingOrders, setCheckingOrders] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState("")
  const alive = useRef(true)
  const busy = useRef(false)
  const pause = useRef(false)

  useEffect(() => {
    alive.current = true
    let active = true
    getDepotWorkspaceAction().then((result) => {
      if (!active) return
      if (result.ok) { setWorkspace(result.data); setTrader(result.data.trader) }
      else setError(result.error)
      setLoading(false)
    }).catch(() => { if (active) { setLoading(false); setError("Gespeicherte Depot-Daten konnten nicht geladen werden.") } })
    return () => { active = false; alive.current = false; pause.current = true }
  }, [])

  async function reloadWorkspace() {
    const result = await getDepotWorkspaceAction()
    if (!result.ok) throw new Error(result.error)
    clearAssetChartRequests()
    if (alive.current) { setWorkspace(result.data); setTrader(result.data.trader) }
    return result.data
  }

  async function run(analyze: boolean, resumeId?: number) {
    if (busy.current) return
    busy.current = true
    pause.current = false
    setRunning(true); setError(null)
    try {
      const started = resumeId ? { ok: true as const, data: { id: resumeId } } : await startTraderAction(analyze)
      if (!started.ok) throw new Error(started.error)
      const id = started.data.id
      let current = (await reloadWorkspace()).trader
      while (alive.current && !pause.current) {
        const wasSync = !current.run?.symbols.length
        const next = current.run?.symbols.find((item) => item.status === "pending")
        setStep(next ? `${next.symbol}: Kursdaten laden, Quellen recherchieren und Bewertung erstellen …` : "Depot-Historie, Positionen und Kontobewegungen laden und speichern …")
        const result = await advanceTraderAction(id)
        if (!result.ok) throw new Error(result.error)
        current = result.data
        if (!alive.current) break
        setTrader(current)
        if (wasSync && current.run?.symbols.length && current.run.status === "pending") {
          const refreshed = await getDepotWorkspaceAction()
          if (refreshed.ok && alive.current) setWorkspace(refreshed.data)
        }
        if (current.run?.status !== "pending") break
      }
      if (alive.current) { await reloadWorkspace(); router.refresh() }
    } catch (reason) {
      if (alive.current) setError(reason instanceof Error ? reason.message : "AI Trader konnte nicht abgeschlossen werden.")
    } finally {
      busy.current = false
      if (alive.current) { setRunning(false); setStep("") }
    }
  }

  async function refreshOrders() {
    setCheckingOrders(true); setError(null)
    try {
      const result = await refreshDepotOrdersAction()
      if (!result.ok) throw new Error(result.error)
      await reloadWorkspace()
      router.refresh()
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Orderstatus konnte nicht geladen werden.") }
    finally { setCheckingOrders(false) }
  }

  const runState = trader?.run
  const completed = runState?.symbols.filter((item) => item.status !== "pending").length ?? 0
  const total = runState?.symbols.length ?? 0
  const terminal = runState && !["pending", "running"].includes(runState.status)
  const progress = terminal ? 100 : total ? Math.round(((completed + 1) / (total + 1)) * 100) : 0
  const canResume = runState && ["pending", "running"].includes(runState.status)
  const account = workspace?.account
  const latest = trader?.reviews ?? []

  return (
    <>
      <Card className="bg-white/[0.035] text-white">
        <CardHeader className="flex flex-col gap-4 sm:grid">
          <div>
            <CardTitle className="text-xl font-bold tracking-[0] uppercase">AI Trader</CardTitle>
            <CardDescription className="mt-1 text-white/55">Langfristig investieren. Daten und Bewertungen der letzten sechs Monate.</CardDescription>
          </div>
          <CardAction className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={running || loading || !!canResume} onClick={() => run(false)}><RefreshCw data-icon="inline-start" />Daten aktualisieren</Button>
            <Button disabled={running || loading} onClick={() => run(true, canResume ? runState.id : undefined)}>
              {running ? <Loader2 className="animate-spin" data-icon="inline-start" /> : canResume ? <Play data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
              {running ? "Verarbeitung läuft" : canResume ? "Fortsetzen" : "AI Trader starten"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>Cash <strong className="ml-2 tabular-nums">{formatCurrency(account?.cash ?? data.cash, data.currency)}</strong></span>
            <span>Für Käufe verfügbar <strong className="ml-2 tabular-nums">{account ? formatCurrency(account.available, account.currency) : "Wird geprüft …"}</strong></span>
            {account ? <Badge variant={account.paper ? "secondary" : "outline"}>{account.paper ? "Paper-Konto" : "Live-Konto"}</Badge> : null}
            {account ? <span className="text-xs text-white/45">{account.marketOpen ? "US-Markt geöffnet" : "US-Markt geschlossen"}</span> : null}
          </div>
          {account?.blockedReason ? <p className="text-xs text-white/55">{account.blockedReason}</p> : null}
          {!loading && !trader?.configured ? <p className="text-xs text-white/55">Daten können bereits gespeichert werden. Für Bewertungen OPENAI_API_KEY und OPENAI_MODEL auf dem Server hinterlegen.</p> : null}
          {error ? <p role="alert" className="break-words text-sm text-destructive">{error}</p> : null}
          {loading ? <p role="status" className="text-sm text-white/55">Gespeicherten Verlauf laden …</p> : null}
          {running || runState ? <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 text-xs text-white/60"><span role="status" aria-live="polite">{step || runState?.message}</span><span className="tabular-nums">{progress}%</span></div>
            <Progress aria-label="Fortschritt der Depotanalyse" value={progress} />
            {runState ? <p className="text-xs text-white/40">Gestartet {formatDateTime(runState.createdAt)} · {total ? `${completed} von ${total} Aktien bearbeitet` : "Datensynchronisierung"}</p> : null}
            {running ? <Button size="sm" variant="ghost" className="self-start" onClick={() => { pause.current = true; setStep("Wird nach dem aktuellen Schritt pausiert …") }}>Nach diesem Schritt pausieren</Button> : null}
            {total > 0 ? <div className="flex flex-wrap gap-2">{runState?.symbols.map((item) => <Badge key={item.symbol} variant={item.status === "failed" ? "destructive" : item.status === "completed" ? "default" : "outline"} title={item.error}>
              {item.status === "completed" ? <Check data-icon="inline-start" /> : item.status === "failed" ? <CircleAlert data-icon="inline-start" /> : null}{item.symbol} · {item.status === "completed" ? "fertig" : item.status === "failed" ? "Fehler" : "ausstehend"}
            </Badge>)}</div> : null}
            {runState?.symbols.filter((item) => item.status === "failed").map((item) => <p key={item.symbol} className="text-xs text-destructive">{item.symbol}: {item.error}</p>)}
          </div> : null}
        </CardContent>
      </Card>

      <PortfolioChart currency={data.currency} data={workspace?.depot ?? { points: [], fills: [], lastSyncedAt: null, warnings: [] }} />

      {latest.length > 0 ? <Card className="bg-white/[0.035] text-white">
        <CardHeader><CardTitle className="text-xl font-bold tracking-[0] uppercase">Aktienbewertungen</CardTitle><CardDescription className="text-white/55">Letzte gespeicherte Bewertung je Aktie. Empfehlungen werden erst durch deine Order umgesetzt.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-3">{latest.map((review) => <ReviewCard key={review.id} review={review} onSelect={onSelect} onTrade={onTrade} />)}</CardContent>
      </Card> : null}

      {(workspace?.orders.length ?? 0) > 0 ? <Card className="bg-white/[0.035] text-white">
        <CardHeader className="flex flex-col gap-4 sm:grid"><CardTitle className="text-xl font-bold tracking-[0] uppercase">Deine Orders</CardTitle><CardAction><Button variant="outline" size="sm" disabled={checkingOrders} onClick={refreshOrders}><RefreshCw data-icon="inline-start" />Status aktualisieren</Button></CardAction></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-white/45">Nach einer Ausführung aktualisiert „Daten aktualisieren“ den Verlauf und die Kauf-/Verkaufspunkte.</p>
          {workspace?.orders.map((order) => <div key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className={order.side === "buy" ? "text-primary" : "text-destructive"}>{order.side === "buy" ? "Kauf" : "Verkauf"} {order.symbol}</span><span>{formatQuantity(Number(order.qty))} Stk.</span>
            <Badge variant="outline">{orderLabels[order.status] ?? order.status}</Badge><span className="text-xs text-white/50">Ausgeführt: {order.filledQty}{order.filledPrice !== null ? ` × ${formatCurrency(order.filledPrice, data.currency)}` : ""}</span>
          </div>)}
        </CardContent>
      </Card> : null}
      {trade ? <MarketOrderDialog key={`${trade.symbol}:${trade.side}`} trade={trade} onClose={onCloseTrade} onComplete={async () => { await reloadWorkspace(); router.refresh() }} /> : null}
    </>
  )
}

function ReviewCard({ review, onSelect, onTrade }: { review: TraderReview; onSelect: (symbol: string) => void; onTrade: (trade: TradeSelection) => void }) {
  const decision = review.decision
  return <div className="flex flex-col gap-3 rounded-md bg-white/[0.03] p-4">
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="ghost" size="sm" onClick={() => onSelect(review.symbol)}>{review.symbol}</Button>
      <Badge variant={decision.action === "sell" ? "destructive" : decision.action === "buy" ? "default" : "secondary"}>{labels[decision.action]}</Badge>
      {!review.held ? <Badge variant="outline">Rückblick · nicht im Depot</Badge> : null}
      <span className="ml-auto text-xs text-white/45">{formatDateTime(review.createdAt)}</span>
    </div>
    <p className="text-sm leading-6 text-white/80">{decision.thesis}</p>
    <p className="text-xs text-white/50">KI-Sicherheit: {confidenceLabels[decision.confidence]} · Kursdaten bis {formatDate(review.priceAsOf)}</p>
    <details className="text-sm"><summary className="cursor-pointer text-white/60">Änderungen, Risiken & Rückblick</summary><div className="mt-3 flex flex-col gap-3 text-xs leading-5 text-white/65">
      <p>{decision.changes}</p>
      <ul className="list-inside list-disc">{decision.risks.map((risk, index) => <li key={index}>{risk}</li>)}</ul>
      <p>{decision.previousAssessment}</p>
      {review.executedTrades.length > 0 ? <div><p>Manuelle Ausführungen seit der vorherigen Bewertung:</p>{review.executedTrades.map((trade, index) => <p key={index}>{trade.side === "buy" ? "Kauf" : "Verkauf"}: {formatQuantity(trade.qty)} Stk. zu {trade.price} · {formatDateTime(trade.timestamp)}</p>)}</div> : <p>Keine gespeicherten Ausführungen seit der vorherigen Bewertung.</p>}
      {review.feedback ? <p>Kursvergleich {formatDate(review.feedback.from)} – {formatDate(review.feedback.to)}: <strong>{review.feedback.priceReturnPercent > 0 ? "+" : ""}{review.feedback.priceReturnPercent.toFixed(2)}%</strong>. {review.feedback.note}</p> : <p>Für einen zeitlichen Vergleich liegen noch keine ausreichenden Folgedaten vor.</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-2">{review.sources.map((source, index) => <a key={`${source.url}:${index}`} className="underline underline-offset-2" href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</div>
      <span className="text-white/40">Modell: {review.model}</span>
    </div></details>
    {review.held ? <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => onTrade({ symbol: review.symbol, side: "buy" })}>Kaufen</Button><Button variant="outline" size="sm" onClick={() => onTrade({ symbol: review.symbol, side: "sell" })}>Verkaufen</Button></div> : null}
  </div>
}

function MarketOrderDialog({ trade, onClose, onComplete }: { trade: TradeSelection; onClose: () => void; onComplete: () => Promise<void> }) {
  const [qty, setQty] = useState("1")
  const [preview, setPreview] = useState<OrderPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const inFlight = useRef(false)
  const side = trade.side === "buy" ? "Kauf" : "Verkauf"

  async function perform() {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setError(null)
    try {
      if (!preview) {
        const result = await previewDepotOrderAction(trade.symbol, trade.side, qty)
        if (!result.ok) throw new Error(result.error)
        setPreview(result.data)
      } else {
        const result = await submitDepotOrderAction(preview.id)
        if (!result.ok) throw new Error(result.error)
        setSubmitted(true)
        await onComplete()
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Order konnte nicht verarbeitet werden.") }
    finally { inFlight.current = false; setBusy(false) }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    <DialogContent>
      <DialogHeader><DialogTitle>{trade.symbol} · Market-{side}</DialogTitle><DialogDescription>Ausführung zum nächsten verfügbaren Marktpreis während der regulären US-Handelszeit. Der endgültige Preis kann vom Schätzwert abweichen.</DialogDescription></DialogHeader>
      {submitted ? <p role="status">Order übermittelt. Den aktuellen Ausführungsstatus findest du unter „Deine Orders“.</p> : <>
        <FieldGroup><Field><FieldLabel htmlFor="market-order-qty">Stückzahl</FieldLabel><Input id="market-order-qty" inputMode="decimal" value={qty} disabled={busy || !!preview} onChange={(event) => setQty(event.target.value)} /></Field></FieldGroup>
        {preview ? <div className="flex flex-col gap-2 text-sm">
          <Badge variant={preview.paper ? "secondary" : "destructive"} className="self-start">{preview.paper ? "Paper-Order" : "Echtgeld · Live-Order"}</Badge>
          <p>{side} von <strong>{preview.qty} {preview.symbol}</strong></p><p>Geschätzter Betrag: <strong>{formatCurrency(preview.estimate, preview.currency)}</strong></p>
          <p className="text-muted-foreground">Verfügbar: {formatCurrency(preview.available, preview.currency)} · Vorschau 2 Minuten gültig.</p>
        </div> : null}
      </>}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter>
        {preview && !submitted ? <Button disabled={busy} variant="outline" onClick={() => { setPreview(null); setError(null) }}>Bearbeiten</Button> : null}
        {submitted ? <Button onClick={onClose}>Schliessen</Button> : <Button disabled={busy || !qty.trim()} variant={preview && trade.side === "sell" ? "destructive" : "default"} onClick={perform}>
          {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}{preview ? `Market-${side} senden` : "Order prüfen"}
        </Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
