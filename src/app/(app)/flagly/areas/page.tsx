import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Map } from "lucide-react"

import { requireUser } from "@/lib/session"
import { isAdmin } from "@/lib/centrely/roles"
import { getActiveCenter } from "@/lib/centrely/active-center"
import { getAreaTree } from "@/lib/flagly/data/areas"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { AreasManager } from "@/components/flagly/areas/AreasManager"

export const metadata: Metadata = { title: "Areas" }

export default async function AreasPage({
  searchParams,
}: {
  searchParams: Promise<{ center?: string }>
}) {
  const user = await requireUser()
  if (!isAdmin(user.role)) redirect("/flagly")

  const { center } = await searchParams
  const { active, centers } = await getActiveCenter(user)

  if (centers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Areas"
          description="Define the areas and sub-areas incidents are reported against, per centre."
        />
        <EmptyState
          icon={Map}
          title="No centres yet."
          description="Add a centre first, then define its areas and sub-areas."
        />
      </div>
    )
  }

  const selectedId =
    center && centers.some((c) => c.id === center)
      ? center
      : (active?.id ?? centers[0].id)

  const areas = await getAreaTree(selectedId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Areas"
        description="Define the areas and sub-areas incidents are reported against. These power the location pickers on the incident form."
      />
      <AreasManager centers={centers} centerId={selectedId} areas={areas} />
    </div>
  )
}
