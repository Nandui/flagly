"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { generateIncidentReference } from "@/lib/flagly/reference"
import {
  closeIncidentSchema,
  createIncidentDraftSchema,
  createIncidentFullSchema,
  setActionStatusSchema,
  submitDraftSchema,
  updateIncidentSchema,
} from "@/lib/flagly/validation"
import { fail, fromZodError, ok } from "@/lib/flagly/actions/result"
import type { ActionResult } from "@/lib/flagly/types"
import {
  mapFollowUpCreate,
  mapInjuredCreate,
  mapWitnessCreate,
} from "@/lib/flagly/actions/map"

const MAX_REFERENCE_RETRIES = 5

function needsRiddor(severity: string): boolean {
  return severity === "REPORTABLE" || severity === "CRITICAL"
}

export async function createIncident(
  raw: unknown
): Promise<ActionResult<{ id: string; needsRiddor: boolean; status: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in to report an incident.")

  // Drafts only need the Section-1 essentials; a full submit enforces the
  // narrative minimum and the rest of the Zod contract.
  const isDraft =
    typeof raw === "object" && raw !== null && (raw as { asDraft?: unknown }).asDraft === true
  const schema = isDraft ? createIncidentDraftSchema : createIncidentFullSchema
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data
  const status = isDraft ? "DRAFT" : "OPEN"
  const riddorRequired = !isDraft && needsRiddor(d.severity)

  for (let attempt = 0; attempt < MAX_REFERENCE_RETRIES; attempt++) {
    try {
      const incident = await prisma.$transaction(async (tx) => {
        const reference = await generateIncidentReference(d.centerId, tx)
        return tx.incident.create({
          data: {
            centerId: d.centerId,
            reference,
            type: d.type,
            status,
            severity: d.severity,
            occurredAt: new Date(d.occurredAt),
            location: d.location,
            locationDetail: d.locationDetail || null,
            description: d.description,
            immediateAction: d.immediateAction || null,
            reportedBy: d.reportedBy,
            reportedById: user.id,
            riddorRequired,
            witnessCount: d.witnesses.length,
            injuredCount: d.injuredParties.length,
            witnesses: { create: d.witnesses.map(mapWitnessCreate) },
            injuredParties: { create: d.injuredParties.map(mapInjuredCreate) },
            followUpActions: { create: d.followUpActions.map(mapFollowUpCreate) },
          },
          select: { id: true, riddorRequired: true, status: true },
        })
      })

      revalidatePath("/flagly", "layout")
      return ok({
        id: incident.id,
        needsRiddor: incident.riddorRequired,
        status: incident.status,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < MAX_REFERENCE_RETRIES - 1
      ) {
        // Reference collided under concurrent creation — retry with a fresh count.
        continue
      }
      console.error("createIncident failed", error)
      return fail("Could not save the incident. Please try again.")
    }
  }

  return fail("Could not generate a unique incident reference. Please try again.")
}

export async function updateIncident(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = updateIncidentSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  const existing = await prisma.incident.findUnique({
    where: { id: d.id },
    select: { status: true, riddorRequired: true },
  })
  if (!existing) return fail("Incident not found.")

  // Don't downgrade an existing RIDDOR requirement; promote it if severity rose.
  const riddorRequired =
    existing.riddorRequired ||
    (existing.status !== "DRAFT" && needsRiddor(d.severity))

  try {
    await prisma.incident.update({
      where: { id: d.id },
      data: {
        centerId: d.centerId,
        type: d.type,
        severity: d.severity,
        occurredAt: new Date(d.occurredAt),
        location: d.location,
        locationDetail: d.locationDetail || null,
        description: d.description,
        immediateAction: d.immediateAction || null,
        reportedBy: d.reportedBy,
        riddorRequired,
      },
    })
  } catch (error) {
    console.error("updateIncident failed", error)
    return fail("Could not update the incident.")
  }

  revalidatePath("/flagly", "layout")
  return ok({ id: d.id })
}

export async function submitDraft(
  raw: unknown
): Promise<ActionResult<{ id: string; needsRiddor: boolean }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = submitDraftSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)

  const incident = await prisma.incident.findUnique({
    where: { id: parsed.data.incidentId },
    select: { id: true, status: true, severity: true, description: true, location: true },
  })
  if (!incident) return fail("Incident not found.")
  if (incident.status !== "DRAFT") return fail("This incident has already been submitted.")
  if (!incident.description || incident.description.trim().length < 10) {
    return fail("Add a fuller description (at least 10 characters) before submitting.")
  }
  if (!incident.location.trim()) return fail("A location is required before submitting.")

  const riddorRequired = needsRiddor(incident.severity)

  await prisma.incident.update({
    where: { id: incident.id },
    data: { status: "OPEN", riddorRequired },
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: incident.id, needsRiddor: riddorRequired })
}

export async function setIncidentStatus(
  incidentId: string,
  status: "OPEN" | "UNDER_INVESTIGATION"
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: { status: true },
  })
  if (!incident) return fail("Incident not found.")
  if (incident.status === "DRAFT") return fail("Submit the report before changing its status.")
  if (incident.status === "CLOSED") return fail("This incident is closed.")

  await prisma.incident.update({ where: { id: incidentId }, data: { status } })
  revalidatePath("/flagly", "layout")
  return ok({ id: incidentId })
}

export async function closeIncident(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = closeIncidentSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  const incident = await prisma.incident.findUnique({
    where: { id: d.incidentId },
    select: {
      status: true,
      followUpActions: { select: { status: true } },
    },
  })
  if (!incident) return fail("Incident not found.")
  if (incident.status !== "OPEN" && incident.status !== "UNDER_INVESTIGATION") {
    return fail("Only open or under-investigation incidents can be closed.")
  }
  const incomplete = incident.followUpActions.filter((a) => a.status !== "COMPLETE")
  if (incomplete.length > 0) {
    return fail("All follow-up actions must be complete before closing.")
  }

  await prisma.incident.update({
    where: { id: d.incidentId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: user.name,
      closureNotes: d.closureNotes,
    },
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: d.incidentId })
}

// Re-export so the follow-up table can mark actions complete from one import site.
export async function quickSetActionStatus(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = setActionStatusSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  const completed = d.status === "COMPLETE"
  await prisma.followUpAction.update({
    where: { id: d.id },
    data: {
      status: d.status,
      completedAt: completed ? new Date() : null,
      completedBy: completed ? user.name : null,
    },
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: d.id })
}
