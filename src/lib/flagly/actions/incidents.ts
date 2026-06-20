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

// Resolve the chosen area/sub-area to validated ids + denormalised names, or an
// error string if they don't belong to the given centre.
async function resolveLocation(
  centerId: string,
  areaId: string,
  subAreaId: string | undefined
): Promise<
  | { ok: true; location: string; locationDetail: string | null; subAreaId: string | null }
  | { ok: false; error: string }
> {
  const area = await prisma.area.findFirst({
    where: { id: areaId, centerId },
    select: { name: true },
  })
  if (!area) return { ok: false, error: "Select a valid area for this centre." }

  if (!subAreaId) {
    return { ok: true, location: area.name, locationDetail: null, subAreaId: null }
  }

  const sub = await prisma.subArea.findFirst({
    where: { id: subAreaId, areaId },
    select: { name: true },
  })
  if (!sub) return { ok: false, error: "Select a valid sub-area for this area." }

  return { ok: true, location: area.name, locationDetail: sub.name, subAreaId }
}

export async function createIncident(
  raw: unknown
): Promise<ActionResult<{ id: string; status: string }>> {
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

  const loc = await resolveLocation(d.centerId, d.areaId, d.subAreaId)
  if (!loc.ok) return fail(loc.error)

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
            areaId: d.areaId,
            subAreaId: loc.subAreaId,
            location: loc.location,
            locationDetail: loc.locationDetail,
            description: d.description,
            immediateAction: d.immediateAction || null,
            reportedBy: d.reportedBy,
            reportedById: user.id,
            witnessCount: d.witnesses.length,
            injuredCount: d.injuredParties.length,
            witnesses: { create: d.witnesses.map(mapWitnessCreate) },
            injuredParties: { create: d.injuredParties.map(mapInjuredCreate) },
            followUpActions: { create: d.followUpActions.map(mapFollowUpCreate) },
          },
          select: { id: true, status: true },
        })
      })

      revalidatePath("/flagly", "layout")
      return ok({ id: incident.id, status: incident.status })
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
    select: { status: true },
  })
  if (!existing) return fail("Incident not found.")

  const loc = await resolveLocation(d.centerId, d.areaId, d.subAreaId)
  if (!loc.ok) return fail(loc.error)

  try {
    await prisma.incident.update({
      where: { id: d.id },
      data: {
        centerId: d.centerId,
        type: d.type,
        severity: d.severity,
        occurredAt: new Date(d.occurredAt),
        areaId: d.areaId,
        subAreaId: loc.subAreaId,
        location: loc.location,
        locationDetail: loc.locationDetail,
        description: d.description,
        immediateAction: d.immediateAction || null,
        reportedBy: d.reportedBy,
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
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = submitDraftSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)

  const incident = await prisma.incident.findUnique({
    where: { id: parsed.data.incidentId },
    select: { id: true, status: true, description: true, location: true },
  })
  if (!incident) return fail("Incident not found.")
  if (incident.status !== "DRAFT") return fail("This incident has already been submitted.")
  if (!incident.description || incident.description.trim().length < 10) {
    return fail("Add a fuller description (at least 10 characters) before submitting.")
  }
  if (!incident.location.trim()) return fail("A location is required before submitting.")

  await prisma.incident.update({
    where: { id: incident.id },
    data: { status: "OPEN" },
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: incident.id })
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

export async function deleteIncident(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")
  if (user.role !== "Admin") return fail("Only admins can delete incidents.")

  const incident = await prisma.incident.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!incident) return fail("Incident not found.")

  try {
    // Witnesses, injured parties and follow-up actions cascade on delete.
    await prisma.incident.delete({ where: { id } })
  } catch (error) {
    console.error("deleteIncident failed", error)
    return fail("Could not delete the incident.")
  }

  revalidatePath("/flagly", "layout")
  return ok({ id })
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
