import Image from "next/image"
import Link from "next/link"
import {Mail, Menu, Users} from "lucide-react"
import {contact} from "@/lib/profile-data"

export default function HeroSection() {
  return (
    <section className="relative min-h-svh overflow-hidden bg-black text-white">
      <Image
        src="/image/mike.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none origin-bottom scale-110 object-contain object-bottom opacity-100 brightness-125 motion-preset-blur-right motion-duration-1000 sm:scale-100 sm:object-center sm:brightness-100"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,transparent_38%,rgba(0,0,0,0.36)_78%),linear-gradient(to_bottom,rgba(0,0,0,0.1),transparent_34%,rgba(0,0,0,0.68)),linear-gradient(to_right,rgba(0,0,0,0.56),transparent_34%,rgba(0,0,0,0.56))]"/>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <Link
          href="/"
          className="pointer-events-auto inline-flex min-h-11 items-center text-sm font-semibold uppercase leading-none tracking-[0.2em] text-white/82 transition-colors hover:text-white"
        >
          Michael Repolusk
        </Link>
        <div className="pointer-events-auto flex items-center gap-2">
          <details className="group relative">
            <summary
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/78 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-50 sm:size-12 [&::-webkit-details-marker]:hidden"
              aria-label="Menü öffnen"
            >
              <Menu className="size-5" aria-hidden="true"/>
            </summary>
            <nav
              className="absolute right-0 mt-3 min-w-44 rounded-2xl border border-white/12 bg-black/70 p-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/64 shadow-2xl shadow-black/50 backdrop-blur-xl">
              {[
                ["Vision", "#vision"],
                ["Eliminierung", "#eliminierung"],
                ["Angebot", "#angebot"],
                ["Projekte", "#projekte"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="block rounded-xl px-3 py-2 transition-colors hover:bg-white/10 hover:text-cyan-50"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </details>
          <Link
            href={contact.bookingPath}
            className="inline-flex h-11 w-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#45C456] px-0 text-xs font-black uppercase tracking-[0.14em] text-black shadow-2xl shadow-black/40 transition-all hover:-translate-y-0.5 hover:bg-[#56d867] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45C456]/50 sm:w-auto sm:px-5"
          >
            <Users className="size-5" aria-hidden="true"/>
            <span className="hidden sm:inline">30min Meeting</span>
          </Link>
          <Link
            href={`mailto:${contact.email}`}
            className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-full bg-white px-0 text-xs font-black uppercase tracking-[0.16em] text-black shadow-2xl shadow-black/40 transition-all hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto sm:px-5"
          >
            <Mail className="size-5" aria-hidden="true"/>
            <span className="hidden sm:inline">Kontaktieren</span>
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 z-20 mx-auto flex w-full max-w-7xl flex-col items-center gap-7 px-5 text-center sm:bottom-10">
        <div className="motion-preset-slide-up-sm motion-duration-700 flex flex-col items-center gap-4">
          <h1> DIGITAL VISIONARY</h1>
          <p className="max-w-2xl text-sm font-medium leading-6 text-white/62 sm:text-base">
            Ich bin die perfekte Schnittstelle zwischen Mensch und Maschine, darum entwickle ich
            gerade in dem Bereich BIM, KI und Webanwendungen Tools damit beide besser
            zusammenarbeiten können.
          </p>
          <Link
            href={contact.bookingPath}
            className="pointer-events-auto mt-1 inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#45C456] px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-black shadow-2xl shadow-black/40 transition-all hover:-translate-y-0.5 hover:bg-[#56d867] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45C456]/50"
          >
            30min Meeting
          </Link>
        </div>

      </div>
    </section>
  )
}
