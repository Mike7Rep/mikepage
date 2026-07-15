import { AlertCircle } from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardFrame } from "./dashboard-frame"

export function DashboardError({
  detail,
  help,
  subtitle = "Login erfolgreich, Datenquelle nicht erreichbar.",
  title,
}: {
  detail?: string
  help: string
  subtitle?: string
  title: string
}) {
  return (
    <DashboardFrame subtitle={subtitle}>
      <Card className="bg-destructive/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
            {title}
          </CardTitle>
          <CardDescription className="text-white/65">
            {help}
            {detail ? (
              <span className="mt-2 block break-words text-white/45">
                Detail: {compactDetail(detail)}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
      </Card>
    </DashboardFrame>
  )
}

function compactDetail(detail: string) {
  return detail.replace(/\s+/g, " ").trim().slice(0, 260)
}
