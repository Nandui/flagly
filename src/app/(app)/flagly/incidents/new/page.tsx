import type { Metadata } from "next"

import { getFlaglyContext } from "@/lib/flagly/context"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { IncidentForm } from "@/components/flagly/incidents/IncidentForm"

export const metadata: Metadata = { title: "Report incident" }

export default async function NewIncidentPage() {
  const { user, activeCenter, centers } = await getFlaglyContext()

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
        defaultCenterId={activeCenter?.id ?? null}
        defaultReportedBy={user.name}
      />
    </div>
  )
}
