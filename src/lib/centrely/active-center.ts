import { cache } from "react"
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

export const listCenters = cache(async (): Promise<CenterSummary[]> => {
  return prisma.center.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, siteCode: true, region: true },
  })
})

/**
 * Resolve the active center for the current request. Preference order:
 *   1. valid `flagly_active_center` cookie
 *   2. one of the centres the user is assigned to
 *   3. the first center in the database
 *
 * Membership is recorded, not access-restricting: the switcher still lists every
 * centre — assignment only sets a sensible default landing centre. Cached per
 * request, and the membership lookup is skipped entirely when the cookie is set.
 */
export const getActiveCenter = cache(
  async (
    user: SessionUser
  ): Promise<{ active: CenterSummary | null; centers: CenterSummary[] }> => {
    const centers = await listCenters()
    if (centers.length === 0) return { active: null, centers }

    const store = await cookies()
    const cookieId = store.get(ACTIVE_CENTER_COOKIE)?.value

    let active = cookieId ? centers.find((c) => c.id === cookieId) : undefined
    if (!active) {
      const membership = await prisma.user.findUnique({
        where: { id: user.id },
        select: { centers: { select: { id: true }, orderBy: { name: "asc" }, take: 1 } },
      })
      const homeId = membership?.centers[0]?.id
      active = centers.find((c) => c.id === homeId) ?? centers[0]
    }

    return { active, centers }
  }
)
