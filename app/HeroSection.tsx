// app/heroSection.tsx

import Link from "next/link"
import { ArrowRight, CalendarDays, Code2, Layers3, Mail, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

export default function HeroSection
() {

  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-size-[56px_56px]" />
        <div className="absolute inset-0 bg-linear-to-b from-black via-black/85 to-black" />
        <div className="absolute right-10 top-32 hidden rotate-45 border border-primary/30 bg-primary/5 p-16 motion-preset-float-sm motion-loop-infinite motion-duration-2000 md:block" />
        <div className="absolute bottom-24 left-10 hidden rotate-45 border border-white/10 bg-white/5 p-10 motion-preset-float-sm motion-loop-infinite motion-delay-300 md:block" />
      </div>

      <div className="z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-12 px-6 pb-16 text-white md:px-12">
        <div className="flex max-w-5xl flex-col gap-8">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-white/55">
            <span className="motion-preset-slide-up-sm motion-duration-700 rounded-md border border-white/10 bg-white/5 px-3 py-2">
              BIM
            </span>
            <span className="motion-preset-slide-up-sm motion-delay-100 motion-duration-700 rounded-md border border-white/10 bg-white/5 px-3 py-2">
              Revit
            </span>
            <span className="motion-preset-slide-up-sm motion-delay-200 motion-duration-700 rounded-md border border-white/10 bg-white/5 px-3 py-2">
              React
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <h1 className="motion-preset-slide-up-sm motion-delay-100 motion-duration-700 max-w-5xl text-5xl leading-none font-extrabold tracking-[0] uppercase md:text-8xl">
              Michael Repolusk
            </h1>
            <p className="motion-preset-slide-up-sm motion-delay-200 motion-duration-700 max-w-2xl text-lg leading-8 text-white/70 md:text-xl">
              Fast paced development meets engineering: BIM, Revit, Gebäudetechnik und schlanke digitale Tools für klare Projektentscheidungen.
            </p>
          </div>

          <div className="motion-preset-slide-up-sm motion-delay-300 motion-duration-700 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="uppercase tracking-[0.08em]">
              <Link href="/bookmeeting">
                <CalendarDays data-icon="inline-start" />
                30min Meeting
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href={`mailto:${contact.email}`}>
                <Mail data-icon="inline-start" />
                E-Mail schreiben
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white">
              <Link href="/berufe">
                Timeline
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="motion-preset-slide-up-sm motion-delay-500 motion-duration-700 grid gap-3 md:grid-cols-3">
          {[
            { icon: Layers3, title: "BIM Koordination", text: "Modelle, Revit-Standards und saubere Übergaben." },
            { icon: Wrench, title: "HLKSE Planung", text: "Technische Lösungen für Umbau, Ausbau und Ausführung." },
            { icon: Code2, title: "Software Tools", text: "Schlanke Oberflächen für wiederkehrende Aufgaben." },
          ].map((item) => {
            const Icon = item.icon

            return (
              <div key={item.title} className="group rounded-lg border border-white/10 bg-white/[0.035] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/6">
                <Icon className="mb-6 size-7 text-primary transition-transform duration-500 group-hover:rotate-6" aria-hidden="true" />
                <h2 className="text-lg font-bold tracking-[0] uppercase text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
