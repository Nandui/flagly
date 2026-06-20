import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { requireUser } from "@/lib/session"
import { isAdmin } from "@/lib/centrely/roles"
import { getUsers } from "@/lib/flagly/data/users"
import { listCenters } from "@/lib/centrely/active-center"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { UsersManager } from "@/components/flagly/users/UsersManager"

export const metadata: Metadata = { title: "Users" }

export default async function UsersPage() {
  const current = await requireUser()
  if (!isAdmin(current.role)) redirect("/flagly")

  const [users, centers] = await Promise.all([getUsers(), listCenters()])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage who can sign in to Flagly, their role, and the centre they belong to."
      />
      <UsersManager users={users} centers={centers} currentUserId={current.id} />
    </div>
  )
}
