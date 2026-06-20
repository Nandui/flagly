import type { Metadata } from "next"
import { FileWarning } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { LoginForm } from "./login-form"
import { FirstRunSetup } from "./first-run-setup"

export const metadata: Metadata = { title: "Sign in" }
export const dynamic = "force-dynamic"

export default async function LoginPage() {
  // With no users yet, show the one-time "create the first admin" setup.
  const hasUsers = (await prisma.user.count()) > 0

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-[var(--radius-card)] bg-primary text-primary-foreground">
            <FileWarning className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">
              {hasUsers ? "Sign in to Flagly" : "Welcome to Flagly"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {hasUsers
                ? "Incident reporting · Centrely suite"
                : "Create the first administrator account to get started."}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border bg-card p-6 shadow-card">
          {hasUsers ? <LoginForm /> : <FirstRunSetup />}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {hasUsers
            ? "Access is restricted to authorised staff."
            : "You can add the rest of your team once you're signed in."}
        </p>
      </div>
    </div>
  )
}
