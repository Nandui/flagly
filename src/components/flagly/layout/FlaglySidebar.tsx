"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, FileWarning, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { MODULE_NAV, type NavItem } from "@/lib/centrely/modules"
import { CenterSwitcher } from "@/components/flagly/layout/CenterSwitcher"
import { ThemeToggle } from "@/components/flagly/layout/ThemeToggle"
import { logout } from "@/lib/centrely/auth-actions"
import type { CenterSummary } from "@/lib/centrely/active-center"

function isActive(pathname: string, href: string): boolean {
  if (href === "/flagly") return pathname === "/flagly"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function initials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

const ADMIN_NAV: NavItem[] = [
  { href: "/flagly/centres", label: "Centres", icon: Building2, cap: "admin" },
]

export function FlaglySidebar({
  user,
  centers,
  activeCenterId,
}: {
  user: { name: string; email: string; role: string }
  centers: CenterSummary[]
  activeCenterId: string | null
}) {
  const pathname = usePathname()
  const nav = MODULE_NAV.flagly
  const isAdmin = user.role === "Admin"

  return (
    <Sidebar>
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-2.5 px-2 pt-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileWarning className="size-5" />
          </div>
          <div className="leading-none">
            <span className="block font-display text-base font-semibold tracking-tight text-foreground">
              Flagly
            </span>
            <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Incident reporting
            </span>
          </div>
        </div>
        <div className="px-1">
          <CenterSwitcher centers={centers} activeCenterId={activeCenterId} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {initials(user.name || user.email)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-[0.7rem] text-muted-foreground">{user.role}</p>
          </div>
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
