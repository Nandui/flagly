"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { isAdmin } from "@/lib/centrely/roles"
import { createCenterSchema, updateCenterSchema } from "@/lib/flagly/validation"
import { fail, fromZodError, ok } from "@/lib/flagly/actions/result"
import type { ActionResult } from "@/lib/flagly/types"

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: "You must be signed in." }
  if (!isAdmin(user.role))
    return { ok: false as const, error: "Only the Operations Manager can manage centres." }
  return { ok: true as const, user }
}

const DUPLICATE_SITE_CODE = "That site code is already in use."

export async function createCenter(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const parsed = createCenterSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  try {
    const center = await prisma.center.create({
      data: {
        name: d.name.trim(),
        siteCode: d.siteCode ?? null,
        region: d.region,
        address: d.address?.trim() || null,
      },
      select: { id: true },
    })
    revalidatePath("/flagly", "layout")
    return ok({ id: center.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(DUPLICATE_SITE_CODE)
    }
    console.error("createCenter failed", error)
    return fail("Could not create the centre.")
  }
}

export async function updateCenter(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const parsed = updateCenterSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  try {
    await prisma.center.update({
      where: { id: d.id },
      data: {
        name: d.name.trim(),
        siteCode: d.siteCode ?? null,
        region: d.region,
        address: d.address?.trim() || null,
      },
    })
    revalidatePath("/flagly", "layout")
    return ok({ id: d.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(DUPLICATE_SITE_CODE)
    }
    console.error("updateCenter failed", error)
    return fail("Could not update the centre.")
  }
}

export async function deleteCenter(id: string): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const incidentCount = await prisma.incident.count({ where: { centerId: id } })
  if (incidentCount > 0) {
    return fail("This centre has incidents and cannot be deleted.")
  }

  try {
    await prisma.center.delete({ where: { id } })
    revalidatePath("/flagly", "layout")
    return ok({ id })
  } catch (error) {
    console.error("deleteCenter failed", error)
    return fail("Could not delete the centre.")
  }
}
