import { BrainCircuit } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AlpacaDashboardData } from "@/lib/python-api"
import { formatDateTime, formatPercent, valueTone } from "../format"

type ReviewPerformance = AlpacaDashboardData["reviewPerformance"][number]["reviews"][number]

const actionLabels: Record<ReviewPerformance["action"], string> = {
  avoid: "Nicht kaufen",
  buy: "Kaufen",
  hold: "Halten",
}

export function StrategyDevelopment({ data }: { data: AlpacaDashboardData }) {
  const rows = data.reviewPerformance.filter((item) => item.reviews.length > 0)

  if (!data.strategy && rows.length === 0) return null

  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-[0] text-white uppercase">
          <BrainCircuit className="size-4 text-primary" aria-hidden="true" />
          Strategie-Entwicklung
        </CardTitle>
        {data.strategy ? (
          <CardDescription className="max-w-4xl text-white/62">
            Version {data.strategy.version} · {data.strategy.summary} Aktualisiert:{" "}
            {formatDateTime(data.strategy.updatedAt)}
          </CardDescription>
        ) : (
          <CardDescription className="text-white/62">
            Noch keine versionierte Strategie gespeichert.
          </CardDescription>
        )}
      </CardHeader>
      {rows.length > 0 ? (
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table className="min-w-[820px] text-white">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-white/45">Symbol</TableHead>
                  {[0, 1, 2].map((index) => (
                    <TableHeadGroup key={index} />
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.symbol} className="border-white/10 hover:bg-white/[0.045]">
                    <TableCell className="px-4 font-medium text-white">{row.symbol}</TableCell>
                    {[0, 1, 2].map((index) => (
                      <ReviewCells key={index} review={row.reviews[index]} />
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}

function TableHeadGroup() {
  return (
    <>
      <TableHead className="text-white/45">Action</TableHead>
      <TableHead className="pr-4 text-right text-white/45">Kursveränderung</TableHead>
    </>
  )
}

function ReviewCells({ review }: { review?: ReviewPerformance }) {
  if (!review) {
    return (
      <>
        <TableCell className="text-white/35">-</TableCell>
        <TableCell className="pr-4 text-right text-white/35">-</TableCell>
      </>
    )
  }

  return (
    <>
      <TableCell className="text-white/72">{actionLabels[review.action]}</TableCell>
      <TableCell className={`pr-4 text-right ${valueTone(review.priceChangePercent ?? 0)}`}>
        {formatPercent(review.priceChangePercent)}
      </TableCell>
    </>
  )
}
