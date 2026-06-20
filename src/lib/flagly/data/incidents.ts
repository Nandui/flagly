import { startOfDay } from "date-fns"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import type { IncidentDetail, IncidentListItem } from "@/lib/flagly/types"

// ─── Overdue sweep ────────────────────────────────────────────────────────────────
// Stored OVERDUE status lets us query efficiently. We refresh it on read: any
// OPEN/IN_PROGRESS action past its due date becomes OVERDUE.

export async function sweepOverdueActions(centerId?: string): Promise<void> {
  const today = startOfDay(new Date())
  await prisma.followUpAction.updateMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
      dueDate: { lt: today },
      ...(centerId ? { incident: { centerId } } : {}),
    },
    data: { status: "OVERDUE" },
  })
}

// ─── List ────────────────────────────────────────────────────────────────────────

const listInclude = {
  center: { select: { id: true, name: true, siteCode: true } },
  _count: { select: { injuredParties: true, witnesses: true } },
  followUpActions: { select: { status: true } },
} satisfies Prisma.IncidentInclude

type IncidentWithList = Prisma.IncidentGetPayload<{ include: typeof listInclude }>

function toListItem(incident: IncidentWithList): IncidentListItem {
  const totalActionCount = incident.followUpActions.length
  const openActionCount = incident.followUpActions.filter(
    (a) => a.status !== "COMPLETE"
  ).length

  return {
    id: incident.id,
    reference: incident.reference,
    type: incident.type,
    severity: incident.severity,
    status: incident.status,
    location: incident.location,
    locationDetail: incident.locationDetail,
    occurredAt: incident.occurredAt,
    reportedBy: incident.reportedBy,
    centerId: incident.centerId,
    centerName: incident.center.name,
    centerSiteCode: incident.center.siteCode,
    injuredCount: incident._count.injuredParties,
    witnessCount: incident._count.witnesses,
    openActionCount,
    totalActionCount,
  }
}

export async function getIncidents(options?: {
  centerId?: string
  statuses?: Prisma.IncidentWhereInput["status"]
}): Promise<IncidentListItem[]> {
  await sweepOverdueActions(options?.centerId)

  const incidents = await prisma.incident.findMany({
    where: {
      ...(options?.centerId ? { centerId: options.centerId } : {}),
      ...(options?.statuses ? { status: options.statuses } : {}),
    },
    include: listInclude,
    orderBy: { occurredAt: "desc" },
  })

  return incidents.map(toListItem)
}

// ─── Detail ────────────────────────────────────────────────────────────────────

export async function getIncidentDetail(id: string): Promise<IncidentDetail | null> {
  // Refresh this incident's overdue actions before reading.
  const today = startOfDay(new Date())
  await prisma.followUpAction.updateMany({
    where: {
      incidentId: id,
      status: { in: ["OPEN", "IN_PROGRESS"] },
      dueDate: { lt: today },
    },
    data: { status: "OVERDUE" },
  })

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      center: true,
      witnesses: { orderBy: { createdAt: "asc" } },
      injuredParties: { orderBy: { createdAt: "asc" } },
      followUpActions: { orderBy: { dueDate: "asc" } },
    },
  })

  return incident
}

export async function incidentExists(id: string): Promise<boolean> {
  const count = await prisma.incident.count({ where: { id } })
  return count > 0
}
