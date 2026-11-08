"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DepotData } from "@/lib/depot-data"
import type { AlpacaDashboardData } from "@/lib/python-api"
import { getDepotHistoryAction, searchStocksAction } from "../actions"
import { AssetChartPanel, prefetchAssetChart } from "./asset-chart-panel"
import { PortfolioChart } from "./portfolio-chart"
import { PositionsTable } from "./positions-table"

export function DashboardInteractive({ data }: { data: AlpacaDashboardData }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [history, setHistory] = useState<DepotData>({ points: [], fills: [], lastSyncedAt: null, warnings: [] })
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [search, setSearch] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([])
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => { if (search && query.trim()) searchStocksAction(query).then(rows => { if (active) setResults(rows) }).catch(() => { if (active) setError("Suche fehlgeschlagen.") }); else setResults([]) }, 300)
    return () => { active = false; clearTimeout(timer) }
  }, [query, search])

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
      {search && <div className="grid gap-2 rounded-lg bg-white/5 p-4"><input autoFocus aria-label="Aktie suchen" placeholder="Symbol oder Name" className="rounded border p-3" value={query} onChange={e => setQuery(e.target.value)} />{results.map(asset => <Button variant="ghost" key={asset.symbol} onClick={() => { setSelectedSymbol(asset.symbol); setSearch(false) }}>{asset.symbol} · {asset.name}</Button>)}</div>}
      <AssetChartPanel quantity={data.positions.find(p => p.asset === selectedSymbol)?.qty ?? 0} key={data.updatedAt} symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
      <PositionsTable onBuy={() => setSearch(true)} data={data} onPrefetch={prefetchAssetChart} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
    </>
  )
}
