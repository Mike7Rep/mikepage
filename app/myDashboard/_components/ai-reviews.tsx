import { BrainCircuit } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LatestReview } from "@/lib/python-api"
import { formatCurrency, formatPercent } from "../format"

export function AiReviews({ currency, reviews }: { currency: string; reviews: LatestReview[] }) {
  if (!reviews.length) return null

  return (
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-[0] text-white uppercase">
          <BrainCircuit className="size-4 text-primary" aria-hidden="true" />
          Letzte KI-Bewertungen
        </CardTitle>
        <CardDescription className="text-sm text-white/55">
          Audit-Log aus der Python API, ohne Trading-Steuerung im Browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reviews.slice(0, 6).map((review) => (
          <ReviewCard key={`${review.symbol}-${review.createdAt}`} currency={currency} review={review} />
        ))}
      </CardContent>
    </Card>
  )
}

function ReviewCard({ currency, review }: { currency: string; review: LatestReview }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-white">{review.symbol}</p>
          <p className="text-xs text-white/45">Rating {review.analysis.rating}/100</p>
        </div>
        <Badge variant={review.analysis.action === "buy" ? "default" : "outline"}>
          {review.analysis.action}
        </Badge>
      </div>
      <p className="line-clamp-3 text-xs leading-5 text-white/60">{review.analysis.rationale}</p>
      <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
        <span>Konfidenz {formatPercent(review.analysis.confidence)}</span>
        <span>{review.analysis.market_outlook}</span>
        <span>{review.decision.should_buy ? "Buy-Kandidat" : review.decision.reason}</span>
        <span>{formatCurrency(review.decision.notional, currency)}</span>
      </div>
    </div>
  )
}
