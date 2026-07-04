import type { ReactNode } from "react"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"

export function DashboardFrame({
  actions,
  activeSection,
  children,
  subtitle,
}: {
  actions?: ReactNode
  activeSection?: DashboardSection
  children: ReactNode
  subtitle: string
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-6 py-10 text-white md:px-12">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex size-12 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-4xl leading-none font-extrabold tracking-[0] uppercase sm:text-5xl md:text-7xl">
                myDashboard
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/55">{subtitle}</p>
              <DashboardNavigation activeSection={activeSection} />
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
        {children}
      </section>
    </main>
  )
}

type DashboardSection = "depot" | "health" | "vermoegen"

function DashboardNavigation({ activeSection }: { activeSection?: DashboardSection }) {
  return (
    <nav aria-label="myDashboard Navigation" className="mt-5 flex w-fit rounded-md border border-white/10 bg-white/[0.035] p-1">
      <DashboardNavLink active={activeSection === "vermoegen"} href="/myDashboard/vermoegen">
        Vermögen
      </DashboardNavLink>
      <DashboardNavLink active={activeSection === "depot"} href="/myDashboard/depot">
        Depot
      </DashboardNavLink>
      <DashboardNavLink active={activeSection === "health"} href="/myDashboard/health">
        Health
      </DashboardNavLink>
    </nav>
  )
}

function DashboardNavLink({
  active,
  children,
  href,
}: {
  active: boolean
  children: ReactNode
  href: string
}) {
  return (
    <Link
      className={cn(
        "rounded-sm px-3 py-1.5 text-xs font-medium text-white/55 transition hover:text-white",
        active && "bg-primary text-primary-foreground hover:text-primary-foreground"
      )}
      href={href}
    >
      {children}
    </Link>
  )
}
