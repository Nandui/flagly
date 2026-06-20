"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <FlaglySidebar user={user} centers={centers} activeCenterId={activeCenterId} />
      <SidebarInset className="bg-canvas">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-canvas/70 px-4 backdrop-blur lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/flagly/incidents/new">
                <Plus className="size-4" />
                Report incident
              </Link>
            </Button>
          </div>
        </header>

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
      </SidebarInset>
    </SidebarProvider>
  )
}
