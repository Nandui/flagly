import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireUser } from "@/lib/session"
import { getIncidentDetail } from "@/lib/flagly/data/incidents"
import { IncidentDetailView } from "@/components/flagly/incidents/IncidentDetailView"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const incident = await getIncidentDetail(id)
  return { title: incident ? incident.reference : "Incident" }
}

export default async function IncidentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const user = await requireUser()

  const incident = await getIncidentDetail(id)
  if (!incident) notFound()

  return (
    <IncidentDetailView
      incident={incident}
      currentUserName={user.name}
      isAdmin={user.role === "Admin"}
      initialTab={tab}
    />
  )
}
