import Link from "next/link"

import {
  AreonChurCanvas,
  TalstationCanvas,
  VantageZrhCanvas,
  Brick80Canvas,
  GskMarburgCanvas,
  TheilerhausCanvas,
} from "./projectCanvases"

export default function ProjectsSection() {
  return (
    <section id="projekte" className="px-5 py-20 sm:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid gap-8 md:grid-cols-[0.42fr_0.58fr] md:items-end">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/55">
              Projekte
            </p>
            <h2 className="text-4xl font-black uppercase leading-none tracking-[0] sm:text-5xl">
              Anspruchsvolle Projektwelten.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/58 md:justify-self-end md:text-right">
            Aus realen Bauprojekten werden digitale Modellwelten: koordiniert,
            prüfbar und so reduziert, dass die Komplexität sichtbar wird.
          </p>
        </div>

        <article className="grid gap-8 border-y border-white/10 py-10 md:grid-cols-[0.58fr_0.42fr] md:items-center md:gap-12">
          <AreonChurCanvas />

          <div className="flex flex-col gap-5 md:pl-4">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
                2023-2025 / BIM Koordinator / Eventhalle
              </p>
              <h3 className="text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                AREON Chur
              </h3>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              BIM-Koordination für eine grosse Eventhalle mit klarer Modellstruktur,
              prüfbaren Fachmodellen und sauberer Abstimmung zwischen Architektur,
              Tragwerk und Gebäudetechnik.
            </p>
            <Link
              href="https://areonchur.ch"
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-50"
            >
              areonchur.ch
            </Link>
          </div>
        </article>

        <article className="grid gap-8 border-b border-white/10 py-10 md:grid-cols-[0.42fr_0.58fr] md:items-center md:gap-12">
          <div className="md:order-2">
            <TalstationCanvas />
          </div>

          <div className="flex flex-col gap-5 md:order-1 md:pr-4">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
                Toggenburg / BIM Koordination / PL HKLS
              </p>
              <h3 className="text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                Talstation Unterwasser
              </h3>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              Neue Talstation der Chäserruggbahn von Herzog &amp; de Meuron: ein
              filigraner Holzbau mit markantem Knick-Dach. Als BIM-Koordinator und
              PL HKLS die Gebäudetechnik sauber modelliert, koordiniert und prüfbar
              gemacht.
            </p>
            <Link
              href="https://www.chaeserrugg.ch/de/geniessen/architektur/bahnhof-unterwasser"
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-50"
            >
              chaeserrugg.ch
            </Link>
          </div>
        </article>

        <article className="grid gap-8 border-b border-white/10 py-10 md:grid-cols-[0.58fr_0.42fr] md:items-center md:gap-12">
          <VantageZrhCanvas />

          <div className="flex flex-col gap-5 md:pl-4">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
                Winterthur / BIM Koordination / PL Lüftung
              </p>
              <h3 className="text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                Vantage ZRH1
              </h3>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              Hochverfügbares Rechenzentrum mit markanter Solarfassade, drei
              Abluftkaminen und dichtem Technikdeck. Als BIM-Koordinator und PL
              Lüftung die komplexe Gebäudetechnik modelliert, koordiniert und
              prüfbar gehalten.
            </p>
            <Link
              href="https://vantage-dc.com/data-center-locations/emea/zurich-i-switzerland/"
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-50"
            >
              vantage-dc.com
            </Link>
          </div>
        </article>

        <article className="grid gap-8 border-b border-white/10 py-10 md:grid-cols-[0.42fr_0.58fr] md:items-center md:gap-12">
          <div className="md:order-2">
            <Brick80Canvas />
          </div>

          <div className="flex flex-col gap-5 md:order-1 md:pr-4">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
                Zürich / BIM Koordination / PL Lüftung
              </p>
              <h3 className="text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                The Brick 80
              </h3>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              Umnutzung eines Bürogebäudes aus den 80ern in 110 Loftwohnungen
              (Züst Gübeli Gambetti) mit markanter Steinfassade, farbiger
              Magenta-Front und Betonkanten. Als BIM-Koordinator und PL Lüftung die
              Gebäudetechnik im Bestand modelliert und koordiniert.
            </p>
            <Link
              href="https://z2g.ch/projekte/umnutzung-buerogebaeude-nordring-zuerich/"
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-50"
            >
              z2g.ch
            </Link>
          </div>
        </article>

        <article className="grid gap-8 border-b border-white/10 py-10 md:grid-cols-[0.58fr_0.42fr] md:items-center md:gap-12">
          <GskMarburgCanvas />

          <div className="flex flex-col gap-5 md:pl-4">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
                Marburg / BIM Koordination / Fachbauleitung
              </p>
              <h3 className="text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                GSK Pharmacenter
              </h3>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              Impfstoff-Produktionscampus mit weissen Produktionshallen, Laboren und
              markanten Abluftkaminen. Als BIM-Koordinator und in der Fachbauleitung
              die anspruchsvolle Pharma-Gebäudetechnik koordiniert und auf der
              Baustelle umgesetzt.
            </p>
            <Link
              href="https://de.gsk.com/de-de/unternehmen/at-a-glance/marburg/"
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-50"
            >
              gsk.com
            </Link>
          </div>
        </article>

        <article
          id="theilerhaus-zug"
          className="grid gap-8 border-b border-white/10 py-10 md:grid-cols-[0.42fr_0.58fr] md:items-center md:gap-12"
        >
          <div className="md:order-2">
            <TheilerhausCanvas />
          </div>

          <div className="flex flex-col gap-5 md:order-1 md:pr-4">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
                Zug / BIM Koordination / Fachbauleitung Lüftung
              </p>
              <h3 className="text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                Theilerhaus Zug
              </h3>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              Umbau eines denkmalgeschützten Gerichtsgebäudes als Pilotprojekt für
              den BIM-Prozess im Kanton Zug. Als Projektleiter Lüftung und
              BIM-Koordinator durfte ich den Umbauprozess in der wunderschönen Stadt
              Zug begleiten.
            </p>
            <Link
              href="https://www.eggenspieler.ch/projekt/theilerhaus-zug/"
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-50"
            >
              eggenspieler.ch
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
