import { AlertCircle } from "lucide-react"

import type { AlpacaDashboardData } from "@/lib/python-api"
import { formatDateTime } from "../format"
import { DashboardInteractive } from "./dashboard-interactive"
import { KpiCard } from "./kpi-card"

export function DashboardContent({ data }: { data: AlpacaDashboardData }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title={`Aktueller Wert (${data.currency})`} value={formatKpiNumber(data.currentValue, 0)} />
        <KpiCard muted={data.totalDeposited === null} title={`Total einbezahlt (${data.currency})`} value={formatKpiNumber(data.totalDeposited, 0)} />
        <KpiCard title={`W/L (${data.currency})`} tone={data.totalPl} value={formatKpiNumber(data.totalPl, 1)} />
        <KpiCard title="W/L (%)" tone={data.totalPlPercent ?? data.totalUnrealizedPlPercent ?? 0} value={formatKpiNumber((data.totalPlPercent ?? data.totalUnrealizedPlPercent) === null ? null : (data.totalPlPercent ?? data.totalUnrealizedPlPercent)! * 100, 1)} />
      </section>

      {data.warnings.length > 0 ? <Warnings warnings={data.warnings} /> : null}
      <DashboardInteractive data={data} />
    </div>
  )
}

export function dashboardUpdatedLabel(data: AlpacaDashboardData) {
  return `Aktualisiert: ${formatDateTime(data.updatedAt)}`
}

function formatKpiNumber(value: number | null, fractionDigits: number) {
  if (value === null || Number.isNaN(value)) return "–"
  return new Intl.NumberFormat("de-CH", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value).replace(/\u2019/g, "'")
}

function Warnings({ warnings }: { warnings: string[] }) {
  return (
    <div className="flex gap-3 rounded-md border border-primary/25 bg-primary/10 p-4 text-sm leading-6 text-white/72">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {warnings.map((warning) => <p key={warning}>{warning}</p>)}
      </div>
    </div>
  )
}
