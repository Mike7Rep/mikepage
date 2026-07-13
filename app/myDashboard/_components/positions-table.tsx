"use client"

import { type ReactNode, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, LineChart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { AlpacaDashboardData, DashboardPosition } from "@/lib/python-api"
import { formatCurrency, formatPercent, formatQuantity, valueTone } from "../format"

type SortKey = "asset" | "name" | "qty" | "entryPrice" | "currentPrice" | "unrealizedPl" | "unrealizedPlPercent"
type SortState = { key: SortKey; direction: "asc" | "desc" } | null

const columns: Array<{ key: SortKey; label: string; align?: "right" }> = [
  { key: "asset", label: "Asset" },
  { key: "name", label: "Name" },
  { key: "qty", label: "QTY", align: "right" },
  { key: "entryPrice", label: "EK", align: "right" },
  { key: "currentPrice", label: "VK", align: "right" },
  { key: "unrealizedPl", label: "W/L", align: "right" },
  { key: "unrealizedPlPercent", label: "W/L (%)", align: "right" },
]

const collator = new Intl.Collator("de-CH", { numeric: true, sensitivity: "base" })

export function PositionsTable({
  data,
  selectedSymbol,
  onSelect,
  onPrefetch,
}: {
  data: AlpacaDashboardData
  selectedSymbol: string | null
  onSelect: (symbol: string) => void
  onPrefetch?: (symbol: string) => void
}) {
  const [sort, setSort] = useState<SortState>(null)
  const positions = useMemo(() => sortPositions(data.positions, sort), [data.positions, sort])

  return (
    <Card className="bg-white/[0.035] text-white">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-bold tracking-[0] text-white uppercase">
            Depotpositionen
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-white/55">
            Offene Aktienpositionen aus Alpaca.
          </CardDescription>
        </div>
        <CardAction>
          <Badge className="bg-primary text-primary-foreground">
            <LineChart data-icon="inline-start" />
            {data.positions.length} Positionen
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {data.positions.length === 0 ? (
          <EmptyPositions />
        ) : (
          <TableRows
            currency={data.currency}
            onPrefetch={onPrefetch}
            onSelect={onSelect}
            positions={positions}
            selectedSymbol={selectedSymbol}
            setSort={setSort}
            sort={sort}
          />
        )}
      </CardContent>
    </Card>
  )
}

function EmptyPositions() {
  return <div className="px-4 py-12 text-center text-sm text-white/55">Keine offenen Positionen.</div>
}

function TableRows({
  currency,
  positions,
  selectedSymbol,
  sort,
  setSort,
  onSelect,
  onPrefetch,
}: {
  currency: string
  positions: DashboardPosition[]
  selectedSymbol: string | null
  sort: SortState
  setSort: (sort: SortState) => void
  onSelect: (symbol: string) => void
  onPrefetch?: (symbol: string) => void
}) {
  return (
    <Table className="block min-w-0 text-white md:table md:min-w-[820px]">
      <TableHeader className="hidden md:table-header-group">
        <TableRow className="border-white/10 hover:bg-transparent">
          {columns.map((column, index) => (
            <TableHead key={column.key} className={column.align === "right" ? "text-right text-white/45" : "px-4 text-white/45"}>
              <SortButton column={column} index={index} setSort={setSort} sort={sort} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="flex flex-col gap-2 px-3 md:table-row-group md:px-0">
        {positions.map((position) => (
          <TableRow
            key={position.asset}
            className="relative grid cursor-pointer grid-cols-2 gap-3 rounded-lg bg-white/[0.04] p-3 hover:bg-white/[0.055] focus-visible:bg-white/[0.06] focus-visible:outline-none data-[state=selected]:bg-primary/10 md:table-row md:rounded-none md:bg-transparent md:p-0"
            data-state={selectedSymbol === position.asset ? "selected" : undefined}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(position.asset)}
            onFocus={() => onPrefetch?.(position.asset)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onSelect(position.asset)
              }
            }}
            onMouseEnter={() => onPrefetch?.(position.asset)}
          >
            <TableCell className="col-span-2 p-0 pr-24 text-lg font-semibold text-white md:table-cell md:px-4 md:py-2 md:text-xs/relaxed">{position.asset}</TableCell>
            <TableCell className="col-span-2 max-w-none truncate p-0 text-white/55 md:table-cell md:max-w-[280px] md:p-2 md:text-white/70" title={position.name}>{position.name}</TableCell>
            <PositionMetricCell label="QTY">{formatQuantity(position.qty)}</PositionMetricCell>
            <PositionMetricCell label="EK">{formatCurrency(position.entryPrice, currency)}</PositionMetricCell>
            <PositionMetricCell label="VK">{formatCurrency(position.currentPrice, currency)}</PositionMetricCell>
            <PositionMetricCell className={valueTone(position.unrealizedPl)} label="W/L">{formatCurrency(position.unrealizedPl, currency)}</PositionMetricCell>
            <TableCell className="absolute top-3 right-3 p-0 text-right md:static md:table-cell md:p-2 md:pr-4">
              <Badge variant={position.unrealizedPl < 0 ? "destructive" : "default"}>
                {formatPercent(position.unrealizedPlPercent)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PositionMetricCell({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <TableCell
      className={cn(
        "grid gap-0.5 p-0 text-left text-white/70 tabular-nums before:text-[0.625rem] before:font-medium before:tracking-[0.08em] before:text-white/40 before:uppercase before:content-[attr(data-label)] md:table-cell md:p-2 md:text-right md:before:hidden",
        className
      )}
      data-label={label}
    >
      {children}
    </TableCell>
  )
}

function SortButton({
  column,
  index,
  sort,
  setSort,
}: {
  column: (typeof columns)[number]
  index: number
  sort: SortState
  setSort: (sort: SortState) => void
}) {
  const active = sort?.key === column.key
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown
  return (
    <Button
      className={column.align === "right" ? "ml-auto px-1 text-white/55 hover:text-white" : "-ml-1 px-1 text-white/55 hover:text-white"}
      size="sm"
      variant="ghost"
      onClick={() => setSort(nextSort(column.key, sort))}
    >
      <span>{column.label}</span>
      <Icon className="size-3" data-icon={index > 1 ? "inline-start" : "inline-end"} />
    </Button>
  )
}

function nextSort(key: SortKey, sort: SortState): SortState {
  if (sort?.key === key) {
    return { key, direction: sort.direction === "asc" ? "desc" : "asc" }
  }
  return { key, direction: "asc" }
}

function sortPositions(positions: DashboardPosition[], sort: SortState) {
  if (!sort) return positions
  return [...positions].sort((a, b) => {
    const direction = sort.direction === "asc" ? 1 : -1
    const left = a[sort.key]
    const right = b[sort.key]
    const value = typeof left === "string" && typeof right === "string"
      ? collator.compare(left, right)
      : Number(left) - Number(right)
    return value * direction
  })
}
