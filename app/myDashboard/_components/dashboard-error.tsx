import { AlertCircle, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logoutDashboardAction } from "../actions"
import { DashboardFrame } from "./dashboard-frame"

export function DashboardError({ message }: { message: string }) {
  return (
    <DashboardFrame actions={<LogoutButton />} subtitle="Python API oder Alpaca-Daten konnten nicht geladen werden.">
      <Card className="border-destructive/30 bg-destructive/10 text-white ring-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
            Verbindung prüfen
          </CardTitle>
          <CardDescription className="text-white/65">{message}</CardDescription>
        </CardHeader>
      </Card>
    </DashboardFrame>
  )
}

function LogoutButton() {
  return (
    <form action={logoutDashboardAction}>
      <Button variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" type="submit">
        <LogOut data-icon="inline-start" />
        Logout
      </Button>
    </form>
  )
}
