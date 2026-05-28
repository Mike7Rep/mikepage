// app/page.tsx

import HeroSection from "./HeroSection"
import CatchPoints from "./CatchPoints"
import Skills from "./Skills"
import Footer from "./Footer"

export default function Page() {


  return (
    <main className="min-h-screen bg-background text-white">

      <section className="relative flex min-h-screen flex-col overflow-hidden pt-28">
        <HeroSection />
        <CatchPoints />
      </section>

      <section id="skills" className="scroll-mt-28 bg-black px-6 py-24 md:px-12">
        <Skills />
      </section>

      <Footer />
    </main>
  );
}
