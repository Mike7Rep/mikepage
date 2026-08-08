import type { ReactNode } from "react"
import Link from "next/link"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logoutDashboardAction } from "../actions"

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
    <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden overscroll-x-none bg-black px-0 py-6 text-white touch-pan-y [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:ring-0 [&_[data-slot=table-container]]:overflow-x-hidden [&_[data-slot=table-footer]]:border-0 [&_[data-slot=table-row]]:border-0 sm:px-6 sm:py-10 sm:[&_[data-slot=card]]:rounded-lg md:touch-auto md:px-12 md:[&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=input]]:text-base md:[&_[data-slot=input]]:text-xs/relaxed">
      <section className="mx-auto flex min-w-0 max-w-7xl flex-col gap-5 sm:gap-8">
        <header className="flex min-w-0 flex-col gap-5 px-4 sm:px-0 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="min-w-0 text-[clamp(1.5rem,9vw,2.25rem)] leading-none font-extrabold tracking-[0] uppercase sm:text-5xl md:text-7xl">
                  myDashboard
                </h1>
                <DashboardLogoutButton />
              </div>
              {subtitle ? <p className="mt-3 text-sm leading-6 text-white/55">{subtitle}</p> : null}
              <DashboardNavigation activeSection={activeSection} />
            </div>
          </div>
          {actions ? <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end md:pt-1">{actions}</div> : null}
        </header>
        {children}
      </section>
    </main>
  )
}

function DashboardLogoutButton() {
  return (
    <form action={logoutDashboardAction}>
      <Button aria-label="Logout" className="size-11" size="icon-lg" title="Logout" type="submit" variant="ghost">
        <LogOut className="size-5" aria-hidden="true" />
      </Button>
    </form>
  )
}

type DashboardSection = "challenge" | "depot" | "health" | "vermoegen"

function DashboardNavigation({ activeSection }: { activeSection?: DashboardSection }) {
  return (
    <nav aria-label="myDashboard Navigation" className="mt-5 flex w-full max-w-md rounded-lg bg-white/[0.055] p-1">
      <DashboardNavLink active={activeSection === "vermoegen"} href="/myDashboard/vermoegen">
        Vermögen
      </DashboardNavLink>
      <DashboardNavLink active={activeSection === "health"} href="/myDashboard/health">
        Health
      </DashboardNavLink>
      <DashboardNavLink active={activeSection === "challenge"} href="/myDashboard/challenge">
        Challenge
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
        "min-w-0 flex-1 rounded-md px-2 py-2 text-center text-xs font-medium text-white/55 transition hover:text-white",
        active && "bg-primary text-primary-foreground hover:text-primary-foreground"
      )}
      href={href}
    >
      {children}
    </Link>
  )
}
