import Link from "next/link"

import AreonChurCanvas from "./areonChurCanvas"

const otherProjects = [
  ["Talstation Unterwasser", "BIM Koordination / PL HKLS", "Architektur und Haustechnik"],
  ["Vantage ZRH1", "BIM Koordination / PL Lüftung", "Datacenter"],
  ["The Brick 80", "BIM Koordination / PL Lüftung", "Umnutzung"],
  ["GSK Pharmacenter", "BIM Koordination / Fachbauleitung", "Labor / Pharma"],
] as const

export default function ProjectsSection() {
  return (
    <section id="projekte" className="px-5 py-20 sm:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid gap-8 md:grid-cols-[0.42fr_0.58fr] md:items-end">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/55">
              Projekte
            </p>
            <h2 className="text-4xl font-black uppercase leading-none tracking-[0] sm:text-6xl">
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
              <h3 className="text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-6xl">
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

        <div className="divide-y divide-white/10 border-b border-white/10">
          {otherProjects.map(([name, role, type], index) => (
            <article
              key={name}
              className={[
                "grid gap-4 py-8 sm:grid-cols-[0.16fr_0.5fr_0.34fr] sm:items-end",
                index % 2 === 1 ? "sm:[&>*:nth-child(2)]:order-3 sm:[&>*:nth-child(3)]:order-2" : "",
              ].join(" ")}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/35">
                0{index + 2}
              </p>
              <div>
                <h3 className="text-3xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                  {name}
                </h3>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100/55">
                  {type}
                </p>
              </div>
              <p className="text-base leading-7 text-white/58 sm:text-right">{role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
