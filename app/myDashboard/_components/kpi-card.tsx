import type { ComponentType } from "react"

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { valueTone } from "../format"

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>

export function KpiCard({
  description,
  icon: Icon,
  muted = false,
  title,
  tone = 0,
  value,
}: {
  description: string
  icon: IconComponent
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
        <CardAction>
          <div className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-black/25 text-primary">
            <Icon className="size-4" aria-hidden={true} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div
          className={cn(
            "text-2xl leading-none font-bold tracking-[0]",
            muted ? "text-white/45" : tone === 0 ? "text-white" : valueTone(tone)
          )}
        >
          {value}
        </div>
        <p className="text-xs leading-5 text-white/45">{description}</p>
      </CardContent>
    </Card>
  )
}
