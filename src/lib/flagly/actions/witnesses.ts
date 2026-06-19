"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { addWitnessSchema, updateWitnessSchema } from "@/lib/flagly/validation"
import { fail, fromZodError, ok } from "@/lib/flagly/actions/result"
import { mapWitnessCreate } from "@/lib/flagly/actions/map"
import type { ActionResult } from "@/lib/flagly/types"

export async function addWitness(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = addWitnessSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const { incidentId, ...rest } = parsed.data

  const created = await prisma.$transaction(async (tx) => {
    const witness = await tx.witness.create({
      data: { incidentId, ...mapWitnessCreate(rest) },
      select: { id: true },
    })
    await tx.incident.update({
      where: { id: incidentId },
      data: { witnessCount: { increment: 1 } },
    })
    return witness
  })

  revalidatePath("/flagly", "layout")
  return ok({ id: created.id })
}

export async function updateWitness(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const parsed = updateWitnessSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const { id, ...rest } = parsed.data

  await prisma.witness.update({ where: { id }, data: mapWitnessCreate(rest) })
  revalidatePath("/flagly", "layout")
  return ok({ id })
}

export async function deleteWitness(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail("You must be signed in.")

  const witness = await prisma.witness.findUnique({
    where: { id },
    select: { incidentId: true },
  })
  if (!witness) return fail("Witness not found.")

  await prisma.$transaction(async (tx) => {
    await tx.witness.delete({ where: { id } })
    await tx.incident.update({
      where: { id: witness.incidentId },
      data: { witnessCount: { decrement: 1 } },
    })
  })

  revalidatePath("/flagly", "layout")
  return ok({ id })
}
