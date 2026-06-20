import type { Metadata } from "next"

import { getFlaglyContext } from "@/lib/flagly/context"
import { isAdmin } from "@/lib/centrely/roles"
import { getAreaOptions } from "@/lib/flagly/data/areas"
import { getUserOptions } from "@/lib/flagly/data/users"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { IncidentForm } from "@/components/flagly/incidents/IncidentForm"

export const metadata: Metadata = { title: "Report incident" }

export default async function NewIncidentPage() {
  const { user, activeCenter, centers } = await getFlaglyContext()
  const admin = isAdmin(user.role)
  const [areas, users] = await Promise.all([
    getAreaOptions(),
    admin ? getUserOptions() : Promise.resolve([]),
  ])

  return (
    <div>
      <div className="mx-auto w-full max-w-[760px]">
        <PageHeader
          title="Report an incident"
          description="Capture what happened. Save a draft at any time, or submit the full report."
          backHref="/flagly/incidents"
          backLabel="All incidents"
          className="mb-6"
        />
      </div>
      <IncidentForm
        mode="create"
        centers={centers}
        areas={areas}
        users={users}
        currentUser={{ id: user.id, name: user.name }}
        isAdmin={admin}
        defaultCenterId={activeCenter?.id ?? null}
      />
    </div>
  )
}
