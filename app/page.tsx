import Image from "next/image"

import Footer from "./Footer"
import HeroSection from "./HeroSection"
import OfferCarousel from "@/components/offer-carousel"
import ProjectsSection from "@/components/projects/projectsSection"

type QuoteItem = {
  author?: string
  quote: string
}

const quoteGroups = [
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
        <div className="mx-auto max-w-7xl">
          <div className="relative isolate flex min-h-[640px] overflow-hidden border-y border-white/10 md:aspect-video md:min-h-0">
            <div className="vision-image-reveal pointer-events-none absolute inset-y-0 right-0 z-0 w-full opacity-35 md:w-[58%] md:opacity-50">
              <Image
                src="/image/ki-mensch-software.png"
                alt="Menschliche Hand und KI-Hand als Symbol für Synergie."
                fill
                loading="eager"
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover object-center md:object-contain md:object-right"
              />
            </div>
            <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.16),rgba(0,0,0,0.68))] md:bg-[linear-gradient(to_right,#000_0%,#000_47%,rgba(0,0,0,0.74)_64%,rgba(0,0,0,0.28)_100%)]" />
            <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_78%_50%,transparent_0,rgba(0,0,0,0.28)_48%,#000_100%)]" />

            <div className="relative z-10 flex max-w-4xl flex-col justify-center gap-6 py-14 md:max-w-3xl md:px-10 lg:px-14">
              <h2 className="text-3xl font-black uppercase leading-none tracking-[0] text-white sm:text-4xl md:whitespace-nowrap lg:text-5xl">
                Mensch und KI - eine perfekte Synergie
              </h2>
              <p className="max-w-2xl text-base leading-7 text-white/64 md:text-lg md:leading-8">
                Früher war es das Smartphone heute ist es KI. Wir können nicht mehr ohne und
                richtig eingesetzt können wir uns vermehrt auf das Konzentrieren was Spass macht.
                Darum habe ich die Tools so entwickelt das sie für Menschliche User und KI Agenten
                gleichermassen funktionieren. Das Ergebnis ein geschlossener sich selbst
                optimierender Kreis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="eliminierung" className="relative isolate overflow-hidden px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="relative isolate flex min-h-[640px] overflow-hidden border-y border-white/10 md:aspect-video md:min-h-0">
            <div className="vision-image-reveal pointer-events-none absolute inset-y-0 left-0 z-0 w-full opacity-35 md:w-[58%] md:opacity-50">
              <Image
                src="/image/eliminierung.png"
                alt="Eliminierung von Medienbrüchen als 3D-Visual."
                fill
                loading="eager"
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover object-center md:object-contain md:object-left"
              />
            </div>
            <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.72))] md:bg-[linear-gradient(to_left,#000_0%,#000_47%,rgba(0,0,0,0.74)_64%,rgba(0,0,0,0.24)_100%)]" />
            <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_23%_50%,transparent_0,rgba(0,0,0,0.28)_46%,#000_100%)]" />

            <div className="relative z-10 ml-auto flex w-full max-w-4xl flex-col justify-center gap-6 py-14 md:w-[53%] md:px-10 lg:px-14">
              <h2 className="text-3xl font-black uppercase leading-none tracking-[0] text-white sm:text-4xl lg:text-5xl">
                Die beste Optimierung ist die Eliminierung.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-white/64 md:text-lg md:leading-8">
                Viele Unternehmen lösen Probleme mit zusätzlichen Tools, Dateien und Workarounds.
                Wir verfolgen einen anderen Ansatz: Prozesse vereinfachen, Medienbrüche entfernen
                und unnötige Schritte eliminieren. So entstehen schlankere Abläufe, weniger Fehler
                und deutlich höhere Effizienz.
              </p>
            </div>
          </div>
        </div>
      </section>

      <QuoteDivider quotes={quoteGroups[0]} />

      <section id="angebot" className="px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.38fr_0.62fr] md:items-start md:gap-14">
          <div className="md:sticky md:top-28">
            <h2 className="max-w-xl text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
              Meine Fähigkeiten
            </h2>
          </div>
          <OfferCarousel />
        </div>
      </section>

      <QuoteDivider quotes={quoteGroups[1]} />

      <ProjectsSection />

      <Footer />
    </main>
  )
}
