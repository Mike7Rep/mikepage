import { BrainCircuit } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LatestReview } from "@/lib/python-api"

export function AiReviews({ reviews }: { reviews: LatestReview[] }) {
  if (!reviews.length) return null

  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-[0] text-white uppercase">
          <BrainCircuit className="size-4 text-primary" aria-hidden="true" />
          Letzte KI-Bewertungen
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <Table className="text-white">
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="px-4 text-white/45">Asset</TableHead>
              <TableHead className="text-white/45">Vorschlag</TableHead>
              <TableHead className="pr-4 text-right text-white/45">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.slice(0, 6).map((review) => (
              <TableRow key={`${review.symbol}-${review.createdAt}`} className="border-white/10 hover:bg-white/[0.045]">
                <TableCell className="px-4 font-medium text-white">{review.symbol}</TableCell>
                <TableCell className="text-white/70">{review.analysis.action}</TableCell>
                <TableCell className="pr-4 text-right text-white/70">{review.analysis.rating}/100</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
