import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { valueTone } from "../format"

export function KpiCard({
  muted = false,
  title,
  tone = 0,
  value,
}: {
  muted?: boolean
  title: string
  tone?: number
  value: string
}) {
  return (
    <Card className="bg-white/[0.035] text-white" size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-medium tracking-[0.14em] text-white/48 uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl leading-none font-bold tracking-[0] tabular-nums sm:text-4xl md:text-5xl",
            muted ? "text-white/45" : tone === 0 ? "text-white" : valueTone(tone)
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
