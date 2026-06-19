import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"
import type { SessionUser } from "@/lib/session"

export const ACTIVE_CENTER_COOKIE = "flagly_active_center"

export type CenterSummary = {
  id: string
  name: string
  siteCode: string | null
  region: string
}

export async function listCenters(): Promise<CenterSummary[]> {
  return prisma.center.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, siteCode: true, region: true },
  })
}

/**
 * Resolve the active center for the current request. Preference order:
 *   1. valid `flagly_active_center` cookie
 *   2. the user's home center
 *   3. the first center in the database
 */
export async function getActiveCenter(user: SessionUser): Promise<{
  active: CenterSummary | null
  centers: CenterSummary[]
}> {
  const centers = await listCenters()
  if (centers.length === 0) return { active: null, centers }

  const store = await cookies()
  const cookieId = store.get(ACTIVE_CENTER_COOKIE)?.value

  const active =
    centers.find((c) => c.id === cookieId) ??
    centers.find((c) => c.id === user.centerId) ??
    centers[0]

  return { active, centers }
}
