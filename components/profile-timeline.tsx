import Link from "next/link"
import {
  BookOpen,
  Box,
  Briefcase,
  Building2,
  Code2,
  ExternalLink,
  GraduationCap,
  Layers3,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TimelineCategory, TimelineItem } from "@/lib/profile-data"

const categoryMeta: Record<
  TimelineCategory,
  { label: string; icon: LucideIcon; accent: string }
> = {
  engineering: {
    label: "Engineering",
    icon: Building2,
    accent: "from-primary/30 to-white/5",
  },
  bim: {
    label: "BIM / Revit",
    icon: Layers3,
    accent: "from-cyan-400/25 to-primary/10",
  },
  software: {
    label: "Software",
    icon: Code2,
    accent: "from-violet-400/25 to-primary/10",
  },
  education: {
    label: "Bildung",
    icon: GraduationCap,
    accent: "from-amber-300/25 to-primary/10",
  },
  project: {
    label: "Projekt",
    icon: Box,
    accent: "from-sky-300/25 to-primary/10",
  },
  service: {
    label: "Service",
    icon: Briefcase,
    accent: "from-rose-300/25 to-primary/10",
  },
}

const itemMotion = [
  "motion-delay-0",
  "motion-delay-100",
  "motion-delay-200",
  "motion-delay-300",
  "motion-delay-500",
]

export function PageIntro({
  title,
  eyebrow,
  description,
}: {
  title: string
  eyebrow: string
  description: string
}) {
  return (
    <header className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pt-36 pb-16 md:px-12 md:pt-40">
      <Badge
        variant="outline"
        className="motion-preset-slide-up-sm motion-duration-700 w-fit border-white/15 bg-white/5 text-white/65"
      >
        <BookOpen />
        {eyebrow}
      </Badge>
      <div className="flex max-w-4xl flex-col gap-6">
        <h1 className="motion-preset-slide-up-sm motion-delay-100 motion-duration-700 break-words text-4xl leading-none font-extrabold tracking-[0] text-white uppercase sm:text-5xl md:text-7xl">
          {title}
        </h1>
        <p className="motion-preset-slide-up-sm motion-delay-200 motion-duration-700 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
          {description}
        </p>
      </div>
    </header>
  )
}

export function ProfileTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24 md:px-12">
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-6 hidden w-px bg-linear-to-b from-primary/0 via-primary/50 to-primary/0 md:block" />
        <div className="flex flex-col gap-5">
          {items.map((item, index) => {
            const meta = categoryMeta[item.category]
            const Icon = meta.icon

            return (
              <article
                key={`${item.period}-${item.title}`}
                className={cn(
                  "motion-preset-slide-up-sm motion-duration-700 motion-ease-spring-smooth group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] p-5 text-white shadow-2xl shadow-black/20 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.06] md:ml-16 md:p-7",
                  itemMotion[index % itemMotion.length]
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r opacity-80",
                    meta.accent
                  )}
                />
                <div className="absolute top-7 -left-12 hidden size-10 items-center justify-center rounded-md border border-primary/35 bg-black text-primary shadow-lg shadow-primary/10 md:flex">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-primary md:hidden">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge
                          variant="secondary"
                          className="w-fit bg-primary/15 text-primary"
                        >
                          {meta.label}
                        </Badge>
                        <h2 className="text-2xl leading-tight font-bold tracking-[0] text-white uppercase md:text-3xl">
                          {item.title}
                        </h2>
                        <p className="text-sm leading-6 text-white/55">
                          {item.organization}
                          {item.location ? `, ${item.location}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs font-medium tracking-[0.12em] text-white/60 uppercase">
                      {item.period}
                    </p>
                  </div>

                  <p className="max-w-3xl text-base leading-7 text-white/72">
                    {item.summary}
                  </p>

                  <ul className="grid gap-2 text-sm leading-6 text-white/62 md:grid-cols-3">
                    {item.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="rounded-md border border-white/10 bg-black/20 px-3 py-2"
                      >
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  {item.href ? (
                    <div>
                      <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                        <Link href={item.href} target="_blank" rel="noreferrer">
                          {item.actionLabel ?? "Mehr erfahren"}
                          <ExternalLink data-icon="inline-end" />
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
