import { AlertCircle, ArrowDownRight, ArrowUpRight, BadgeDollarSign, WalletCards } from "lucide-react"

import type { AlpacaDashboardData } from "@/lib/python-api"
import { formatCurrency, formatDateTime, formatPercent } from "../format"
import { AiReviews } from "./ai-reviews"
import { DashboardInteractive } from "./dashboard-interactive"
import { KpiCard } from "./kpi-card"

export function DashboardContent({ data }: { data: AlpacaDashboardData }) {
  const DepositIcon = data.totalDeposited === null ? AlertCircle : BadgeDollarSign
  const TotalTrendIcon = trendIcon(data.totalPl)
  const PercentTrendIcon = trendIcon(data.totalPlPercent ?? data.totalUnrealizedPlPercent ?? 0)

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard description="Portfolio Value" icon={WalletCards} title="Aktueller Wert" value={formatCurrency(data.currentValue, data.currency)} />
        <KpiCard description="CSD - CSW" icon={DepositIcon} muted={data.totalDeposited === null} title="Total einbezahltes Geld" value={formatCurrency(data.totalDeposited, data.currency)} />
        <KpiCard description={data.totalDeposited && data.totalDeposited > 0 ? "Gegen Einzahlungsbasis" : "Offene Positionen"} icon={TotalTrendIcon} title="W/L" tone={data.totalPl} value={formatCurrency(data.totalPl, data.currency)} />
        <KpiCard description={data.totalPlPercent === null ? "Positionsbasis" : "Gegen Einzahlungsbasis"} icon={PercentTrendIcon} title="W/L (%)" tone={data.totalPlPercent ?? data.totalUnrealizedPlPercent ?? 0} value={formatPercent(data.totalPlPercent ?? data.totalUnrealizedPlPercent)} />
      </section>

      {data.warnings.length > 0 ? <Warnings warnings={data.warnings} /> : null}
      <AiReviews reviews={data.latestReviews} />
      <DashboardInteractive data={data} />
    </div>
  )
}

export function dashboardSubtitle(data: AlpacaDashboardData) {
  return `Aktualisiert: ${formatDateTime(data.updatedAt)}`
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

function trendIcon(value: number) {
  return value < 0 ? ArrowDownRight : ArrowUpRight
}
