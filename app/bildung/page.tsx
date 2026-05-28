import ContactCta from "@/components/contact-cta"
import { PageIntro, ProfileTimeline } from "@/components/profile-timeline"
import { educationTimeline } from "@/lib/profile-data"

export default function BildungPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageIntro
        eyebrow="Bildung und Weiterbildung"
        title="Technische Basis mit Design- und VDC-Fokus."
        description="Von Engineering bis UX: die Bildungsstationen sind als schnelle, bildfreie Timeline aufgebaut und lassen sich ohne externe Datenquelle erweitern."
      />
      <ProfileTimeline items={educationTimeline} />
      <ContactCta />
    </main>
  )
}
