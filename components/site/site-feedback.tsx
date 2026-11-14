"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"

type Rating = { initials: string; rating: number }
export default function SiteFeedback({ ratings, formUrl, unavailable = false }: { ratings: Rating[]; formUrl: string | null; unavailable?: boolean }) {
  const [counts, setCounts] = useState<{ visitors: number; cv: number; cta: number } | null>(null)
  const carousel = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const controller = new AbortController()
    const update = () => fetch('/api/site-stats', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(setCounts).catch(() => {})
    // Let the initial visit registration complete before reading the totals.
    const first = setTimeout(update, 750)
    const interval = setInterval(update, 30000)
    return () => { controller.abort(); clearTimeout(first); clearInterval(interval) }
  }, [])
  const average = ratings.length ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : null
  return <section aria-label="Besuche und Bewertungen" className="public-theme mx-auto max-w-7xl px-5 pb-16 sm:px-8">
    <div className="grid grid-cols-3 gap-3 border-y border-white/15 py-8 text-center">
      {[["Besucher", counts?.visitors], ["CV-Besucher", counts?.cv], ["Kontaktklicks", counts?.cta]].map(([label, value]) => <div key={label}><div className="text-2xl font-semibold tabular-nums text-primary sm:text-4xl">{typeof value === 'number' ? value.toLocaleString('de-CH') : '—'}</div><div className="mt-2 text-xs text-white/55 sm:text-sm">{label}</div></div>)}
    </div>
    <div className="py-10 text-center">
      <h2 className="text-xl font-semibold">Bewertungen</h2>
      <div className="mt-4 flex justify-center gap-1" aria-label={average === null ? "Noch keine Bewertungen" : `${average.toFixed(1)} von 6 Sternen`}>
        {Array.from({ length: 6 }, (_, i) => <span key={i} className="relative"><Star className="size-6 text-white/20" aria-hidden="true"/><span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.min(1, Math.max(0, (average ?? 0) - i)) * 100}%` }}><Star className="size-6 fill-primary text-primary" aria-hidden="true"/></span></span>)}
      </div>
      <p className="mt-3 text-sm text-white/60">{unavailable ? "Bewertungen momentan nicht verfügbar" : average === null ? "Noch keine Bewertungen" : `${average.toLocaleString('de-CH', { maximumFractionDigits: 1 })} / 6 · ${ratings.length} Bewertungen`}</p>
      {formUrl ? <a href={formUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-primary underline underline-offset-4">Bewerten</a> : null}
      {ratings.length > 0 ? <div className="relative mt-7 flex items-center gap-2">
        <button aria-label="Vorherige Bewertungen" className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10" onClick={() => carousel.current?.scrollBy({ left: -250, behavior: 'smooth' })}><ChevronLeft/></button>
        <ul ref={carousel} tabIndex={0} aria-label="Einzelne Bewertungen" className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto py-2 [scrollbar-width:none]">{ratings.map((r, i) => <li key={i} className="flex min-w-28 shrink-0 snap-start items-center justify-center gap-3 rounded-lg bg-white/5 px-5 py-4"><span className="font-medium">{r.initials}</span><span className="flex items-center gap-1 text-primary">{r.rating}<Star className="size-3 fill-current" aria-hidden="true"/></span></li>)}</ul>
        <button aria-label="Nächste Bewertungen" className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10" onClick={() => carousel.current?.scrollBy({ left: 250, behavior: 'smooth' })}><ChevronRight/></button>
      </div> : null}
    </div>
  </section>
}
