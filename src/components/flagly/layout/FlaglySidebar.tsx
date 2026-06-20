"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, FileWarning, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { MODULE_NAV, type NavItem } from "@/lib/centrely/modules"
import { CenterSwitcher } from "@/components/flagly/layout/CenterSwitcher"
import { ThemeToggle } from "@/components/flagly/layout/ThemeToggle"
import { logout } from "@/lib/centrely/auth-actions"
import type { CenterSummary } from "@/lib/centrely/active-center"

function isActive(pathname: string, href: string): boolean {
  if (href === "/flagly") return pathname === "/flagly"
  return pathname === href || pathname.startsWith(`${href}/`)
}

const ADMIN_NAV: NavItem[] = [
  { href: "/flagly/centres", label: "Centres", icon: Building2, cap: "admin" },
]

function initials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card"
          : "text-sidebar-ink/80 hover:bg-sidebar-2 hover:text-sidebar-ink"
      )}
    >
      <Icon
        className={cn(
          "size-[1.15rem] shrink-0",
          active
            ? "text-sidebar-accent-foreground"
            : "text-sidebar-muted group-hover:text-sidebar-ink"
        )}
      />
      {item.label}
    </Link>
  )
}

export function FlaglySidebar({
  user,
  centers,
  activeCenterId,
  onNavigate,
}: {
  user: { name: string; email: string; role: string }
  centers: CenterSummary[]
  activeCenterId: string | null
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const nav = MODULE_NAV.flagly
  const isAdmin = user.role === "Admin"

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileWarning className="size-5" />
        </div>
        <div className="leading-none">
          <span className="block font-display text-lg font-semibold tracking-tight text-sidebar-ink">
            Flagly
          </span>
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
            Incident reporting
          </span>
        </div>
      </div>

      {/* Centre switcher */}
      <div className="px-3 pb-2">
        <CenterSwitcher centers={centers} activeCenterId={activeCenterId} />
      </div>

      {/* Nav */}
      <nav className="scroll-slim flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {nav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}

        {isAdmin ? (
          <>
            <p className="px-3 pb-1 pt-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
              Admin
            </p>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </>
        ) : null}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-line p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-2 text-xs font-semibold text-sidebar-ink">
            {initials(user.name || user.email)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-sidebar-ink">{user.name}</p>
            <p className="truncate text-[0.7rem] text-sidebar-muted">{user.role}</p>
          </div>
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="flex size-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-2 hover:text-sidebar-ink"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
