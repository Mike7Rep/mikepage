import { AlertCircle, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logoutDashboardAction } from "../actions"
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
    <DashboardFrame actions={<LogoutButton />} subtitle={subtitle}>
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

function LogoutButton() {
  return (
    <form action={logoutDashboardAction}>
      <Button type="submit">
        <LogOut data-icon="inline-start" />
        Logout
      </Button>
    </form>
  )
}
