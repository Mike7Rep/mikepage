import Link from "next/link"
import { ArrowRight, CalendarDays, Clock3, Mail, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

const meetingMailHref = `mailto:${contact.email}?subject=${encodeURIComponent("30-Minuten-Meeting anfragen")}&body=${encodeURIComponent("Hallo Michael\n\nIch möchte gerne ein 30-Minuten-Meeting buchen.\n\nMögliche Zeitfenster:\n1.\n2.\n3.\n\nKurz zum Thema:\n")}`

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
            Schreib mir kurz dein Thema und zwei bis drei passende Zeitfenster. Die Seite bleibt bewusst schlank: keine Datenbank, kein Formular, keine externe Pflicht.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="uppercase tracking-[0.08em]">
              <Link href={meetingMailHref}>
                <Mail data-icon="inline-start" />
                Meeting anfragen
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href="/kontakt">
                Kontaktseite
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        <div
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
              <h2 className="break-words text-2xl leading-tight font-bold tracking-[0] uppercase sm:text-3xl md:text-4xl">
                Kennenlernen mit Michael
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/65">
                In 30 Minuten klären wir, wo Product Ownership, Webentwicklung, BIM, Revit oder ein kleines digitales Tool dein Projekt schneller und klarer machen kann.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="uppercase tracking-[0.08em]">
            <Link href={meetingMailHref}>
              Terminanfrage senden
              <Mail data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
