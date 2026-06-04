import Link from "next/link"
import { CalendarDays, Clock3, Mail, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"
import ZeegEmbed from "./ZeegEmbed"

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
            Wähle direkt einen Termin im Kalender oder schreib mir kurz dein Thema und zwei bis drei passende Zeitfenster per E-Mail.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="uppercase tracking-[0.08em]">
              <Link href="#zeeg-meeting">
                <CalendarDays data-icon="inline-start" />
                Termin wählen
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href={meetingMailHref}>
                <Mail data-icon="inline-start" />
                E-Mail schreiben
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
              Anfrage per E-Mail
              <Mail data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <section id="zeeg-meeting" className="scroll-mt-28 rounded-lg border border-white/10 bg-white/[0.035] p-3 md:p-6">
          <div className="mb-4 flex flex-col gap-3">
            <div>
              <h2 className="text-2xl leading-tight font-bold tracking-[0] uppercase md:text-4xl">
                Direkt Termin wählen
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Der Kalender wird über Zeeg geladen. Falls der Embed blockiert wird, nutze einfach die E-Mail-Anfrage.
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-white/10 bg-white">
            <ZeegEmbed />
          </div>
        </section>
      </section>
    </main>
  )
}
