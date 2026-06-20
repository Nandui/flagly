// Centrely roles for Flagly. The Operations Manager is the admin-equivalent —
// they manage centres, areas and users, delete incidents and reassign reporters.
// This is the single source of truth for roles and the admin check; never compare
// `role === "Admin"` directly.

export const USER_ROLES = [
  "Operations Manager",
  "CEO",
  "Duty Manager",
  "Shift Supervisor",
  "Department Supervisor",
] as const

export type UserRole = (typeof USER_ROLES)[number]

// Roles that carry admin privileges.
export const ADMIN_ROLES = ["Operations Manager"] as const

// The role assigned to the first/bootstrap administrator.
export const PRIMARY_ADMIN_ROLE: UserRole = "Operations Manager"

// A safe, least-privileged default for new or unknown users.
export const DEFAULT_ROLE: UserRole = "Duty Manager"

export function isAdmin(role: string | null | undefined): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role)
}

export const USER_ROLE_OPTIONS = USER_ROLES.map((role) => ({
  value: role,
  label: role,
}))
