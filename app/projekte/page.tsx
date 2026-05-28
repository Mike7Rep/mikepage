import ContactCta from "@/components/contact-cta"
import { PageIntro, ProfileTimeline } from "@/components/profile-timeline"
import { projectTimeline } from "@/lib/profile-data"

export default function ProjektePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageIntro
        eyebrow="Projekte"
        title="Digitale Werkzeuge für echte Planungsarbeit."
        description="Aus der Schnittstelle von BIM, Gebäudetechnik und Software entstehen kleine, konkrete Tools statt schwerer Plattformlogik."
      />
      <ProfileTimeline items={projectTimeline} />
      <ContactCta />
    </main>
  )
}
