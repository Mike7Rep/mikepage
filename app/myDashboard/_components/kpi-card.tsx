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
    <Card className="border-white/10 bg-white/[0.035] text-white ring-white/10">
      <CardHeader>
        <CardTitle className="text-xs font-medium tracking-[0.14em] text-white/48 uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-4xl leading-none font-bold tracking-[0] md:text-5xl",
            muted ? "text-white/45" : tone === 0 ? "text-white" : valueTone(tone)
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
