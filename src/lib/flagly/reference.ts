import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

/**
 * Generate a human-readable incident reference: INC-XX-NNNN
 *   XX   = the Center's siteCode (2-letter), uppercased
 *   NNNN = zero-padded sequential count, scoped per center
 *
 * Accepts an optional transaction client so the count + create happen
 * atomically and the unique `reference` cannot collide under concurrent
 * submissions (see actions/incidents.ts).
 */
export async function generateIncidentReference(
  centerId: string,
  tx: Prisma.TransactionClient = prisma
): Promise<string> {
  const center = await tx.center.findUniqueOrThrow({
    where: { id: centerId },
    select: { siteCode: true },
  })
  const count = await tx.incident.count({ where: { centerId } })
  const code = center.siteCode?.toUpperCase() ?? "XX"
  return `INC-${code}-${String(count + 1).padStart(4, "0")}`
}
