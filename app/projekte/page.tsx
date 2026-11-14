import { Suspense } from "react"
import FeedbackSection from "@/components/site/feedback-section"
import ContactCta from "@/components/contact-cta"
import ProjectsSection from "@/components/projects/projectsSection"

export default function ProjektePage() {
  return <main className="public-theme min-h-screen bg-black pt-20 text-white"><ProjectsSection />
      <Suspense fallback={null}><FeedbackSection /></Suspense><ContactCta /></main>
}
