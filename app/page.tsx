// app/page.tsx


import Image from "next/image";

// UI
import {Button} from "@/components/ui/button"

export default function Page() {


  return (
    <main className="min-h-screen bg-background text-white">

      <section className="relative flex min-h-screen flex-col overflow-hidden pt-28">
        <div className="absolute inset-0 z-0">
          <Image
            src="/image/mike.png"
            alt="Michael Repolusk"
            fill
            priority
            className="object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/20 to-background" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center md:px-12">
          <h1 className="text-[16vw] font-extrabold uppercase leading-[0.9] tracking-[-0.06em] md:text-[10vw]">
            Michael
            <br />
            Repolusk
          </h1>

          <p className="mt-4 max-w-xl text-xs uppercase tracking-[0.3em] text-white/60 md:text-sm">
            Engineering precision meets digital development.
          </p>
        </div>

        <div className="relative z-20 grid grid-cols-1 border-t border-white/10 md:grid-cols-3">
          <div className="group relative min-h-80 border-b border-white/10 bg-white/3 md:border-b-0 md:border-r md:border-white/10">
            <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="flex h-full flex-col justify-between p-8 md:p-12">
              <div>
                <span className="mb-2 block text-xs tracking-[0.25em] text-white/40">01</span>
                <h2 className="text-4xl font-bold uppercase tracking-tight">Ingenieur</h2>
              </div>

              <div className="translate-y-5 space-y-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-lg leading-relaxed text-white/70">
                  Haustechnik und Revit Spezialist einfach buchbar
                </p>
                <Button className="rounded-none px-6 uppercase tracking-[0.08em]">
                  30min Gratis Meeting
                </Button>
              </div>
            </div>
          </div>

          <div className="group relative min-h-80 border-b border-white/10 bg-white/5 md:border-b-0 md:border-r md:border-white/10">
            <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="flex h-full flex-col justify-between p-8 md:p-12">
              <div>
                <span className="mb-2 block text-xs tracking-[0.25em] text-white/40">02</span>
                <h2 className="text-4xl font-bold uppercase tracking-tight">Entwickler</h2>
              </div>

              <div className="translate-y-5 space-y-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-lg leading-relaxed text-white/70">
                  Web Tools für Ingenieure
                </p>
                <a
                  href="#projekte"
                  className="inline-flex w-fit items-center border-b border-white/30 pb-1 text-sm uppercase tracking-[0.12em] text-white transition hover:border-white"
                >
                  Lüftungsdimensionierer
                </a>
              </div>
            </div>
          </div>

          <div className="group relative min-h-[320px] bg-white/[0.07]">
            <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="flex h-full flex-col justify-between p-8 md:p-12">
              <div>
                <span className="mb-2 block text-xs tracking-[0.25em] text-white/40">03</span>
                <h2 className="text-4xl font-bold uppercase tracking-tight">Visionär</h2>
              </div>

              <div className="translate-y-5 space-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-sm leading-relaxed text-white/70">
                  Die Effektivität und Effizienz von Spielen in den Planungsprozess
                  integrieren mit <span className="font-semibold text-white">Sirego realBIM</span>.
                </p>
                <div className="h-px w-12 bg-white/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-24 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="inline-block border border-white/15 px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
              System Architecture
            </div>

            <h3 className="text-4xl font-bold uppercase leading-none tracking-tight md:text-5xl">
              Engineered for
              <br />
              Peak Performance.
            </h3>

            <p className="max-w-md leading-relaxed text-white/70">
              Combining traditional engineering principles with modern web development
              to bridge the gap between structural precision and digital usability.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div className="aspect-square bg-white/[0.04] p-8">
              <div className="flex h-full flex-col justify-end">
                <span className="mb-2 text-4xl font-bold">99%</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Precision
                </span>
              </div>
            </div>

            <div className="aspect-square bg-white/[0.04] p-8">
              <div className="flex h-full flex-col justify-end">
                <span className="mb-2 text-4xl font-bold">Revit</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Core Expertise
                </span>
              </div>
            </div>

            <div className="aspect-square bg-white/[0.04] p-8">
              <div className="flex h-full flex-col justify-end">
                <span className="mb-2 text-4xl font-bold">Web</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Development
                </span>
              </div>
            </div>

            <div className="aspect-square bg-white/[0.04] p-8">
              <div className="flex h-full flex-col justify-end">
                <span className="mb-2 text-4xl font-bold">BIM</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Consulting
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 bg-black px-6 py-10 md:flex-row md:px-12">
        <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">
          © 2026 MICHAEL REPOLUSK. INGENIEUR. ENTWICKLER. VISIONÄR.
        </div>

        <div className="flex gap-8">
          <a href="#" className="text-[10px] uppercase tracking-[0.12em] text-white/30 transition hover:text-white">
            Impressum
          </a>
          <a href="#" className="text-[10px] uppercase tracking-[0.12em] text-white/30 transition hover:text-white">
            Datenschutz
          </a>
          <a href="#" className="text-[10px] uppercase tracking-[0.12em] text-white/30 transition hover:text-white">
            LinkedIn
          </a>
        </div>
      </footer>
    </main>
  );
}