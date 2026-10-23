"use client"

import { useRef, useState } from "react"
import { Check, GripVertical, Move, Plus } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { planningScore, planningWeekLabel, type PlanningTask } from "@/lib/planning"
import type { PlanningDashboard } from "@/lib/planning-data"
import { cn } from "@/lib/utils"
import { planningAction } from "../planung/actions"

export function PlanningContent({ initial }: { initial: PlanningDashboard }) {
  const [data, setData] = useState(initial)
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const [message, setMessage] = useState("")
  const [failed, setFailed] = useState(false)
  const [editing, setEditing] = useState<PlanningTask | null>(null)
  const [moving, setMoving] = useState<string | null>(null)
  const drag = useRef<{ id: string; y: number; moved: boolean } | null>(null)
  const [dragTarget, setDragTarget] = useState<number | null>(null)

  async function persist(tasks?: PlanningTask[], page = data.page) {
    if (saving.current) return false
    saving.current = true
    setBusy(true)
    setFailed(false)
    setMessage(tasks ? "Wird gespeichert …" : "Wird geladen …")
    try {
      const result = await planningAction(page, tasks ? { week: data.week, version: data.version, tasks } : undefined)
      if (!result.ok) throw new Error(result.error)
      setData(result.data)
      setMessage(tasks ? "Gespeichert." : "Aktualisiert.")
      return true
    } catch (error) {
      setFailed(true)
      setMessage(error instanceof Error ? error.message : "Verbindung fehlgeschlagen. Bitte erneut versuchen.")
      return false
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  async function move(id: string, target: number) {
    const source = data.tasks.findIndex((task) => task.id === id)
    setMoving(null)
    if (source < 0 || source === target || target < 0 || target > 10) return
    const tasks = [...data.tasks]
    const [task] = tasks.splice(source, 1)
    tasks.splice(target, 0, task)
    await persist(tasks)
  }

  const assigned = data.tasks.reduce((sum, task, i) => sum + (task.title ? 12 - i : 0), 0)
  const chart = data.chart.map((row) => ({ ...row, label: planningWeekLabel(row.week) }))
  const editingIndex = data.tasks.findIndex((task) => task.id === editing?.id)

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-2"><CardTitle className="text-xl font-bold uppercase">Planung</CardTitle><CardDescription>{planningWeekLabel(data.week)} · {assigned}/77 Punkte verteilt</CardDescription></div>
            <span className="text-2xl font-semibold tabular-nums">{planningScore(data.tasks, false)}<span className="ml-1 text-sm text-muted-foreground">Punkte</span></span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">Antippen zum Bearbeiten. Am Griff ziehen oder mit „Verschieben“ einen Zielplatz antippen. Oben zählt mehr.</p>
          <p className="text-sm leading-6 text-muted-foreground">{data.sunday ? "Heute bewerten: erledigt = Punkte, nicht erledigt = 0. Unbewertet = −1 ab Montag." : "Am Sonntag bewerten. Unbewertete Aufgaben kosten ab Montag je 1 Punkt."} Nicht erledigte Aufgaben kommen nächste Woche wieder. Leere Plätze kosten nichts.</p>
          <div aria-live="polite" className={cn("min-h-6 text-sm", failed ? "text-destructive" : "text-muted-foreground")}>
            {moving ? "Zielplatz antippen oder mit den Pfeiltasten verschieben." : message}
          </div>
          {moving ? <Button variant="outline" onClick={() => setMoving(null)}>Verschieben abbrechen</Button> : null}
          {failed ? <Button variant="outline" disabled={busy} onClick={() => void persist()}>Aktuellen Stand neu laden</Button> : null}
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <ol className="flex flex-col gap-2" aria-label="Aufgaben nach Punkten">
            {data.tasks.map((task, index) => (
              <li key={task.id} data-planning-slot={index} className={cn("flex min-h-20 items-stretch gap-1 rounded-lg border border-white/10", (moving === task.id || dragTarget === index) && "ring-2 ring-primary")}
                style={{ background: `color-mix(in oklch, var(--primary) ${18 - index}%, black)` }}>
                <Button variant="ghost" className="h-auto min-h-20 w-11 shrink-0 touch-none cursor-grab" aria-label={`${task.title || "Leerer Platz"} ziehen oder verschieben`} disabled={busy}
                  onClick={(event) => { if (event.detail === 0 || !drag.current?.moved) setMoving(moving === task.id ? null : task.id) }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); void move(task.id, index + (event.key === "ArrowUp" ? -1 : 1)) }
                    if (event.key === "Escape") setMoving(null)
                  }}
                  onPointerDown={(event) => { if (event.button !== 0) return; drag.current = { id: task.id, y: event.clientY, moved: false }; event.currentTarget.setPointerCapture(event.pointerId) }}
                  onPointerMove={(event) => {
                    if (!drag.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return
                    if (Math.abs(event.clientY - drag.current.y) > 6) drag.current.moved = true
                    if (!drag.current.moved) return
                    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-planning-slot]")
                    setDragTarget(target ? Number(target.dataset.planningSlot) : null)
                    if (event.clientY > window.innerHeight - 70) window.scrollBy(0, 14)
                    if (event.clientY < 70) window.scrollBy(0, -14)
                  }}
                  onPointerUp={(event) => {
                    const current = drag.current
                    if (current?.moved) {
                      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-planning-slot]")
                      if (target) void move(current.id, Number(target.dataset.planningSlot))
                    }
                    setDragTarget(null)
                  }}
                  onPointerCancel={() => { drag.current = null; setDragTarget(null) }}>
                  <GripVertical />
                </Button>
                <button type="button" disabled={busy} className="flex min-h-20 min-w-0 flex-1 items-center gap-3 rounded-md pr-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50" onClick={() => moving ? void move(moving, index) : setEditing({ ...task })}>
                  <span className="w-8 shrink-0 text-center text-2xl font-bold tabular-nums text-primary">{12 - index}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1 py-3"><span className={cn("break-words text-sm font-medium sm:text-base", !task.title && "text-muted-foreground")}>{task.title || "Aufgabe hinzufügen"}</span>{task.title ? <span className="text-xs text-muted-foreground">{task.status === "done" ? "Erledigt" : task.status === "missed" ? "Nicht erledigt" : "Noch unbewertet"}</span> : null}</span>
                  {task.status === "done" ? <Check className="size-5 shrink-0 text-primary" /> : !task.title ? <Plus className="size-4 shrink-0 text-muted-foreground" /> : null}
                </button>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.035] text-white">
        <CardHeader><CardTitle className="text-xl font-bold uppercase">Letzte Wochen</CardTitle><CardDescription>Gesamt = aufaddierte Wochenpunkte</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>KW</TableHead><TableHead className="text-right">Punkte</TableHead><TableHead className="text-right">Gesamt</TableHead></TableRow></TableHeader>
            <TableBody>{data.history.length ? data.history.map((row) => <TableRow key={row.week}><TableCell>{planningWeekLabel(row.week)}</TableCell><TableCell className="text-right tabular-nums">{row.score}</TableCell><TableCell className="text-right tabular-nums">{row.total}</TableCell></TableRow>) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Noch keine abgeschlossenen Wochen.</TableCell></TableRow>}</TableBody>
          </Table>
          <nav aria-label="Wochenhistorie" className="mt-4 flex items-center justify-between gap-2"><Button className="min-h-11" variant="outline" disabled={busy || data.page <= 1} onClick={() => void persist(undefined, data.page - 1)}>Zurück</Button><span className="text-sm text-muted-foreground">{data.page} / {data.pageCount}</span><Button className="min-h-11" variant="outline" disabled={busy || data.page >= data.pageCount} onClick={() => void persist(undefined, data.page + 1)}>Weiter</Button></nav>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open && !busy) setEditing(null) }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-black text-white sm:max-w-md">
          <DialogHeader><DialogTitle>Aufgabe · {12 - editingIndex} Punkte</DialogTitle><DialogDescription>Die Position bestimmt deine Punkte. Du kannst die Aufgabe während der Woche ändern.</DialogDescription></DialogHeader>
          {editing ? <form className="flex flex-col gap-5" onSubmit={async (event) => { event.preventDefault(); if (await persist(data.tasks.map((task) => task.id === editing.id ? editing : task))) setEditing(null) }}>
            <FieldGroup><Field><FieldLabel htmlFor="planning-title">Deine Aufgabe</FieldLabel><Input id="planning-title" autoFocus maxLength={200} value={editing.title} disabled={busy} placeholder="Was möchtest du diese Woche schaffen?" onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></Field>
              <Field><FieldLabel>Bewertung am Sonntag</FieldLabel><ToggleGroup type="single" variant="outline" value={editing.status} disabled={busy || !data.sunday || !editing.title.trim()} onValueChange={(status) => { if (status) setEditing({ ...editing, status: status as PlanningTask["status"] }) }} className="w-full flex-wrap"><ToggleGroupItem className="min-h-11 flex-1" value="open">Offen</ToggleGroupItem><ToggleGroupItem className="min-h-11 flex-1" value="done">Erledigt</ToggleGroupItem><ToggleGroupItem className="min-h-11 flex-1" value="missed">Nicht erledigt</ToggleGroupItem></ToggleGroup></Field>
            </FieldGroup>
            {failed ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
            <div className="flex gap-2"><Button type="button" variant="outline" className="min-h-11 flex-1" disabled={busy} onClick={async () => { if (await persist(data.tasks.map((task) => task.id === editing.id ? editing : task))) { setMoving(editing.id); setEditing(null) } }}><Move />Verschieben</Button></div>
            <DialogFooter><Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Abbrechen</Button><Button type="submit" className="min-h-11" disabled={busy}>{busy ? "Speichert …" : "Speichern"}</Button></DialogFooter>
            <p className="text-xs text-muted-foreground">Zum Leeren den Aufgabentext entfernen und speichern.</p>
          </form> : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
