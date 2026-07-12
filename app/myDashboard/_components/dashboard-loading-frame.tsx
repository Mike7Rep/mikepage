import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DashboardFrame } from "./dashboard-frame"

export function DashboardLoadingFrame({
  activeSection,
}: {
  activeSection?: "depot" | "health" | "vermoegen"
}) {
  return (
    <DashboardFrame activeSection={activeSection}>
      <div className="flex flex-col gap-5" aria-busy="true" aria-live="polite">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <LoadingCard key={index} />
          ))}
        </section>
        <LoadingPanel />
        <LoadingPanel tall />
      </div>
    </DashboardFrame>
  )
}

function LoadingCard() {
  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader className="gap-3">
        <div className="h-3 w-20 animate-pulse rounded-sm bg-white/10" />
        <div className="h-8 w-32 animate-pulse rounded-sm bg-white/15" />
        <div className="h-3 w-24 animate-pulse rounded-sm bg-white/10" />
      </CardHeader>
    </Card>
  )
}

function LoadingPanel({ tall = false }: { tall?: boolean }) {
  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader className="gap-3">
        <div className="h-5 w-44 animate-pulse rounded-sm bg-white/15" />
        <div className="h-3 w-56 animate-pulse rounded-sm bg-white/10" />
      </CardHeader>
      <CardContent>
        <div className={tall ? "h-[360px] animate-pulse rounded-md bg-white/[0.055]" : "h-28 animate-pulse rounded-md bg-white/[0.055]"} />
      </CardContent>
    </Card>
  )
}
