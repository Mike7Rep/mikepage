import type { ReactNode } from "react"
import Link from "next/link"

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
  subtitle?: string
}) {
  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-black px-0 py-8 text-white sm:px-6 sm:py-10 md:px-12">
      <section className="mx-auto flex min-w-0 max-w-7xl flex-col gap-8">
        <header className="flex min-w-0 flex-col gap-5 px-3 sm:px-0 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-4xl leading-none font-extrabold tracking-[0] uppercase sm:text-5xl md:text-7xl">
                myDashboard
              </h1>
              {subtitle ? <p className="mt-3 text-sm leading-6 text-white/55">{subtitle}</p> : null}
              <DashboardNavigation activeSection={activeSection} />
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2 md:pt-1">{actions}</div> : null}
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
      <DashboardNavLink active={activeSection === "health"} href="/myDashboard/health">
        Health
      </DashboardNavLink>
      <DashboardNavLink active={activeSection === "depot"} href="/myDashboard/depot">
        Depot
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
        "w-20 rounded-sm px-2 py-1.5 text-center text-xs font-medium text-white/55 transition hover:text-white",
        active && "bg-primary text-primary-foreground hover:text-primary-foreground"
      )}
      href={href}
    >
      {children}
    </Link>
  )
}
