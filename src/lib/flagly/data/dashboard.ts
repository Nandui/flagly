import {
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import type { IncidentType, Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { sweepOverdueActions, sweepOverdueRiddor } from "@/lib/flagly/data/incidents"
import { daysUntil } from "@/lib/flagly/utils"
import type {
  ActivityPoint,
  AssigneeRank,
  DashboardAlertFlag,
  DashboardData,
  DistributionItem,
  ReporterRank,
  Timeframe,
  TypeDistributionItem,
} from "@/lib/flagly/types"

type Window = {
  start: Date | null
  end: Date
  prevStart: Date | null
  prevEnd: Date | null
}

function resolveWindow(tf: Timeframe): Window {
  const now = new Date()
  switch (tf) {
    case "LAST_7_DAYS": {
      const start = startOfDay(subDays(now, 6))
      return { start, end: now, prevStart: startOfDay(subDays(start, 7)), prevEnd: start }
    }
    case "THIS_YEAR": {
      const start = startOfYear(now)
      return {
        start,
        end: endOfYear(now),
        prevStart: startOfYear(subYears(now, 1)),
        prevEnd: endOfYear(subYears(now, 1)),
      }
    }
    case "ALL_TIME":
      return { start: null, end: now, prevStart: null, prevEnd: null }
    case "THIS_MONTH":
    default: {
      const start = startOfMonth(now)
      return {
        start,
        end: endOfMonth(now),
        prevStart: startOfMonth(subMonths(now, 1)),
        prevEnd: endOfMonth(subMonths(now, 1)),
      }
    }
  }
}

const isReportable = (s: string) => s === "REPORTABLE" || s === "CRITICAL"

export async function getDashboardData(
  centerId: string,
  opts: { timeframe: Timeframe; type?: IncidentType | null }
): Promise<DashboardData> {
  await Promise.all([sweepOverdueActions(centerId), sweepOverdueRiddor()])

  const { timeframe, type } = opts
  const win = resolveWindow(timeframe)
  const now = new Date()
  const typeWhere: Prisma.IncidentWhereInput = type ? { type } : {}
  const incidentScope: Prisma.IncidentWhereInput = {
    centerId,
    status: { not: "DRAFT" },
    ...typeWhere,
  }

  const twelveMoStart = startOfMonth(subMonths(now, 11))

  const [
    periodIncidents,
    twelveMoIncidents,
    open,
    overdueActions,
    riddorPending,
    prevReporters,
    actionRows,
    alertFlagRecords,
  ] = await Promise.all([
    prisma.incident.findMany({
      where: {
        ...incidentScope,
        ...(win.start ? { occurredAt: { gte: win.start, lte: win.end } } : {}),
      },
      select: {
        severity: true,
        type: true,
        location: true,
        reportedBy: true,
        injuredCount: true,
      },
    }),
    prisma.incident.findMany({
      where: { ...incidentScope, occurredAt: { gte: twelveMoStart } },
      select: { occurredAt: true, severity: true, injuredCount: true },
    }),
    prisma.incident.count({
      where: { centerId, ...typeWhere, status: { in: ["OPEN", "UNDER_INVESTIGATION"] } },
    }),
    prisma.followUpAction.count({
      where: { status: "OVERDUE", incident: { centerId, ...typeWhere } },
    }),
    prisma.riddorFlag.count({
      where: { status: "PENDING", incident: { centerId, ...typeWhere } },
    }),
    win.prevStart
      ? prisma.incident.groupBy({
          by: ["reportedBy"],
          where: {
            ...incidentScope,
            occurredAt: { gte: win.prevStart, lte: win.prevEnd ?? now },
          },
          _count: { _all: true },
        })
      : Promise.resolve([] as { reportedBy: string; _count: { _all: number } }[]),
    prisma.followUpAction.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS", "OVERDUE"] },
        incident: { centerId, ...typeWhere },
      },
      select: { assignedTo: true, status: true },
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
  ])

  // ── Stats ──
  const stats = {
    incidents: periodIncidents.length,
    open,
    overdueActions,
    riddorPending,
    reportable: periodIncidents.filter((i) => isReportable(i.severity)).length,
    injured: periodIncidents.reduce((sum, i) => sum + i.injuredCount, 0),
  }

  // ── 12-month activity + 6-month sparklines ──
  const buckets: { key: string; month: string; count: number; reportable: number; injured: number }[] = []
  const index = new Map<string, number>()
  for (let i = 11; i >= 0; i--) {
    const d = startOfMonth(subMonths(now, i))
    const key = format(d, "yyyy-MM")
    index.set(key, buckets.length)
    buckets.push({ key, month: format(d, "MMM"), count: 0, reportable: 0, injured: 0 })
  }
  for (const inc of twelveMoIncidents) {
    const idx = index.get(format(startOfMonth(inc.occurredAt), "yyyy-MM"))
    if (idx === undefined) continue
    buckets[idx].count += 1
    if (isReportable(inc.severity)) buckets[idx].reportable += 1
    buckets[idx].injured += inc.injuredCount
  }
  const activity: ActivityPoint[] = buckets.map((b) => ({ month: b.month, count: b.count }))
  const last6 = buckets.slice(-6)
  const sparks = {
    incidents: last6.map((b) => b.count),
    reportable: last6.map((b) => b.reportable),
    injured: last6.map((b) => b.injured),
  }

  // ── Distributions ──
  const locations = topCounts(periodIncidents.map((i) => i.location)).map(
    ([label, count]): DistributionItem => ({ label, count })
  )

  const typeCounts = new Map<IncidentType, number>()
  for (const i of periodIncidents) typeCounts.set(i.type, (typeCounts.get(i.type) ?? 0) + 1)
  const types: TypeDistributionItem[] = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  // ── Reporters leaderboard (with trend vs previous period) ──
  const prevMap = new Map(prevReporters.map((r) => [r.reportedBy, r._count._all]))
  const reporters: ReporterRank[] = topCounts(periodIncidents.map((i) => i.reportedBy))
    .map(([name, count]): ReporterRank => {
      const prev = prevMap.get(name)
      const trend =
        prev === undefined ? "flat" : count > prev ? "up" : count < prev ? "down" : "flat"
      return { name, count, trend }
    })

  // ── Assignees leaderboard (outstanding actions) ──
  const assigneeMap = new Map<string, { open: number; overdue: number }>()
  for (const a of actionRows) {
    const entry = assigneeMap.get(a.assignedTo) ?? { open: 0, overdue: 0 }
    entry.open += 1
    if (a.status === "OVERDUE") entry.overdue += 1
    assigneeMap.set(a.assignedTo, entry)
  }
  const assignees: AssigneeRank[] = [...assigneeMap.entries()]
    .map(([name, v]) => ({ name, open: v.open, overdue: v.overdue }))
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open)
    .slice(0, 6)

  const alertFlags: DashboardAlertFlag[] = alertFlagRecords.map((flag) => ({
    incidentId: flag.incident.id,
    reference: flag.incident.reference,
    reportingDeadline: flag.reportingDeadline,
    status: flag.status,
    daysRemaining: daysUntil(flag.reportingDeadline),
  }))

  return {
    timeframe,
    stats,
    sparks,
    activity,
    locations,
    types,
    reporters,
    assignees,
    alertFlags,
    hasOverdueFlag: alertFlags.some((f) => f.status === "OVERDUE"),
  }
}

function topCounts(values: string[], limit = 6): [string, number][] {
  const map = new Map<string, number>()
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1)
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}
