import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import type { RiddorListItem } from "@/lib/flagly/types"
import { sweepOverdueRiddor } from "@/lib/flagly/data/incidents"

const riddorInclude = {
  incident: {
    select: {
      id: true,
      reference: true,
      location: true,
      occurredAt: true,
      type: true,
      centerId: true,
      center: { select: { name: true } },
    },
  },
} satisfies Prisma.RiddorFlagInclude

type RiddorWithIncident = Prisma.RiddorFlagGetPayload<{
  include: typeof riddorInclude
}>

function toRiddorItem(flag: RiddorWithIncident): RiddorListItem {
  return {
    id: flag.id,
    authority: flag.authority,
    classification: flag.classification,
    reportingDeadline: flag.reportingDeadline,
    status: flag.status,
    reportedAt: flag.reportedAt,
    referenceNumber: flag.referenceNumber,
    reportedBy: flag.reportedBy,
    method: flag.method,
    notes: flag.notes,
    incident: {
      id: flag.incident.id,
      reference: flag.incident.reference,
      location: flag.incident.location,
      occurredAt: flag.incident.occurredAt,
      type: flag.incident.type,
      centerId: flag.incident.centerId,
      centerName: flag.incident.center.name,
    },
  }
}

export async function getRiddorFlags(options?: {
  centerId?: string
}): Promise<RiddorListItem[]> {
  await sweepOverdueRiddor()

  const flags = await prisma.riddorFlag.findMany({
    where: options?.centerId
      ? { incident: { centerId: options.centerId } }
      : {},
    include: riddorInclude,
    orderBy: { reportingDeadline: "asc" },
  })

  return flags.map(toRiddorItem)
}

export type RiddorCounts = {
  pending: number
  reported: number
  overdue: number
}

export async function getRiddorCounts(options?: {
  centerId?: string
}): Promise<RiddorCounts> {
  await sweepOverdueRiddor()
  const scope: Prisma.RiddorFlagWhereInput = options?.centerId
    ? { incident: { centerId: options.centerId } }
    : {}

  const [pending, reported, overdue] = await Promise.all([
    prisma.riddorFlag.count({ where: { ...scope, status: "PENDING" } }),
    prisma.riddorFlag.count({ where: { ...scope, status: "REPORTED" } }),
    prisma.riddorFlag.count({ where: { ...scope, status: "OVERDUE" } }),
  ])

  return { pending, reported, overdue }
}
