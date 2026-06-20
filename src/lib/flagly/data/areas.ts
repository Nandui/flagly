import { prisma } from "@/lib/prisma"
import type { AreaItem, AreaOption } from "@/lib/flagly/types"

// Full area → sub-area tree for one centre, with incident counts (admin manager).
export async function getAreaTree(centerId: string): Promise<AreaItem[]> {
  const areas = await prisma.area.findMany({
    where: { centerId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { incidents: true } },
      subAreas: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { incidents: true } } },
      },
    },
  })

  return areas.map((area) => ({
    id: area.id,
    centerId: area.centerId,
    name: area.name,
    incidentCount: area._count.incidents,
    subAreas: area.subAreas.map((sub) => ({
      id: sub.id,
      name: sub.name,
      incidentCount: sub._count.incidents,
    })),
  }))
}

// Flat list of every centre's areas (+ sub-areas) for the incident form's
// cascading pickers. The form filters by the selected centre client-side.
export async function getAreaOptions(): Promise<AreaOption[]> {
  const areas = await prisma.area.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      centerId: true,
      name: true,
      subAreas: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      },
    },
  })

  return areas.map((area) => ({
    id: area.id,
    centerId: area.centerId,
    name: area.name,
    subAreas: area.subAreas,
  }))
}
