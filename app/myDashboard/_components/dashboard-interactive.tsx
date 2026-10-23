"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DepotData } from "@/lib/depot-data"
import type { AlpacaDashboardData } from "@/lib/python-api"
import { getDepotHistoryAction } from "../actions"
import { AssetChartPanel, prefetchAssetChart } from "./asset-chart-panel"
import { PortfolioChart } from "./portfolio-chart"
import { PositionsTable } from "./positions-table"

export function DashboardInteractive({ data }: { data: AlpacaDashboardData }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [history, setHistory] = useState<DepotData>({ points: [], fills: [], lastSyncedAt: null, warnings: [] })
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let active = true
    getDepotHistoryAction().then((result) => {
      if (!active) return
      if (result.ok) setHistory(result.data)
      else setError(result.error)
    }).catch(() => { if (active) setError("Depotverlauf konnte nicht geladen werden.") })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])

  async function refresh() {
    setBusy(true)
    setError(null)
    try {
      const result = await getDepotHistoryAction(true)
      if (!result.ok) throw new Error(result.error)
      setHistory(result.data)
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Depotdaten konnten nicht geladen werden.")
    } finally { setBusy(false) }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-0">
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button disabled={busy} variant="outline" onClick={refresh}><RefreshCw data-icon="inline-start" />{busy ? "Daten werden geladen …" : "Depotdaten aktualisieren"}</Button>
      </div>
      <PortfolioChart data={history} currency={data.currency} />
      <AssetChartPanel key={data.updatedAt} symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
      <PositionsTable data={data} onPrefetch={prefetchAssetChart} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
    </>
  )
}
