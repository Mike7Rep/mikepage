"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Star, Pause, Play } from "lucide-react"

import type { ReviewSummary } from "@/lib/site-reviews"

function Stars({ value }: { value: number }) {
  return <span className="inline-flex gap-1" aria-label={`${value.toFixed(1)} von 6 Sternen`}>{Array.from({ length: 6 }, (_, i) => <span key={i} className="relative"><Star className="size-5 text-white/20" aria-hidden="true"/><span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.min(1, Math.max(0, value - i)) * 100}%` }}><Star className="size-5 fill-primary text-primary" aria-hidden="true"/></span></span>)}</span>
}
export default function SiteFeedback({ summary, formUrl, unavailable = false }: { summary: ReviewSummary; formUrl: string; unavailable?: boolean }) {
  const [counts, setCounts] = useState<{ visitors: number; cv: number; cta: number } | null>(null)
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const carousel = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const controller = new AbortController()
    const update = () => fetch('/api/site-stats', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(setCounts).catch(() => {})
    // Let the initial visit registration complete before reading the totals.
    const first = setTimeout(update, 750)
    const interval = setInterval(update, 30000)
    return () => { controller.abort(); clearTimeout(first); clearInterval(interval) }
  }, [])
  const { average, count, recommendation, reviews } = summary
  useEffect(() => {
    const list = carousel.current
    if (!list || reviews.length < 2 || autoplayPaused) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false, hovering = false, pauseUntil = 0
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: .3 })
    observer.observe(list)
    const enter = (event: PointerEvent) => { if (event.pointerType === 'mouse') hovering = true }
    const leave = () => { hovering = false }
    const interact = () => { pauseUntil = Date.now() + 8000 }
    list.addEventListener('pointerenter', enter); list.addEventListener('pointerleave', leave); list.addEventListener('pointerdown', interact)
    const timer = setInterval(() => {
      if (!visible || document.hidden || hovering || motion.matches || Date.now() < pauseUntil || list.matches(':focus-within') || list.querySelector('details[open]')) return
      const end = list.scrollWidth - list.clientWidth
      if (end <= 1) return
      const step = (list.firstElementChild?.getBoundingClientRect().width ?? list.clientWidth) + 32
      list.scrollTo({ left: list.scrollLeft >= end - 2 ? 0 : Math.min(end, list.scrollLeft + step), behavior: 'smooth' })
    }, 4000)
    return () => { observer.disconnect(); clearInterval(timer); list.removeEventListener('pointerenter', enter); list.removeEventListener('pointerleave', leave); list.removeEventListener('pointerdown', interact) }
  }, [reviews.length, autoplayPaused])
  return <section aria-label="Besuche und Bewertungen" className="public-theme mx-auto max-w-7xl px-5 pb-16 sm:px-8">
    <div className="grid grid-cols-3 gap-3 border-y border-white/15 py-8 text-center">
      {[["Besucher", counts?.visitors], ["CV-Besucher", counts?.cv], ["Kontaktklicks", counts?.cta]].map(([label, value]) => <div key={label}><div className="text-2xl font-semibold tabular-nums text-primary sm:text-4xl">{typeof value === 'number' ? value.toLocaleString('de-CH') : '—'}</div><div className="mt-2 text-xs text-white/55 sm:text-sm">{label}</div></div>)}
    </div>
    <div className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Bewertungen</h2>
        <a href={formUrl} target="_blank" rel="noreferrer" className="email-cta">Bewertung abgeben</a>
      </div>
      <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-4 text-center sm:gap-12">
        <div>
          <div className="flex h-20 flex-col items-center justify-center gap-2">
            <strong className="text-3xl leading-none tabular-nums">{average === null ? '—' : average.toLocaleString('de-CH', { maximumFractionDigits: 1 })}<span className="text-sm font-normal text-white/50"> / 6</span></strong>
            <div className="flex [&_svg]:size-4 sm:[&_svg]:size-5"><Stars value={average ?? 0}/></div>
          </div>
          <p className="mt-3 text-xs text-white/55 sm:text-sm">{unavailable ? 'Bewertungen momentan nicht verfügbar' : count ? `${count} Bewertungen` : 'Noch keine Bewertungen'}</p>
        </div>
        <div>
          <div className="flex h-20 items-center justify-center"><strong className="text-5xl leading-none tabular-nums text-primary min-[375px]:text-6xl sm:text-7xl">{recommendation === null ? '—' : String(recommendation).padStart(2, '0')}<span className="ml-1">%</span></strong></div>
          <p className="mt-3 text-xs text-white/55 sm:text-sm">Weiterempfehlung</p>
        </div>
      </div>
      {reviews.length > 0 ? <div className="relative mt-8">
        <ul ref={carousel} tabIndex={0} aria-label="Einzelne Bewertungen" className="flex [contain:layout_paint] snap-x snap-mandatory gap-8 overflow-x-auto py-3 [scrollbar-width:none]">{reviews.map((r, i) => <li key={i} className="w-full min-w-0 shrink-0 snap-start sm:w-[calc(50%-1rem)]">
          <div className="flex min-h-8 items-center justify-between gap-3"><h3 className="text-xl font-semibold">{r.author}</h3><div className="flex shrink-0 items-center [&_svg]:size-4 sm:[&_svg]:size-5"><Stars value={r.rating}/></div></div>
          {r.company || r.position ? <p className="mt-2 text-sm text-white/60">{[r.position, r.company].filter(Boolean).join(' · ')}</p> : null}
          {r.text ? <details className="group mt-4"><summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden" title={r.text}><span className="line-clamp-3 text-base italic leading-7 text-white/80 group-open:line-clamp-none">„{r.text}“</span><span className="sr-only">Feedback auf- oder zuklappen</span></summary></details> : null}
        </li>)}</ul>
        {reviews.length > 1 ? <div className="mt-4 flex justify-end gap-2">
          <button aria-label={autoplayPaused ? "Bewertungen automatisch abspielen" : "Automatisches Scrollen pausieren"} aria-pressed={autoplayPaused} className="grid size-11 place-items-center rounded-full hover:bg-white/10" onClick={() => setAutoplayPaused(value => !value)}>{autoplayPaused ? <Play className="size-4"/> : <Pause className="size-4"/>}</button>
          <button aria-label="Vorherige Bewertungen" className="grid size-11 place-items-center rounded-full hover:bg-white/10" onClick={() => carousel.current?.scrollBy({ left: -carousel.current.clientWidth, behavior: 'smooth' })}><ChevronLeft/></button>
          <button aria-label="Nächste Bewertungen" className="grid size-11 place-items-center rounded-full hover:bg-white/10" onClick={() => carousel.current?.scrollBy({ left: carousel.current.clientWidth, behavior: 'smooth' })}><ChevronRight/></button>
        </div> : null}
      </div> : null}
    </div>
  </section>
}
