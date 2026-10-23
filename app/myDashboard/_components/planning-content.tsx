"use client"

import { useRef, useState } from "react"
import { Bangers } from "next/font/google"
import { Reorder, useDragControls, useReducedMotion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { planningWeekLabel, type PlanningTask } from "@/lib/planning"
import type { PlanningDashboard } from "@/lib/planning-data"
import { cn } from "@/lib/utils"
import { planningAction } from "../planung/actions"

const comic = Bangers({ weight: "400", subsets: ["latin"] })

export function PlanningContent({ initial }: { initial: PlanningDashboard }) {
  const [data, setData] = useState(initial)
  const [tasks, setTasks] = useState(initial.tasks)
  const current = useRef(initial)
  const draft = useRef(initial.tasks)
  const pending = useRef<PlanningTask[] | null>(null)
  const saving = useRef<Promise<boolean> | null>(null)
  const blocked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [moving, setMoving] = useState<string | null>(null)

  // Serialize autosaves so typing, status changes and sorting cannot overwrite each other.
  function flush(): Promise<boolean> {
    if (saving.current) return saving.current
    if (blocked.current) return Promise.resolve(false)
    saving.current = (async () => {
      setBusy(true)
      try {
        while (pending.current) {
          const snapshot = pending.current
          pending.current = null
          const result = await planningAction(current.current.page, { week: current.current.week, version: current.current.version, tasks: snapshot })
          if (!result.ok) throw new Error(result.error)
          current.current = result.data
          setData(result.data)
        }
        setError("")
        return true
      } catch (reason) {
        pending.current = draft.current
        blocked.current = true
        setError(reason instanceof Error ? reason.message : "Nicht gespeichert. Bitte erneut versuchen.")
        return false
      } finally { setBusy(false) }
    })().finally(() => { saving.current = null })
    return saving.current
  }

  function update(next: PlanningTask[], save = false) {
    draft.current = next
    setTasks(next)
    if (save) {
      pending.current = next.map((task) => ({ ...task, title: task.title.trim(), status: task.title.trim() ? task.status : "open" }))
      void flush()
    }
  }

  function change(id: string, patch: Partial<PlanningTask>, save = true) {
    update(draft.current.map((task) => task.id === id ? { ...task, ...patch } : task), save)
  }

  function move(id: string, index: number) {
    setMoving(null)
    const next = [...draft.current]
    const from = next.findIndex((task) => task.id === id)
    if (from < 0 || index < 0 || index > 10 || from === index) return
    next.splice(index, 0, next.splice(from, 1)[0])
    update(next, true)
  }

  async function load(page = data.page, discard = false) {
    if (!discard && !(await flush())) return
    setBusy(true)
    try {
      const result = await planningAction(page)
      if (!result.ok) throw new Error(result.error)
      current.current = result.data
      setData(result.data)
      update(result.data.tasks)
      pending.current = null
      blocked.current = false
      setMoving(null)
      setError("")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Laden fehlgeschlagen.")
    } finally { setBusy(false) }
  }

  const deadline = new Date(`${data.week}T00:00:00Z`)
  deadline.setUTCDate(deadline.getUTCDate() + 6)
  const deadlineLabel = new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(deadline)
  const chart = data.chart.map((row) => ({ ...row, label: planningWeekLabel(row.week) }))

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-8">
      <Card className="bg-white/[0.035] text-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold uppercase">Deine Wochen</CardTitle>
          <CardDescription>Gesamtpunkte · letzte 26 abgeschlossene Wochen</CardDescription>
        </CardHeader>
        <CardContent>
          {chart.length ? <>
            <p className="mb-4 text-sm text-muted-foreground">Gesamt: {chart.at(-1)?.total ?? 0} Punkte</p>
            <ChartContainer className="h-64 w-full sm:h-80" config={{ total: { label: "Gesamtpunkte", color: "var(--chart-1)" } }}>
              <AreaChart accessibilityLayer data={chart} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} tickFormatter={(label: string) => label.split(" · ")[0]} />
                <YAxis width={40} allowDecimals={false} tickLine={false} axisLine={false} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area isAnimationActive={false} dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.2} strokeWidth={2} dot={false} activeDot={false} />
              </AreaChart>
            </ChartContainer>
          </> : <div className="flex h-48 flex-col items-center justify-center gap-2 text-center"><p>Deine erste Woche beginnt hier.</p><p className="text-sm text-muted-foreground">Ab Montag erscheint dein erster Wochenabschluss.</p></div>}
        </CardContent>
      </Card>
      <Card className="bg-white/[0.035] text-white">
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <CardTitle className="text-xl font-bold uppercase">Planung</CardTitle>
            <CardDescription>{planningWeekLabel(data.week)} · bis So, {deadlineLabel}</CardDescription>
          </div>
          <p className="text-xs text-muted-foreground sm:hidden">Punkte antippen zum Verschieben · rechts ✓ · links ✕</p>
          <span className="sr-only" role="status">{busy ? "Wird gespeichert oder geladen." : error ? "Nicht gespeichert." : "Gespeichert."}</span>
          {moving ? <button className="text-left text-xs text-primary" onClick={() => setMoving(null)}>Zielpunktzahl antippen · Abbrechen</button> : null}
          {error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive"><span>{error}</span><Button variant="outline" disabled={busy} onClick={() => { blocked.current = false; void flush() }}>Erneut speichern</Button><Button variant="ghost" disabled={busy} onClick={() => void load(data.page, true)}>Neu laden</Button></div> : null}
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <Reorder.Group as="ol" axis="y" values={tasks.map((task) => task.id)} onReorder={(ids) => update(ids.map((id) => draft.current.find((task) => task.id === id)!))} className="flex flex-col gap-2" aria-label="Wochenaufgaben">
            {tasks.map((task, index) => <PlanningRow key={task.id} task={task} points={12 - index} selected={moving === task.id}
              onPoint={() => moving ? move(moving, index) : setMoving(task.id)}
              onMove={(direction) => move(task.id, index + direction)}
              onChange={(patch, save) => change(task.id, patch, save)}
              onDrop={() => { setMoving(null); update(draft.current, true) }} />)}
          </Reorder.Group>
        </CardContent>
      </Card>
      <Card className="bg-white/[0.035] text-white">
        <CardHeader><CardTitle className="text-xl font-bold uppercase">Letzte Wochen</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>KW</TableHead><TableHead className="text-right">Punkte</TableHead><TableHead className="text-right">Gesamt</TableHead></TableRow></TableHeader>
            <TableBody>{data.history.length ? data.history.map((row) => <TableRow key={row.week}><TableCell>{planningWeekLabel(row.week)}</TableCell><TableCell className="text-right tabular-nums">{row.score}</TableCell><TableCell className="text-right tabular-nums">{row.total}</TableCell></TableRow>) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Noch keine abgeschlossenen Wochen.</TableCell></TableRow>}</TableBody>
          </Table>
          {data.pageCount > 1 ? <nav aria-label="Wochenhistorie" className="mt-4 flex items-center justify-between gap-2"><Button className="min-h-11" variant="outline" disabled={busy || data.page <= 1} onClick={() => void load(data.page - 1)}>Zurück</Button><span className="text-sm text-muted-foreground">{data.page} / {data.pageCount}</span><Button className="min-h-11" variant="outline" disabled={busy || data.page >= data.pageCount} onClick={() => void load(data.page + 1)}>Weiter</Button></nav> : null}
        </CardContent>
      </Card>
    </div>
  )
}

