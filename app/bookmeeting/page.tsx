//

import Link from "next/link"
import { CalendarDays, Clock3, ExternalLink, Mail, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-black px-6 pt-32 pb-16 text-white md:px-12">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex size-12 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary motion-preset-pop motion-duration-700">
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-4xl leading-none font-extrabold tracking-[0] uppercase md:text-6xl">
            30-Minuten-Meeting buchen
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/65">
            Such dir einen passenden Termin aus. Falls das Buchungssystem blockiert wird, kannst du mir direkt per E-Mail schreiben.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="uppercase tracking-[0.08em]">
              <Link href={`mailto:${contact.email}`}>
                <Mail data-icon="inline-start" />
                E-Mail schreiben
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <a href="https://zeeg.me/michaelrepolusk/30min" target="_blank" rel="noreferrer">
                Termin buchen
                <ExternalLink data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </div>

        <a
          href="https://zeeg.me/michaelrepolusk/30min"
          target="_blank"
          rel="noreferrer"
          className="group grid gap-6 rounded-lg border border-white/10 bg-white/[0.035] p-6 text-white transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/6 md:grid-cols-[1fr_auto] md:items-center md:p-8"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-white/55">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
                <Clock3 className="size-4 text-primary" aria-hidden="true" />
                30 Min
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
                <Video className="size-4 text-primary" aria-hidden="true" />
                Online oder nach Absprache
              </span>
            </div>
            <div>
              <h2 className="text-3xl leading-tight font-bold tracking-[0] uppercase md:text-4xl">
                Kennenlerngespräch mit Michael
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/65">
                In 30 Minuten klären wir, wo BIM, Revit, HLKSE-Planung oder ein kleines digitales Tool dein Projekt schneller und klarer machen kann.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.08em] text-primary-foreground transition-colors group-hover:bg-primary/80">
            Termin bei Zeeg buchen
            <ExternalLink className="size-4" aria-hidden="true" />
          </div>
        </a>
      </section>
    </main>
  )
}
