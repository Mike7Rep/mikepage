import Link from "next/link"
import { CalendarDays, Mail, MapPin, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { contact } from "@/lib/profile-data"

const contactItems = [
  {
    icon: Mail,
    label: "E-Mail",
    value: contact.email,
    href: `mailto:${contact.email}`,
  },
  {
    icon: Phone,
    label: "Telefon",
    value: contact.phone,
    href: `tel:${contact.phone.replaceAll(" ", "")}`,
  },
  {
    icon: MapPin,
    label: "Adresse",
    value: `${contact.street}, ${contact.city}`,
    href: null,
  },
]

export default function KontaktPage() {
  return (
    <main className="min-h-screen bg-black px-6 pt-36 pb-20 text-white md:px-12">
      <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <h1 className="motion-preset-slide-up-sm motion-duration-700 text-5xl leading-none font-extrabold tracking-[0] uppercase md:text-7xl">
              Kontakt
            </h1>
            <p className="motion-preset-slide-up-sm motion-delay-100 motion-duration-700 max-w-2xl text-lg leading-8 text-white/68">
              Schreib mir direkt eine E-Mail oder buche einen Termin. Es gibt kein Kontaktformular, keine eigene Datenbank und keine unnötige Datensammlung.
            </p>
          </div>
          <div className="motion-preset-slide-up-sm motion-delay-200 motion-duration-700 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="uppercase tracking-[0.08em]">
              <Link href={`mailto:${contact.email}`}>
                <Mail data-icon="inline-start" />
                E-Mail schreiben
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href={contact.bookingPath}>
                <CalendarDays data-icon="inline-start" />
                Meeting buchen
              </Link>
            </Button>
          </div>
        </div>

        <div className="motion-preset-slide-up-sm motion-delay-300 motion-duration-700 grid gap-3">
          {contactItems.map((item) => {
            const Icon = item.icon
            const content = (
              <div className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.06]">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/42">
                    {item.label}
                  </span>
                  <span className="break-words text-base leading-7 text-white/78">
                    {item.value}
                  </span>
                </div>
              </div>
            )

            return item.href ? (
              <Link key={item.label} href={item.href}>
                {content}
              </Link>
            ) : (
              <div key={item.label}>{content}</div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
