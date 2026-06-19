"use server"

import { revalidatePath } from "next/cache"
import { startOfDay } from "date-fns"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import {
  addFollowUpActionSchema,
  setActionStatusSchema,
  updateFollowUpActionSchema,
} from "@/lib/flagly/validation"
import { fail, fromZodError, ok } from "@/lib/flagly/actions/result"
import { mapFollowUpCreate } from "@/lib/flagly/actions/map"
import type { ActionResult } from "@/lib/flagly/types"

export async function addFollowUpAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = addFollowUpActionSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const { incidentId, ...rest } = parsed.data

  const mapped = mapFollowUpCreate(rest)
  // New actions start OVERDUE if the due date is already in the past.
  const overdue = mapped.dueDate < startOfDay(new Date())

  const created = await prisma.followUpAction.create({
    data: { incidentId, ...mapped, status: overdue ? "OVERDUE" : "OPEN" },
    select: { id: true },
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: created.id })
}

export async function updateFollowUpAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = updateFollowUpActionSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const { id, status, ...rest } = parsed.data

  const mapped = mapFollowUpCreate(rest)
  const completed = status === "COMPLETE"
  // Recompute overdue for non-complete actions based on the (possibly new) due date.
  let resolvedStatus = status
  if (!completed && status !== "OVERDUE" && mapped.dueDate < startOfDay(new Date())) {
    resolvedStatus = "OVERDUE"
  }

  const existing = await prisma.followUpAction.findUnique({
    where: { id },
    select: { completedAt: true, completedBy: true },
  })

  await prisma.followUpAction.update({
    where: { id },
    data: {
      ...mapped,
      status: resolvedStatus,
      completedAt: completed ? existing?.completedAt ?? new Date() : null,
      completedBy: completed ? existing?.completedBy ?? user.name : null,
    },
  })

  revalidatePath("/flagly", "layout")
  return ok({ id })
}

export async function setActionStatus(raw: unknown): Promise<ActionResult<{ id: string }>> {
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
      completedBy: completed ? d.completedBy ?? user.name : null,
    },
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: d.id })
}

export async function deleteFollowUpAction(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  await prisma.followUpAction.delete({ where: { id } })
  revalidatePath("/flagly", "layout")
  return ok({ id })
}
