import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { requireUser } from "@/lib/session"
import { getCentersWithCounts } from "@/lib/flagly/data/centers"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { CentresManager } from "@/components/flagly/centres/CentresManager"

export const metadata: Metadata = { title: "Centres" }

export default async function CentresPage() {
  const user = await requireUser()
  if (user.role !== "Admin") redirect("/flagly")

  const centers = await getCentersWithCounts()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centres"
        description="Manage the sites incidents are reported against. The site code sets each centre's incident reference prefix."
      />
      <CentresManager centers={centers} />
    </div>
  )
}
