"use client"

import * as React from "react"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { FlaglySidebar } from "@/components/flagly/layout/FlaglySidebar"
import { CenterSwitcher } from "@/components/flagly/layout/CenterSwitcher"
import { ThemeToggle } from "@/components/flagly/layout/ThemeToggle"
import { UserMenu } from "@/components/flagly/layout/UserMenu"
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
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r bg-card lg:block">
        <FlaglySidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <FlaglySidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>

          <div className="flex-1" />

          <CenterSwitcher centers={centers} activeCenterId={activeCenterId} />
          <ThemeToggle />
          <UserMenu name={user.name} email={user.email} role={user.role} />
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
