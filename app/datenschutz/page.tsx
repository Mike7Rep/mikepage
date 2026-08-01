import type { Metadata } from "next"
import Link from "next/link"
import { Mail, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

export const metadata: Metadata = {
  title: "Datenschutz | Michael Repolusk",
  description: "Datenschutzerklärung für die Website und das persönliche Google-Health-Dashboard von Michael Repolusk.",
}

const sections = [
  {
    title: "Verantwortliche Stelle",
    text: `${contact.name}, ${contact.street}, ${contact.city}, Schweiz. Für Datenschutzfragen erreichst du mich per E-Mail unter ${contact.email}.`,
  },
  {
    title: "Zweck der Website",
    text: "Diese Website informiert über berufliche Stationen, Projekte und Kontaktmöglichkeiten. Für öffentliche Besucher gibt es kein eigenes Nutzerkonto, kein eigenes Kontaktformular und keine Datenbank für Besucherprofile. Ein separat geschützter Dashboardbereich verarbeitet ausschliesslich persönliche Daten des Betreibers.",
  },
  {
    title: "Persönliches Single-User-Dashboard",
    text: "Das geschützte myDashboard ist ausschliesslich für Michael Repolusk bestimmt. Es gibt keine öffentliche Registrierung, keine Konten für weitere Personen und keine Freigabe der Dashboarddaten an andere Nutzer. Die Anmeldung und alle gespeicherten Verlaufsdaten dienen nur der persönlichen Nutzung durch Michael Repolusk.",
  },
  {
    title: "Zugriff auf Google Health",
    text: "Nach ausdrücklicher OAuth-Freigabe erhält das Dashboard ausschliesslich lesenden Zugriff auf Aktivitäts- und Fitnessdaten, Ernährungsdaten und Schlafdaten. Konkret werden tägliche Schritte, insgesamt verbrannte Kalorien, aufgenommene Kalorien sowie Beginn und Ende von Schlafintervallen abgerufen. Das Dashboard schreibt keine Daten zu Google Health zurück.",
  },
  {
    title: "Verwendung und Speicherung der Health-Daten",
    text: "Die abgerufenen Google-Health-Daten werden nur verwendet, um Michael Repolusks persönliche Gesundheitsverläufe im geschützten Dashboard darzustellen. Sie werden in einer privaten Postgres-Datenbank beim Hosting-Anbieter gespeichert. Das Google-Refresh-Token wird verschlüsselt gespeichert. Der Datenabruf setzt beim jeweils letzten gespeicherten Messpunkt fort; Verlaufsdaten werden spätestens nach einem Jahr automatisch gelöscht.",
  },
  {
    title: "Keine Weitergabe oder Werbung",
    text: "Google-Health-Daten werden nicht verkauft, nicht für Werbung, Bonitätsprüfungen oder Nutzerprofile verwendet und nicht an andere Personen weitergegeben. Technische Infrastruktur-Anbieter verarbeiten Daten nur soweit dies für Hosting, Datenbankbetrieb und die sichere Bereitstellung des persönlichen Dashboards erforderlich ist.",
  },
  {
    title: "Google API Limited Use",
    text: "Die Nutzung und Übertragung von Daten, die über Google APIs empfangen werden, erfolgt in Übereinstimmung mit der Google API Services User Data Policy einschliesslich der Limited-Use-Anforderungen. Die Daten werden ausschliesslich für die sichtbaren persönlichen Funktionen des Dashboards verwendet.",
  },
  {
    title: "Widerruf und Löschung",
    text: "Die Google-Health-Freigabe kann jederzeit in den Sicherheitseinstellungen des Google-Kontos widerrufen werden. Lokal gespeicherte Google-Health-Daten und die gespeicherte Verbindung können auf Anfrage vollständig gelöscht werden. Anfragen sind an die unten genannte E-Mail-Adresse zu richten.",
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
          <h1 className="text-4xl leading-none font-extrabold tracking-[0] uppercase sm:text-5xl">
            Datenschutz
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/65">
            Stand: 1. August 2026. Diese Erklärung beschreibt die Datenbearbeitung auf dieser Website und im geschützten persönlichen Dashboard.
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
            Die verbindlichen Anforderungen für Daten aus Google APIs stehen in der{" "}
            <a className="text-primary underline-offset-4 hover:underline" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
              Google API Services User Data Policy
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
          <div className="flex flex-wrap gap-3">
            <Button asChild className="uppercase tracking-[0.08em]">
              <Link href={`mailto:${contact.email}`}>
                <Mail data-icon="inline-start" />
                Datenschutzfrage senden
              </Link>
            </Button>
            <Button asChild variant="outline" className="uppercase tracking-[0.08em]">
              <Link href="/nutzungsbedingung">Nutzungsbedingungen</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
