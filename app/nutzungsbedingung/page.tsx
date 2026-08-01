import type { Metadata } from "next"
import Link from "next/link"
import { LockKeyhole, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

export const metadata: Metadata = {
  title: "Nutzungsbedingungen | Michael Repolusk",
  description: "Nutzungsbedingungen für das persönliche Dashboard von Michael Repolusk.",
}

const sections = [
  {
    title: "Persönlicher Geltungsbereich",
    text: "myDashboard ist ein persönliches Single-User-Dashboard von Michael Repolusk. Ausschliesslich Michael Repolusk ist zur Nutzung und Anmeldung berechtigt. Es gibt keine öffentliche Registrierung und keine Möglichkeit für weitere Personen, ein eigenes Dashboard oder Nutzerkonto zu eröffnen.",
  },
  {
    title: "Nicht erlaubte Nutzung",
    text: "Der Zugriff durch andere Personen, die Weitergabe von Zugangsdaten sowie jeder Versuch, Zugriffsbeschränkungen zu umgehen, sind nicht erlaubt. Öffentliche Inhalte der Website bleiben davon unberührt.",
  },
  {
    title: "Google Health API",
    text: "Das persönliche Dashboard greift nach ausdrücklicher Freigabe lesend auf Michael Repolusks eigene Google-Health-Daten zu. Die Daten werden nur für die private Verlaufsdarstellung und persönliche Auswertung verwendet. Umfang, Speicherung, Widerruf und Löschung sind in der Datenschutzerklärung beschrieben.",
  },
  {
    title: "Keine medizinische Beratung",
    text: "Darstellungen, Zielwerte und Auswertungen im Dashboard dienen ausschliesslich der persönlichen Orientierung. Sie ersetzen keine medizinische Untersuchung, Diagnose oder Behandlung durch qualifizierte Fachpersonen.",
  },
  {
    title: "Verfügbarkeit und Änderungen",
    text: "Das Dashboard ist ein privates Projekt. Funktionen, Datenquellen und Darstellungen können jederzeit angepasst oder eingestellt werden. Eine ununterbrochene Verfügbarkeit oder Fehlerfreiheit wird nicht zugesichert.",
  },
  {
    title: "Betreiber",
    text: `${contact.name}, ${contact.street}, ${contact.city}, Schweiz. Fragen zu diesen Nutzungsbedingungen können an ${contact.email} gerichtet werden.`,
  },
]

export default function NutzungsbedingungPage() {
  return (
    <main className="min-h-screen bg-black px-6 pt-36 pb-20 text-white md:px-12">
      <section className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <div className="flex size-12 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-4xl leading-none font-extrabold tracking-[0] uppercase sm:text-5xl">
            Nutzungsbedingungen
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/65">
            Stand: 1. August 2026. Bedingungen für das persönliche myDashboard von Michael Repolusk.
          </p>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border border-white/10 bg-white/[0.035] p-6 md:p-8">
              <h2 className="text-xl font-bold tracking-[0] uppercase">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">{section.text}</p>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="uppercase tracking-[0.08em]">
            <Link href={`mailto:${contact.email}`}>
              <Mail data-icon="inline-start" />
              Frage senden
            </Link>
          </Button>
          <Button asChild variant="outline" className="uppercase tracking-[0.08em]">
            <Link href="/datenschutz">Datenschutz</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
