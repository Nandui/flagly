import {
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns"
import type { IncidentType } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getIncidents, sweepOverdueActions, sweepOverdueRiddor } from "@/lib/flagly/data/incidents"
import { getOverdueActions } from "@/lib/flagly/data/actions"
import { daysUntil } from "@/lib/flagly/utils"
import type {
  DashboardAlertFlag,
  DashboardData,
  TrendBucket,
} from "@/lib/flagly/types"

const TREND_TYPES: IncidentType[] = [
  "ACCIDENT",
  "NEAR_MISS",
  "PROPERTY_DAMAGE",
  "VIOLENCE_AGGRESSION",
  "HAZARDOUS_SUBSTANCE",
  "FIRE_OR_EVACUATION",
  "OTHER",
]

function emptyBucket(month: string): TrendBucket {
  return {
    month,
    ACCIDENT: 0,
    NEAR_MISS: 0,
    PROPERTY_DAMAGE: 0,
    VIOLENCE_AGGRESSION: 0,
    HAZARDOUS_SUBSTANCE: 0,
    FIRE_OR_EVACUATION: 0,
    OTHER: 0,
  }
}

export async function getDashboardData(centerId: string): Promise<DashboardData> {
  await Promise.all([sweepOverdueActions(centerId), sweepOverdueRiddor()])

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const trendStart = startOfMonth(subMonths(now, 5))

  const [
    incidentsThisMonth,
    openIncidents,
    riddorPending,
    overdueActionsCount,
    alertFlagRecords,
    activeIncidents,
    overdueActions,
    trendIncidents,
  ] = await Promise.all([
    prisma.incident.count({
      where: {
        centerId,
        status: { not: "DRAFT" },
        occurredAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.incident.count({
      where: { centerId, status: { in: ["OPEN", "UNDER_INVESTIGATION"] } },
    }),
    prisma.riddorFlag.count({
      where: { status: "PENDING", incident: { centerId } },
    }),
    prisma.followUpAction.count({
      where: { status: "OVERDUE", incident: { centerId } },
    }),
    prisma.riddorFlag.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] }, incident: { centerId } },
      orderBy: { reportingDeadline: "asc" },
      select: {
        status: true,
        reportingDeadline: true,
        incident: { select: { id: true, reference: true } },
      },
    }),
    getIncidents({ centerId, statuses: { in: ["OPEN", "UNDER_INVESTIGATION"] } }),
    getOverdueActions({ centerId }),
    prisma.incident.findMany({
      where: {
        centerId,
        status: { not: "DRAFT" },
        occurredAt: { gte: trendStart, lte: monthEnd },
      },
      select: { occurredAt: true, type: true },
    }),
  ])

  const alertFlags: DashboardAlertFlag[] = alertFlagRecords.map((flag) => ({
    incidentId: flag.incident.id,
    reference: flag.incident.reference,
    reportingDeadline: flag.reportingDeadline,
    status: flag.status,
    daysRemaining: daysUntil(flag.reportingDeadline),
  }))

  // Build six ascending month buckets, then tally incidents by type.
  const buckets: TrendBucket[] = []
  const bucketIndex = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = startOfMonth(subMonths(now, i))
    const key = format(d, "yyyy-MM")
    bucketIndex.set(key, buckets.length)
    buckets.push(emptyBucket(format(d, "MMM")))
  }
  for (const incident of trendIncidents) {
    const key = format(startOfMonth(incident.occurredAt), "yyyy-MM")
    const idx = bucketIndex.get(key)
    if (idx === undefined) continue
    if (TREND_TYPES.includes(incident.type)) {
      buckets[idx][incident.type] += 1
    }
  }

  return {
    stats: {
      incidentsThisMonth,
      openIncidents,
      riddorPending,
      overdueActions: overdueActionsCount,
    },
    alertFlags,
    hasOverdueFlag: alertFlags.some((f) => f.status === "OVERDUE"),
    activeIncidents: activeIncidents.slice(0, 10),
    overdueActions,
    trend: buckets,
  }
}
