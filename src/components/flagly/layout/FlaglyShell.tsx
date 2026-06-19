"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { FileWarning, Menu, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FlaglySidebar } from "@/components/flagly/layout/FlaglySidebar"
import type { CenterSummary } from "@/lib/centrely/active-center"

export function FlaglyShell({
  user,
  centers,
  activeCenterId,
  children,
}: {
  user: { name: string; email: string; role: string }
  centers: CenterSummary[]
  activeCenterId: string | null
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-2"
        >
          <Menu className="size-5" />
        </button>
        <span className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileWarning className="size-4" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-ink">
            Flagly
          </span>
        </span>
        <Link
          href="/flagly/incidents/new"
          aria-label="Report incident"
          className="ml-auto flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        >
          <Plus className="size-5" />
        </Link>
      </header>

      {/* Mobile overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[1px] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-sidebar-line bg-sidebar transition-transform duration-200 ease-out",
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
          className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-2 hover:text-ink md:hidden"
        >
          <X className="size-5" />
        </button>
        <FlaglySidebar
          user={user}
          centers={centers}
          activeCenterId={activeCenterId}
          onNavigate={() => setOpen(false)}
        />
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 hidden h-14 shrink-0 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur md:flex lg:px-8">
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/flagly/incidents/new">
                <Plus className="size-4" />
                Report incident
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
