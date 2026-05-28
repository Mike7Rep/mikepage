import Link from "next/link"
import { CalendarDays, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

export default function ContactCta() {
  return (
    <section className="border-t border-white/10 bg-black px-6 py-16 text-white md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-3xl leading-none font-bold tracking-[0] uppercase md:text-4xl">
            Kurzer Austausch?
          </h2>
          <p className="text-sm leading-6 text-white/60 md:text-base">
            Schreib mir direkt per E-Mail oder buche ein 30-Minuten-Meeting. Die Seite bleibt bewusst schlank und ohne eigene Datenbank.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="uppercase tracking-[0.08em]">
            <Link href={`mailto:${contact.email}`}>
              <Mail data-icon="inline-start" />
              E-Mail schreiben
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
            <Link href={contact.bookingPath}>
              <CalendarDays data-icon="inline-start" />
              Meeting buchen
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
