import type { ReactNode } from "react"
import { ShieldCheck } from "lucide-react"

export function DashboardFrame({
  actions,
  children,
  subtitle,
}: {
  actions?: ReactNode
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
              <h1 className="text-5xl leading-none font-extrabold tracking-[0] uppercase md:text-7xl">
                myDashboard
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/55">{subtitle}</p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
        {children}
      </section>
    </main>
  )
}
