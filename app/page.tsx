// app/page.tsx

import HeroSection from "./heroSection"
import CatchPoints from "./catchpoints"
import Skills from "./skills"

export default function Page() {


  return (
    <main className="min-h-screen bg-background text-white">

      <section className="relative flex min-h-screen flex-col overflow-hidden pt-28">
        <HeroSection />
        <CatchPoints />
      </section>

      <section className="bg-black px-6 py-24 md:px-12">
        <Skills />
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