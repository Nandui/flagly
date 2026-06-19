"use client"

import { useActionState } from "react"
import { FileWarning, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticate } from "./actions"

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(authenticate, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileWarning className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Flagly</h1>
            <p className="text-sm text-muted-foreground">
              Incident reporting · Centrely suite
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@centre.ie"
                defaultValue="manager@leisureworld.ie"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue="password123"
                required
              />
            </div>

            {error ? (
              <p className="text-sm font-medium text-destructive">{error}</p>
            ) : null}

            <Button type="submit" disabled={pending} className="mt-1 w-full">
              {pending ? <Loader2 className="animate-spin" /> : null}
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo login · manager@leisureworld.ie / password123
        </p>
      </div>
    </div>
  )
}
