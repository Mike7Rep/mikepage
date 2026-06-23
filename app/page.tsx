import Image from "next/image"
import Link from "next/link"

import Footer from "./Footer"
import HeroSection from "./HeroSection"
import ProjectsSection from "@/components/projects/projectsSection"
import { contact } from "@/lib/profile-data"

const services = [
  {
    title: "Produktentwicklung Fullstack",
    description:
      "Next.js, Postgres, Redis und Three.js: von Problemverständnis und UX bis zu produktiven Web-Tools für Bauprozesse.",
    meta: "Product Owner / UX / Fullstack",
  },
  {
    title: "Revit Profi",
    description:
      "Schnelle, saubere 3D-Modelle für Ausführung und Vorfabrikation: Familien, Templates, Modellstruktur und belastbare Planableitung.",
    meta: "Revit / Familien / Vorfabrikation",
  },
  {
    title: "BIM Spezialist",
    description:
      "High-Performance-Familien, stabile Modelle und Prozessoptimierung für Koordination, Qualität und weniger Datenchaos.",
    meta: "BIM / Prozesse / Modellqualität",
  },
] as const

const products = [
  {
    title: "realBIM",
    description:
      "Ein Browser-Tool für frühe Planungsphasen: PDF-Pläne kalibrieren, Bauteile platzieren, Modelle prüfen und Ergebnisse verständlich exportieren.",
    meta: "Plan / Modell / Bauteilliste",
    href: "https://realbim.sirego.ch/",
    action: "realBIM ansehen",
  },
  {
    title: "Sirego CRM",
    description:
      "Ein operatives KMU-Werkzeug für Aufträge, Zeiten, Lohn und Finanzen, damit tägliche Arbeit ohne Excel- und Word-Umwege läuft.",
    meta: "Aufträge / Zeit / Finanzen",
    href: "https://crm.sirego.ch",
    action: "CRM ansehen",
  },
  {
    title: "Sirego Firmenpage / Tooling",
    description:
      "Produktkommunikation und kleine digitale Werkzeuge rund um Revit, BIM, Gebäudetechnik und schnelle Konzeptarbeit.",
    meta: "Sirego / Angebote / Automationen",
    href: "https://www.sirego.ch",
    action: "Sirego ansehen",
  },
] as const

type QuoteItem = {
  author?: string
  quote: string
}

const quoteGroups = [
  [
    {
      quote: "Eliminierung ist die beste Optimierung.",
    },
  ],
  [
    {
      quote: "Ich will nicht wissen, wie es nicht funktioniert, sondern was das beste Ergebnis wäre.",
    },
  ],
  [
    {
      quote:
        "Probleme können nicht mit der gleichen Denkweise gelöst werden, durch die sie entstanden sind.",
      author: "A. E.",
    },
    {
      quote: "Wenn ich 8h Zeit hätte, einen Baum zu fällen, würde ich 6h die Säge schärfen.",
      author: "A. L.",
    },
    {
      quote: "Mit 20% Aufwand kann man bereits 80% des Ergebnisses erreichen.",
      author: "V. P.",
    },
  ],
] satisfies readonly QuoteItem[][]

function QuoteDivider({ quotes }: { quotes: readonly QuoteItem[] }) {
  return (
    <section className="px-5 py-10 sm:px-8 md:py-16">
      <div className="mx-auto max-w-7xl border-y border-white/10 py-10">
        <div className="grid gap-7">
          {quotes.map(({ quote, author }) => (
            <blockquote key={quote} className="max-w-4xl">
              <p className="text-2xl font-semibold leading-tight tracking-[0] text-white sm:text-3xl">
                &quot;{quote}&quot;
              </p>
              {author ? (
                <cite className="mt-4 block text-xs font-semibold not-italic uppercase tracking-[0.18em] text-white/45">
                  {author}
                </cite>
              ) : null}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <HeroSection />

      <section id="vision" className="relative isolate overflow-hidden px-5 py-20 sm:px-8 md:py-28">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-200/30 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.52fr_0.48fr] md:items-center md:gap-14">
          <div className="flex flex-col gap-6">
            <h2 className="max-w-4xl text-4xl font-black uppercase leading-[0.98] tracking-[0] text-white sm:text-5xl">
              Die besten Lösungen entstehen zwischen KI und Mensch.
            </h2>
            <p className="max-w-xl text-base leading-7 text-white/64 md:text-lg md:leading-8">
              Ich entwickle digitale Werkzeuge, die KI und Menschen sinnvoll verbinden. KI
              übernimmt Routinearbeit und erstellt erste Entwürfe. Der Mensch bringt Kreativität,
              Fachwissen und den Feinschliff ein. So entstehen bessere Lösungen, mehr Produktivität
              und mehr Freude an der Arbeit.
            </p>
          </div>
          <Image
            src="/image/ki-mensch-software.png"
            alt="Menschliche Hand mit Hammer und KI-Hand als Symbol für Zusammenarbeit."
            width={1536}
            height={1024}
            sizes="(min-width: 768px) 42vw, 100vw"
            className="vision-image-reveal aspect-[3/2] w-full rounded-md object-cover"
          />
        </div>
      </section>

      <QuoteDivider quotes={quoteGroups[0]} />

      <section id="leistungen" className="px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-[0] sm:text-5xl">
                Was ich für digitale Bauprozesse anbiete.
              </h2>
            </div>
            <Link
              href={`mailto:${contact.email}`}
              className="w-fit rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-black shadow-2xl shadow-black/30 transition-all hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Kontaktieren
            </Link>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {services.map(({ title, description, meta }, index) => (
              <article
                key={title}
                className="grid min-w-0 gap-4 py-8 md:grid-cols-[0.14fr_0.43fr_0.43fr] md:items-center"
              >
                <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
                  0{index + 1}
                </p>
                <div className="min-w-0">
                  <h3 className="break-words text-3xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                    {title}
                  </h3>
                  <p className="mt-3 break-words text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/50">
                    {meta}
                  </p>
                </div>
                <p className="min-w-0 break-words text-base leading-7 text-white/60">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <QuoteDivider quotes={quoteGroups[1]} />

      <section id="produkte" className="px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-6 md:grid-cols-[0.58fr_0.42fr] md:items-end">
            <div>
              <h2 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-[0] sm:text-5xl">
                Produkte, die aus echten Bauproblemen entstehen.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60 md:justify-self-end md:text-right">
              Ich entwickle digitale Lösungen nicht nur theoretisch. Ich baue sie selbst, teste sie an
              realen Workflows und denke sie wie ein Product Owner weiter.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {products.map(({ title, description, meta, href, action }) => (
              <article
                key={title}
                className="flex min-h-72 min-w-0 flex-col justify-between rounded-lg border border-white/10 bg-white/[0.035] p-6"
              >
                <div>
                  <p className="mb-5 break-words text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/45">
                    {meta}
                  </p>
                  <h3 className="break-words text-3xl font-black uppercase leading-none tracking-[0] text-white">
                    {title}
                  </h3>
                  <p className="mt-5 break-words text-base leading-7 text-white/58">{description}</p>
                </div>
                <Link
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 w-fit rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-black shadow-2xl shadow-black/30 transition-all hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  {action}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <QuoteDivider quotes={quoteGroups[2]} />

      <ProjectsSection />

      <Footer />
    </main>
  )
}
