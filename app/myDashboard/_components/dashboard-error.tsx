import { AlertCircle, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logoutDashboardAction } from "../actions"
import { DashboardFrame } from "./dashboard-frame"

export function DashboardError({ message }: { message: string }) {
  return (
    <DashboardFrame actions={<LogoutButton />} subtitle="Login erfolgreich, Python API nicht erreichbar.">
      <Card className="border-destructive/30 bg-destructive/10 text-white ring-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
            Depot-Daten konnten nicht geladen werden
          </CardTitle>
          <CardDescription className="text-white/65">
            Die Anmeldung hat funktioniert. Bitte pruefe die Python API, `PYTHON_API_URL`,
            `PYTHON_API_TOKEN` und die Alpaca-Verbindung. Detail: {message}
          </CardDescription>
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
