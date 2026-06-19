import {
  LayoutDashboard,
  FileWarning,
  AlertTriangle,
  CheckSquare,
  type LucideIcon,
} from "lucide-react"

export type Capability = "view" | "edit" | "admin"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  cap: Capability
}

// Per-module sidebar navigation. Flagly is the only module shipped in this app,
// but the registry mirrors the rest of the Centrely suite so adding modules later
// is a one-line change.
export const MODULE_NAV: Record<string, NavItem[]> = {
  flagly: [
    { href: "/flagly", label: "Dashboard", icon: LayoutDashboard, cap: "view" },
    { href: "/flagly/incidents", label: "All Incidents", icon: FileWarning, cap: "view" },
    { href: "/flagly/riddor", label: "RIDDOR / HSA", icon: AlertTriangle, cap: "view" },
    { href: "/flagly/actions", label: "Follow-up Actions", icon: CheckSquare, cap: "view" },
  ],
}

export type ModuleDef = {
  id: string
  label: string
  description: string
  href: string
  icon: LucideIcon
}

const MODULES: ModuleDef[] = [
  {
    id: "flagly",
    label: "Flagly",
    description: "Incident reporting",
    href: "/flagly",
    icon: FileWarning,
  },
]

// In v1, any authenticated user can view every installed module. Capability
// gating per role is wired through `cap` so it can be tightened later.
export function getAccessibleModules(_role?: string): ModuleDef[] {
  return MODULES
}

const CAP_RANK: Record<Capability, number> = { view: 0, edit: 1, admin: 2 }
const ROLE_CAP: Record<string, Capability> = {
  Viewer: "view",
  Contributor: "edit",
  Reviewer: "edit",
  Assessor: "edit",
  Admin: "admin",
}

export function hasCapability(role: string, required: Capability): boolean {
  const granted = ROLE_CAP[role] ?? "view"
  return CAP_RANK[granted] >= CAP_RANK[required]
}
