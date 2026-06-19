import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getFlaglyContext } from "@/lib/flagly/context"
import { getIncidentDetail } from "@/lib/flagly/data/incidents"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { IncidentForm } from "@/components/flagly/incidents/IncidentForm"

export const metadata: Metadata = { title: "Edit incident" }

export default async function EditIncidentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, activeCenter, centers } = await getFlaglyContext()

  const incident = await getIncidentDetail(id)
  if (!incident) notFound()

  return (
    <div>
      <div className="mx-auto w-full max-w-[760px]">
        <PageHeader
          title={`Edit ${incident.reference}`}
          description="Update the core incident details. People and follow-up actions are managed from the incident page."
          backHref={`/flagly/incidents/${incident.id}`}
          backLabel="Back to incident"
          className="mb-6"
        />
      </div>
      <IncidentForm
        mode="edit"
        centers={centers}
        defaultCenterId={activeCenter?.id ?? null}
        defaultReportedBy={user.name}
        initial={{
          id: incident.id,
          centerId: incident.centerId,
          type: incident.type,
          severity: incident.severity,
          occurredAt: incident.occurredAt,
          location: incident.location,
          locationDetail: incident.locationDetail,
          description: incident.description,
          immediateAction: incident.immediateAction,
          reportedBy: incident.reportedBy,
        }}
      />
    </div>
  )
}
