"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import {
  createAreaSchema,
  createSubAreaSchema,
  updateAreaSchema,
  updateSubAreaSchema,
} from "@/lib/flagly/validation"
import { fail, fromZodError, ok } from "@/lib/flagly/actions/result"
import type { ActionResult } from "@/lib/flagly/types"

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: "You must be signed in." }
  if (user.role !== "Admin")
    return { ok: false as const, error: "Only admins can manage areas." }
  return { ok: true as const, user }
}

const DUPLICATE_AREA = "An area with that name already exists in this centre."
const DUPLICATE_SUBAREA = "A sub-area with that name already exists in this area."

// ─── Area ──────────────────────────────────────────────────────────────────────

export async function createArea(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const parsed = createAreaSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  try {
    const area = await prisma.area.create({
      data: { centerId: d.centerId, name: d.name },
      select: { id: true },
    })
    revalidatePath("/flagly", "layout")
    return ok({ id: area.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(DUPLICATE_AREA)
    }
    console.error("createArea failed", error)
    return fail("Could not create the area.")
  }
}

export async function updateArea(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const parsed = updateAreaSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  try {
    await prisma.area.update({ where: { id: d.id }, data: { name: d.name } })
    revalidatePath("/flagly", "layout")
    return ok({ id: d.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(DUPLICATE_AREA)
    }
    console.error("updateArea failed", error)
    return fail("Could not update the area.")
  }
}

export async function deleteArea(id: string): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const incidentCount = await prisma.incident.count({
    where: { OR: [{ areaId: id }, { subArea: { areaId: id } }] },
  })
  if (incidentCount > 0) {
    return fail("This area is used by incidents and cannot be deleted.")
  }

  try {
    // Cascades to its sub-areas.
    await prisma.area.delete({ where: { id } })
    revalidatePath("/flagly", "layout")
    return ok({ id })
  } catch (error) {
    console.error("deleteArea failed", error)
    return fail("Could not delete the area.")
  }
}

// ─── Sub-area ──────────────────────────────────────────────────────────────────

export async function createSubArea(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const parsed = createSubAreaSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  try {
    const sub = await prisma.subArea.create({
      data: { areaId: d.areaId, name: d.name },
      select: { id: true },
    })
    revalidatePath("/flagly", "layout")
    return ok({ id: sub.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(DUPLICATE_SUBAREA)
    }
    console.error("createSubArea failed", error)
    return fail("Could not create the sub-area.")
  }
}

export async function updateSubArea(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const parsed = updateSubAreaSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data

  try {
    await prisma.subArea.update({ where: { id: d.id }, data: { name: d.name } })
    revalidatePath("/flagly", "layout")
    return ok({ id: d.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(DUPLICATE_SUBAREA)
    }
    console.error("updateSubArea failed", error)
    return fail("Could not update the sub-area.")
  }
}

export async function deleteSubArea(id: string): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const incidentCount = await prisma.incident.count({ where: { subAreaId: id } })
  if (incidentCount > 0) {
    return fail("This sub-area is used by incidents and cannot be deleted.")
  }

  try {
    await prisma.subArea.delete({ where: { id } })
    revalidatePath("/flagly", "layout")
    return ok({ id })
  } catch (error) {
    console.error("deleteSubArea failed", error)
    return fail("Could not delete the sub-area.")
  }
}
