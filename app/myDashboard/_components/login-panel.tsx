import { AlertCircle, LockKeyhole, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getDashboardAuthConfig } from "@/lib/dashboard-auth"
import { loginDashboardAction } from "../actions"

type LoginError = "failed" | "limited" | "unavailable"

export function LoginPanel({
  loginError,
  nextPath = "/myDashboard/vermoegen",
}: {
  loginError?: LoginError
  nextPath?: string
}) {
  const config = getDashboardAuthConfig()

  return (
    <main className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-clip bg-black px-0 py-12 text-white sm:px-6 sm:py-16">
      <Card className="w-full max-w-md rounded-none border-0 bg-white/[0.035] text-white ring-0 sm:rounded-lg">
        <CardHeader className="gap-5">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-3xl leading-none font-extrabold tracking-[0] uppercase">
            myDashboard
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-white/60">
            Privater Zugriff auf das Alpaca-Depot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config.configured
            ? <LoginForm loginError={loginError} nextPath={nextPath} />
            : <MissingConfig missing={config.missing} />}
        </CardContent>
      </Card>
    </main>
  )
}

function LoginForm({ loginError, nextPath }: { loginError?: LoginError; nextPath: string }) {
  return (
    <form action={loginDashboardAction} className="flex flex-col gap-5">
      <input name="next" type="hidden" value={nextPath} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="dashboard-user" className="text-white/75">User</FieldLabel>
          <Input id="dashboard-user" name="user" type="email" required autoComplete="username" className="border-white/10 bg-black/35 text-white" />
        </Field>
        <Field>
          <FieldLabel htmlFor="dashboard-password" className="text-white/75">Passwort</FieldLabel>
          <Input id="dashboard-password" name="password" type="password" required autoComplete="current-password" className="border-white/10 bg-black/35 text-white" />
          {loginError
            ? <FieldError>{loginErrorMessage(loginError)}</FieldError>
            : <FieldDescription className="text-white/45">Die Session bleibt auf diesem Gerät 10 Tage aktiv.</FieldDescription>}
        </Field>
      </FieldGroup>
      <Button className="h-9 uppercase tracking-[0.08em]" type="submit">
        <LogIn data-icon="inline-start" />
        Login
      </Button>
    </form>
  )
}

function loginErrorMessage(error: LoginError) {
  if (error === "limited") {
    return "Zu viele Versuche. Bitte in 15 Minuten erneut versuchen."
  }

  if (error === "unavailable") {
    return "Der Login-Service ist momentan nicht erreichbar. Bitte versuche es später erneut."
  }

  return "User oder Passwort stimmt nicht."
}

function MissingConfig({ missing }: { missing: string[] }) {
  return (
    <div className="flex gap-3 rounded-md bg-destructive/10 p-4 text-sm leading-6 text-white/75">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-medium text-white">Dashboard-Login ist nicht konfiguriert.</p>
        <p className="mt-1 text-white/60">Fehlende ENV-Werte: {missing.join(", ")}</p>
      </div>
    </div>
  )
}
