"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import {
  createRiddorFlagSchema,
  markReportedSchema,
} from "@/lib/flagly/validation"
import { computeDeadline, findRule } from "@/lib/flagly/deadline"
import { fail, fromZodError, ok } from "@/lib/flagly/actions/result"
import type { ActionResult } from "@/lib/flagly/types"

export async function createRiddorFlag(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = createRiddorFlagSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  const incident = await prisma.incident.findUnique({
    where: { id: d.incidentId },
    select: { occurredAt: true },
  })
  if (!incident) return fail("Incident not found.")

  // Recompute the deadline server-side from the legally-defined rules; fall back
  // to the client value only if no matching rule is found.
  const rule = findRule(d.authority, d.classification)
  const reportingDeadline = rule
    ? computeDeadline(incident.occurredAt, rule)
    : new Date(d.reportingDeadline)
  const status = reportingDeadline < new Date() ? "OVERDUE" : "PENDING"

  const flag = await prisma.$transaction(async (tx) => {
    const result = await tx.riddorFlag.upsert({
      where: { incidentId: d.incidentId },
      create: {
        incidentId: d.incidentId,
        authority: d.authority,
        classification: d.classification,
        reportingDeadline,
        status,
        notes: d.notes,
      },
      update: {
        authority: d.authority,
        classification: d.classification,
        reportingDeadline,
        notes: d.notes,
      },
      select: { id: true },
    })
    await tx.incident.update({
      where: { id: d.incidentId },
      data: { riddorRequired: true },
    })
    return result
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: flag.id })
}

export async function markReported(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = markReportedSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  await prisma.riddorFlag.update({
    where: { id: d.riddorFlagId },
    data: {
      status: "REPORTED",
      reportedAt: new Date(d.reportedAt),
      referenceNumber: d.referenceNumber || null,
      reportedBy: d.reportedBy,
      method: d.method,
      notes: d.notes,
    },
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: d.riddorFlagId })
}

export async function updateRiddorNotes(
  id: string,
  notes: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  await prisma.riddorFlag.update({
    where: { id },
    data: { notes: notes.slice(0, 2000) },
  })
  revalidatePath("/flagly", "layout")
  return ok({ id })
}
