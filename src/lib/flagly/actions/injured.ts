"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import {
  addInjuredPartySchema,
  updateInjuredPartySchema,
} from "@/lib/flagly/validation"
import { fail, fromZodError, ok } from "@/lib/flagly/actions/result"
import { mapInjuredCreate } from "@/lib/flagly/actions/map"
import type { ActionResult } from "@/lib/flagly/types"

export async function addInjuredParty(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = addInjuredPartySchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const { incidentId, ...rest } = parsed.data

  const created = await prisma.$transaction(async (tx) => {
    const party = await tx.injuredParty.create({
      data: { incidentId, ...mapInjuredCreate(rest) },
      select: { id: true },
    })
    await tx.incident.update({
      where: { id: incidentId },
      data: { injuredCount: { increment: 1 } },
    })
    return party
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: created.id })
}

export async function updateInjuredParty(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = updateInjuredPartySchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const { id, ...rest } = parsed.data

  await prisma.injuredParty.update({ where: { id }, data: mapInjuredCreate(rest) })
  revalidatePath("/flagly", "layout")
  return ok({ id })
}

export async function deleteInjuredParty(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const party = await prisma.injuredParty.findUnique({
    where: { id },
    select: { incidentId: true },
  })
  if (!party) return fail("Injured party not found.")

  await prisma.$transaction(async (tx) => {
    await tx.injuredParty.delete({ where: { id } })
    await tx.incident.update({
      where: { id: party.incidentId },
      data: { injuredCount: { decrement: 1 } },
    })
  })

  revalidatePath("/flagly", "layout")
  return ok({ id })
}
