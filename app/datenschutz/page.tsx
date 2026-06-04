import Link from "next/link"
import { Mail, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

const sections = [
  {
    title: "Verantwortliche Stelle",
    text: `${contact.name}, ${contact.street}, ${contact.city}, Schweiz. Für Datenschutzfragen erreichst du mich per E-Mail unter ${contact.email}.`,
  },
  {
    title: "Zweck der Website",
    text: "Diese Website informiert über berufliche Stationen, Projekte und Kontaktmöglichkeiten. Es gibt kein eigenes Nutzerkonto, kein eigenes Kontaktformular und keine eigene Datenbank für Besucherprofile.",
  },
  {
    title: "Server- und Zugriffsdaten",
    text: "Beim Aufruf einer Website können technisch notwendige Zugriffsdaten wie IP-Adresse, Zeitpunkt, Browserinformationen und angefragte Seiten durch den Hosting-Anbieter verarbeitet werden, um die Website auszuliefern und stabil zu betreiben.",
  },
  {
    title: "Kontakt per E-Mail oder Telefon",
    text: "Wenn du per E-Mail oder Telefon Kontakt aufnimmst, werden die von dir übermittelten Angaben nur zur Bearbeitung deiner Anfrage und für die anschliessende Kommunikation verwendet.",
  },
  {
    title: "Meeting-Buchung mit Zeeg",
    text: "Für die direkte Terminbuchung wird ein Zeeg-Embed geladen. Beim Laden und Nutzen des Kalenders können Daten an Zeeg übermittelt werden. Alternativ ist eine Meeting-Anfrage per E-Mail möglich.",
  },
  {
    title: "Externe Links",
    text: "Diese Website enthält Links zu externen Angeboten, zum Beispiel LinkedIn und Sirego. Beim Öffnen externer Links gelten die Datenschutzbestimmungen der jeweiligen Anbieter.",
  },
  {
    title: "Deine Rechte",
    text: "Du kannst Auskunft, Berichtigung oder Löschung deiner Personendaten verlangen, soweit keine gesetzlichen Aufbewahrungspflichten oder überwiegenden Interessen entgegenstehen.",
  },
]

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-black px-6 pt-36 pb-20 text-white md:px-12">
      <section className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <div className="flex size-12 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-5xl leading-none font-extrabold tracking-[0] uppercase md:text-7xl">
            Datenschutz
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/65">
            Stand: 28. Mai 2026. Diese Erklärung beschreibt die Datenbearbeitung auf dieser schlanken statischen Website.
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

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6 text-sm leading-7 text-white/65 md:p-8">
          <p>
            Orientierung für die Transparenzpflicht bietet der EDÖB, unter anderem zu{" "}
            <a className="text-primary underline-offset-4 hover:underline" href="https://www.edoeb.admin.ch/de/informationspflicht" target="_blank" rel="noreferrer">
              Informationspflichten
            </a>{" "}
            und{" "}
            <a className="text-primary underline-offset-4 hover:underline" href="https://www.edoeb.admin.ch/de/datenschutzerklaerungen-im-internet" target="_blank" rel="noreferrer">
              Datenschutzerklärungen im Internet
            </a>
            .
          </p>
          <p className="mt-4">
            Hinweise zu Zeeg und zur Einbettung des Buchungssystems findest du im{" "}
            <a className="text-primary underline-offset-4 hover:underline" href="https://zeeg.me/de/help/articles/12582767-zeeg-auf-deiner-website-einbetten" target="_blank" rel="noreferrer">
              Zeeg Hilfe-Center
            </a>
            .
          </p>
        </div>

        <div>
          <Button asChild className="uppercase tracking-[0.08em]">
            <Link href={`mailto:${contact.email}`}>
              <Mail data-icon="inline-start" />
              Datenschutzfrage senden
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
