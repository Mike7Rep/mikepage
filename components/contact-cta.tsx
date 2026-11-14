import Link from "next/link"
import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

export default function ContactCta() {
  return (
    <section className="border-t border-white/10 bg-black px-6 py-16 text-white md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-3xl leading-none font-bold tracking-[0] uppercase md:text-4xl">
            Kurzer Austausch?
          </h2>
          <p className="text-sm leading-6 text-white/60 md:text-base">
            Beschreibe mir dein Projekt und die Unterstützung, die du benötigst.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="email-cta">
            <Link href={`mailto:${contact.email}`}>
              <Mail data-icon="inline-start" />
              Kontakt
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
