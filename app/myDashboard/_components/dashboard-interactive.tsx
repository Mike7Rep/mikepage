"use client"

import { useState } from "react"

import type { AlpacaDashboardData } from "@/lib/python-api"
import { AssetChartPanel, prefetchAssetChart } from "./asset-chart-panel"
import { PositionsTable } from "./positions-table"
import { DepotTrader, type TradeSelection } from "./depot-trader"

export function DashboardInteractive({ data }: { data: AlpacaDashboardData }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [trade, setTrade] = useState<TradeSelection | null>(null)

  return (
    <>
      <DepotTrader data={data} trade={trade} onTrade={setTrade} onCloseTrade={() => setTrade(null)} onSelect={setSelectedSymbol} />
      <AssetChartPanel
        key={data.updatedAt}
        symbol={selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
      />
      <PositionsTable
        onTrade={setTrade}
        data={data}
        onPrefetch={prefetchAssetChart}
        selectedSymbol={selectedSymbol}
        onSelect={setSelectedSymbol}
      />
    </>
  )
}
