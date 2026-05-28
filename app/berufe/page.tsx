// app/berufe/page.tsx

import ContactCta from "@/components/contact-cta"
import { PageIntro, ProfileTimeline } from "@/components/profile-timeline"
import { careerTimeline } from "@/lib/profile-data"

export default function Berufe
() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageIntro
        eyebrow="Berufliche Timeline"
        title="Engineering, BIM und Software in einer Linie."
        description="Eine kompakte Übersicht ohne Bilder und ohne Datenbank: alle Stationen sind statisch im Projekt gepflegt und werden mit passenden React-Icons visualisiert."
      />
      <ProfileTimeline items={careerTimeline} />
      <ContactCta />
    </main>
  )
}
