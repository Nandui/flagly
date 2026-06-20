"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { hashPassword } from "@/lib/password"
import { ADMIN_ROLES, isAdmin } from "@/lib/centrely/roles"
import { createUserSchema, updateUserSchema } from "@/lib/flagly/validation"
import { fail, fromZodError, ok } from "@/lib/flagly/actions/result"
import type { ActionResult } from "@/lib/flagly/types"

const ADMIN_ROLE_FILTER = [...ADMIN_ROLES]

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: "You must be signed in." }
  if (!isAdmin(user.role))
    return { ok: false as const, error: "Only the Operations Manager can manage users." }
  return { ok: true as const, user }
}

const DUPLICATE_EMAIL = "That email address is already registered."

export async function createUser(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data
  const email = d.email.toLowerCase()

  try {
    const user = await prisma.user.create({
      data: {
        name: d.name,
        email,
        role: d.role,
        centerId: d.centerId ?? null,
        passwordHash: await hashPassword(d.password),
      },
      select: { id: true },
    })
    revalidatePath("/flagly", "layout")
    return ok({ id: user.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(DUPLICATE_EMAIL)
    }
    console.error("createUser failed", error)
    return fail("Could not create the user.")
  }
}

export async function updateUser(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  const parsed = updateUserSchema.safeParse(raw)
  if (!parsed.success) return fromZodError(parsed.error)
  const d = parsed.data
  const email = d.email.toLowerCase()

  const target = await prisma.user.findUnique({
    where: { id: d.id },
    select: { role: true },
  })
  if (!target) return fail("User not found.")

  // Don't allow demoting the last remaining admin (would lock everyone out).
  if (isAdmin(target.role) && !isAdmin(d.role)) {
    const adminCount = await prisma.user.count({
      where: { role: { in: ADMIN_ROLE_FILTER } },
    })
    if (adminCount <= 1) {
      return fail("You can't change the role of the only remaining Operations Manager.")
    }
  }

  try {
    await prisma.user.update({
      where: { id: d.id },
      data: {
        name: d.name,
        email,
        role: d.role,
        centerId: d.centerId ?? null,
        ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
      },
    })
    revalidatePath("/flagly", "layout")
    return ok({ id: d.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(DUPLICATE_EMAIL)
    }
    console.error("updateUser failed", error)
    return fail("Could not update the user.")
  }
}

export async function deleteUser(id: string): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return fail(guard.error)

  if (guard.user.id === id) {
    return fail("You can't delete your own account.")
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  })
  if (!target) return fail("User not found.")

  if (isAdmin(target.role)) {
    const adminCount = await prisma.user.count({
      where: { role: { in: ADMIN_ROLE_FILTER } },
    })
    if (adminCount <= 1) {
      return fail("You can't delete the only remaining Operations Manager.")
    }
  }

  try {
    // Incidents keep their denormalised reporter name; reportedById is just a link.
    await prisma.user.delete({ where: { id } })
    revalidatePath("/flagly", "layout")
    return ok({ id })
  } catch (error) {
    console.error("deleteUser failed", error)
    return fail("Could not delete the user.")
  }
}
