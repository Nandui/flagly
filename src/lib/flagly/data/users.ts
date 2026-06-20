import { prisma } from "@/lib/prisma"
import type { UserOption, UserRow } from "@/lib/flagly/types"

export async function getUsers(): Promise<UserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { center: { select: { name: true } } },
  })
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    centerId: u.centerId,
    centerName: u.center?.name ?? null,
    createdAt: u.createdAt,
  }))
}

// Reporter options for the incident form (admins choosing who submitted).
export async function getUserOptions(): Promise<UserOption[]> {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  return users
}
