import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-black px-6 pt-36 pb-20 text-white md:px-12">
      <section className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <h1 className="text-5xl leading-none font-extrabold tracking-[0] uppercase md:text-7xl">
            Impressum
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/65">
            Anbieterkennzeichnung für diese Website.
          </p>
        </div>

        <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div>
            <h2 className="text-xl font-bold tracking-[0] uppercase">{contact.name}</h2>
            <p className="mt-2 text-white/65">{contact.street}</p>
            <p className="text-white/65">{contact.city}</p>
          </div>

          <div className="grid gap-3 text-sm text-white/70">
            <Link className="inline-flex items-center gap-3 transition-colors hover:text-white" href={`mailto:${contact.email}`}>
              <Mail className="size-4 text-primary" aria-hidden="true" />
              {contact.email}
            </Link>
            <Link className="inline-flex items-center gap-3 transition-colors hover:text-white" href={`tel:${contact.phone.replaceAll(" ", "")}`}>
              <Phone className="size-4 text-primary" aria-hidden="true" />
              {contact.phone}
            </Link>
            <span className="inline-flex items-center gap-3">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              Schweiz
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <h2 className="text-xl font-bold tracking-[0] uppercase">Haftung für Inhalte</h2>
          <p className="text-sm leading-7 text-white/65">
            Die Inhalte dieser Website werden mit Sorgfalt erstellt. Für Vollständigkeit, Aktualität und Richtigkeit der Inhalte kann jedoch keine Gewähr übernommen werden. Externe Links führen zu Angeboten Dritter; für deren Inhalte sind die jeweiligen Betreiber verantwortlich.
          </p>
        </div>

        <div>
          <Button asChild className="uppercase tracking-[0.08em]">
            <Link href={`mailto:${contact.email}`}>
              <Mail data-icon="inline-start" />
              Kontakt aufnehmen
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
