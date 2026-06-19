"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileWarning } from "lucide-react"

import { cn } from "@/lib/utils"
import { MODULE_NAV } from "@/lib/centrely/modules"

function isActive(pathname: string, href: string): boolean {
  if (href === "/flagly") return pathname === "/flagly"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function FlaglySidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const nav = MODULE_NAV.flagly

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileWarning className="size-4.5" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base font-semibold">Flagly</p>
          <p className="text-[11px] text-muted-foreground">Centrely suite</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/flagly/incidents/new"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FileWarning className="size-4" />
          Report incident
        </Link>
      </div>
    </div>
  )
}
