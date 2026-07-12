import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logoutDashboardAction } from "../actions"

export function DashboardActions({ status }: { status?: string }) {
  return (
    <>
      {status ? <p className="flex h-7 items-center px-2 text-xs text-white/55">{status}</p> : null}
      <form action={logoutDashboardAction}>
        <Button type="submit">
          <LogOut data-icon="inline-start" />
          Logout
        </Button>
      </form>
    </>
  )
}
