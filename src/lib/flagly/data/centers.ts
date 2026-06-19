import type { Region } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export type CenterRow = {
  id: string
  name: string
  siteCode: string | null
  region: Region
  address: string | null
  incidentCount: number
}

export async function getCentersWithCounts(): Promise<CenterRow[]> {
  const centers = await prisma.center.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { incidents: true } } },
  })
  return centers.map((c) => ({
    id: c.id,
    name: c.name,
    siteCode: c.siteCode,
    region: c.region,
    address: c.address,
    incidentCount: c._count.incidents,
  }))
}
