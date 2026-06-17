import Link from "next/link"
import { LogOut, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logoutDashboardAction } from "../actions"

export function DashboardActions({ refreshHref = "/myDashboard/depot" }: { refreshHref?: string }) {
  return (
    <>
      <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
        <Link href={refreshHref}>
          <RefreshCw data-icon="inline-start" />
          Aktualisieren
        </Link>
      </Button>
      <form action={logoutDashboardAction}>
        <Button variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" type="submit">
          <LogOut data-icon="inline-start" />
          Logout
        </Button>
      </form>
    </>
  )
}
