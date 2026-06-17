"use client"

import { useState } from "react"

import type { AlpacaDashboardData } from "@/lib/python-api"
import { AssetChartPanel, prefetchAssetChart } from "./asset-chart-panel"
import { PositionsTable } from "./positions-table"

export function DashboardInteractive({ data }: { data: AlpacaDashboardData }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  return (
    <>
      <AssetChartPanel
        symbol={selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
      />
      <PositionsTable
        data={data}
        onPrefetch={prefetchAssetChart}
        selectedSymbol={selectedSymbol}
        onSelect={setSelectedSymbol}
      />
    </>
  )
}
