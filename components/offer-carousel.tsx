import { Mail } from "lucide-react"
import { contact } from "@/lib/profile-data"

const offers = [
  ["BIM Koordination", "Ich führe Fachmodelle zusammen, prüfe Schnittstellen und koordiniere Kollisionen für einen abgestimmten Planungsstand."],
  ["BIM Manager", "Ich strukturiere BIM-Prozesse, definiere Modellanforderungen und begleite die Zusammenarbeit über alle Projektphasen."],
  ["Ausführungsplanung HKLS", "Ich erstelle präzise Modelle und Ausführungspläne für Heizung, Kälte, Lüftung und Sanitär – abgestimmt auf die Montage."],
  ["Aussparungsplanung", "Ich plane und koordiniere Durchbrüche und Aussparungen zwischen Gebäudetechnik, Architektur und Tragwerk."],
  ["Isometrie Erstellung", "Ich erstelle übersichtliche Rohrleitungsisometrien als Grundlage für Vorfertigung, Materialermittlung und Montage."],
  ["Projektleitung HKLS Projekte", "Ich begleite Gebäudetechnikprojekte, koordiniere die Beteiligten und behalte Qualität, Termine und Kosten im Blick."],
]

export default function OfferCarousel() {
  return <div className="grid gap-4">{offers.map(([title, description]) => <article key={title} className="rounded-lg border border-white/10 bg-white/[0.035] p-6 sm:p-8">
    <h3 className="text-2xl font-bold text-white">{title}</h3>
    <p className="mt-3 text-base leading-7 text-white/60">{description}</p>
    <a className="email-cta mt-5" href={`mailto:${contact.email}?subject=${encodeURIComponent("Anfrage "+title)}`} aria-label={`Kontakt: ${title}`}><Mail aria-hidden="true" />Kontakt</a>
  </article>)}</div>
}
