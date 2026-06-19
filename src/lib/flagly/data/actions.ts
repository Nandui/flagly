import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import type { ActionListItem } from "@/lib/flagly/types"
import { sweepOverdueActions } from "@/lib/flagly/data/incidents"

const actionInclude = {
  incident: {
    select: {
      id: true,
      reference: true,
      location: true,
      centerId: true,
      center: { select: { name: true } },
    },
  },
} satisfies Prisma.FollowUpActionInclude

type ActionWithIncident = Prisma.FollowUpActionGetPayload<{
  include: typeof actionInclude
}>

function toActionItem(action: ActionWithIncident): ActionListItem {
  return {
    id: action.id,
    description: action.description,
    assignedTo: action.assignedTo,
    dueDate: action.dueDate,
    status: action.status,
    completedAt: action.completedAt,
    completedBy: action.completedBy,
    notes: action.notes,
    incident: {
      id: action.incident.id,
      reference: action.incident.reference,
      location: action.incident.location,
      centerId: action.incident.centerId,
      centerName: action.incident.center.name,
    },
  }
}

export async function getAllActions(options?: {
  centerId?: string
}): Promise<ActionListItem[]> {
  await sweepOverdueActions(options?.centerId)

  const actions = await prisma.followUpAction.findMany({
    where: options?.centerId ? { incident: { centerId: options.centerId } } : {},
    include: actionInclude,
    orderBy: { dueDate: "asc" },
  })

  return actions.map(toActionItem)
}

export async function getOverdueActions(options?: {
  centerId?: string
}): Promise<ActionListItem[]> {
  await sweepOverdueActions(options?.centerId)

  const actions = await prisma.followUpAction.findMany({
    where: {
      status: "OVERDUE",
      ...(options?.centerId ? { incident: { centerId: options.centerId } } : {}),
    },
    include: actionInclude,
    orderBy: { dueDate: "asc" },
  })

  return actions.map(toActionItem)
}