function PlanningRow({ task, points, selected, onPoint, onMove, onChange, onDrop }: {
  task: PlanningTask; points: number; selected: boolean
  onPoint: () => void; onMove: (direction: number) => void
  onChange: (patch: Partial<PlanningTask>, save?: boolean) => void; onDrop: () => void
}) {
  const controls = useDragControls()
  const reducedMotion = useReducedMotion()
  const dragged = useRef(false)
  const swipe = useRef<{ x: number; y: number; active: boolean } | null>(null)
  const [offset, setOffset] = useState(0)
  const suppressClick = useRef(false)
  const status = (value: PlanningTask["status"]) => {
    if (task.title.trim()) onChange({ status: task.status === value ? "open" : value })
  }

  return (
    <Reorder.Item value={task.id} dragListener={false} dragControls={controls} data-task-id={task.id} data-points={points} data-status={task.status}
      className="relative" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px #0008" }}
      onDragStart={() => { dragged.current = true }} onDragEnd={onDrop}>
      <div className={cn("group relative flex min-h-12 items-center rounded-lg border border-white/10 bg-white/[0.025] transition-colors", selected && "ring-2 ring-primary", task.status === "done" && "border-primary/20 bg-primary/10", task.status === "missed" && "border-destructive/20 bg-destructive/10")}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDownCapture={(event) => {
          suppressClick.current = false
          if ((event.pointerType !== "touch" && window.matchMedia("(min-width: 640px)").matches) || (event.target instanceof HTMLInputElement && document.activeElement === event.target) || (event.target as HTMLElement).closest("button")) return
          swipe.current = { x: event.clientX, y: event.clientY, active: false }
        }}
        onPointerMoveCapture={(event) => {
          const start = swipe.current
          if (!start) return
          const x = event.clientX - start.x, y = event.clientY - start.y
          if (!start.active && Math.abs(y) > 12 && Math.abs(y) > Math.abs(x)) { swipe.current = null; return }
          if (Math.abs(x) > 16 && Math.abs(x) > Math.abs(y) * 1.5) {
            start.active = true
            event.currentTarget.setPointerCapture(event.pointerId)
            setOffset(Math.max(-80, Math.min(80, x)))
          }
        }}
        onPointerUpCapture={(event) => {
          const start = swipe.current
          if (start?.active) {
            suppressClick.current = true
            if (document.activeElement instanceof HTMLInputElement) document.activeElement.blur()
            const distance = event.clientX - start.x
            if (Math.abs(distance) >= 55) status(distance > 0 ? "done" : "missed")
            event.preventDefault()
          }
          swipe.current = null
          setOffset(0)
        }}
        onPointerCancel={() => { swipe.current = null; setOffset(0) }}
        onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}>
        <button type="button" className="flex min-h-12 w-12 shrink-0 touch-none cursor-grab items-center justify-center rounded-md text-xl font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing" aria-label={`${points} Punkte, Aufgabe verschieben`} aria-pressed={selected}
          onPointerDown={(event) => { dragged.current = false; if (event.pointerType === "mouse" && event.button === 0 && window.matchMedia("(min-width: 640px)").matches) controls.start(event) }}
          onClick={() => { if (!dragged.current) onPoint() }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); onMove(event.key === "ArrowUp" ? -1 : 1) }
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); status(event.key === "ArrowRight" ? "done" : "missed") }
          }}>{points}</button>
        <input type="text" aria-label={`Aufgabe mit ${points} Punkten`} maxLength={100} value={task.title} placeholder="Aufgabe …"
          className={cn("h-12 min-w-0 flex-1 touch-pan-y rounded-md bg-transparent px-2 py-2 text-base leading-6 outline-none placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary", task.status !== "open" && "text-muted-foreground", task.status === "done" && "line-through decoration-primary/40")}
          onChange={(event) => onChange({ title: event.target.value }, false)}
          onBlur={(event) => onChange({ title: event.target.value.trim(), status: event.target.value.trim() ? task.status : "open" })}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.blur() } }} />
        <div className="hidden shrink-0 pr-1 sm:flex">
          <Button variant="ghost" size="icon" className="size-11" aria-label={`${task.title || "Aufgabe"}: erledigt`} aria-pressed={task.status === "done"} disabled={!task.title.trim()} onClick={() => status("done")}><Check /></Button>
          <Button variant="ghost" size="icon" className="size-11" aria-label={`${task.title || "Aufgabe"}: nicht erledigt`} aria-pressed={task.status === "missed"} disabled={!task.title.trim()} onClick={() => status("missed")}><X /></Button>
        </div>
        <span className="flex w-8 shrink-0 justify-center sm:hidden" aria-label={task.status === "done" ? "Erledigt" : task.status === "missed" ? "Nicht erledigt" : "Unbewertet"}>{task.status === "done" ? <Check className="size-4 text-primary" /> : task.status === "missed" ? <X className="size-4 text-destructive" /> : null}</span>
        {task.status !== "open" && <span aria-hidden="true" className={cn(comic.className, "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 select-none text-4xl tracking-wider opacity-90 transition-opacity [text-shadow:2px_2px_0_#000] group-has-[input:focus]:opacity-20", task.status === "done" ? "text-primary" : "text-red-500")}>{task.status === "done" ? "DONE" : "FAILED"}</span>}
      </div>
    </Reorder.Item>
  )
}
