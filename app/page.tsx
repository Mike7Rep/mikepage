import Image from "next/image"
import Link from "next/link"

import Footer from "./Footer"
import HeroSection from "./HeroSection"
import { contact } from "@/lib/profile-data"

const services = [
  ["Revit Profi", "saubere Modelle, Familien, Templates"],
  ["BIM Spezialist", "Koordination, Struktur, Modellqualität"],
  ["3D Modellierer Haustechnik", "HKLS sichtbar und prüfbar machen"],
] as const

const skills = [
  "Revit",
  "BIM",
  "HKLS",
  "realBIM",
  "Three.js",
  "Next.js",
  "Product Owner",
  "UX",
] as const

const projects = [
  ["AREON Chur", "BIM Koordination", "Eventhalle"],
  ["Talstation Unterwasser", "BIM Koordination / PL HKLS", "Architektur und Haustechnik"],
  ["Vantage ZRH1", "BIM Koordination / PL Lüftung", "Datacenter"],
  ["The Brick 80", "BIM Koordination / PL Lüftung", "Umnutzung"],
  ["GSK Pharmacenter", "BIM Koordination / Fachbauleitung", "Labor / Pharma"],
] as const

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <HeroSection />

      <section id="vision" className="relative isolate overflow-hidden px-5 py-24 sm:px-8 md:py-36">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-200/30 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[0.82fr_1.18fr] md:items-end">
          <div className="flex min-h-[48vh] flex-col justify-end gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/55">
              Vision
            </p>
            <h2 className="max-w-3xl text-5xl font-black uppercase leading-[0.92] tracking-[0] text-white sm:text-7xl md:text-8xl">
              Modelle entwickeln muss wieder Spass machen.
            </h2>
          </div>
          <div className="max-w-xl justify-self-end text-lg leading-8 text-white/64">
            Keine Datenkatastrophen. Weniger Reibung. Digitale Planungsphasen,
            die sich wie ein gutes Werkzeug anfühlen: direkt, visuell und kontrollierbar.
          </div>
        </div>
      </section>

      <section id="realbim" className="px-5 py-20 sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.82fr_1.18fr] md:items-center">
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/55">
              realBIM
            </p>
            <h2 className="max-w-xl text-4xl font-black uppercase leading-none tracking-[0] text-white sm:text-6xl">
              Vom Plan zum Modell im Browser.
            </h2>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/62">
              <span>PDF Plan</span>
              <span className="text-cyan-200/70">/</span>
              <span>Massstab</span>
              <span className="text-cyan-200/70">/</span>
              <span>Bauteile</span>
              <span className="text-cyan-200/70">/</span>
              <span>Liste</span>
            </div>
            <Link
              href="https://realbim.sirego.ch/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 w-fit rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-50"
            >
              realBIM ansehen
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-2 shadow-2xl shadow-black/50">
            <Image
              src="/image/realbim-homepage.png"
              alt="realBIM Produktoberfläche"
              width={1440}
              height={1000}
              className="aspect-[1.44] w-full rounded-[1.5rem] object-cover object-top"
              priority={false}
            />
          </div>
        </div>
      </section>

      <section id="leistungen" className="px-5 py-20 sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-[0] sm:text-6xl">
              Was ich anbiete.
            </h2>
            <Link
              href={`mailto:${contact.email}`}
              className="w-fit rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition-all hover:bg-cyan-100"
            >
              Kontaktieren
            </Link>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {services.map(([title, description], index) => (
              <div key={title} className="grid gap-4 py-8 md:grid-cols-[0.2fr_0.55fr_0.25fr] md:items-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/45">
                  0{index + 1}
                </p>
                <h3 className="text-3xl font-black uppercase leading-none tracking-[0] text-white sm:text-5xl">
                  {title}
                </h3>
                <p className="text-base leading-7 text-white/58">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="skills" className="px-5 py-20 sm:px-8 md:py-32">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <h2 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-[0] sm:text-6xl">
            Skills als Werkzeugkasten.
          </h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-white/12 bg-white/[0.045] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="projekte" className="px-5 py-20 sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[0.42fr_0.58fr]">
          <div className="md:sticky md:top-24 md:h-fit">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/55">
              Projekte
            </p>
            <h2 className="text-4xl font-black uppercase leading-none tracking-[0] sm:text-6xl">
              Anspruchsvolle Projektwelten.
            </h2>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {projects.map(([name, role, type]) => (
              <article key={name} className="grid gap-4 py-8 sm:grid-cols-[0.58fr_0.42fr] sm:items-end">
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

      <Footer />
    </main>
  )
}
