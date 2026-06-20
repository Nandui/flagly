import type { Metadata } from "next"
import {
  Activity,
  Clock,
  FileWarning,
  MapPin,
  ShieldAlert,
  Tag,
  UserRound,
} from "lucide-react"
import type { IncidentType } from "@prisma/client"

import { getFlaglyContext } from "@/lib/flagly/context"
import { getDashboardData } from "@/lib/flagly/data/dashboard"
import {
  INCIDENT_TYPE_LABELS,
  TIMEFRAME_LABELS,
  formatBoardDate,
  formatTime,
  parseTimeframe,
  pluralize,
} from "@/lib/flagly/utils"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { DashboardFilters } from "@/components/flagly/dashboard/DashboardFilters"
import { AttentionPanel } from "@/components/flagly/dashboard/AttentionPanel"
import { MetricCard } from "@/components/flagly/shared/MetricCard"
import { ActivityChart } from "@/components/flagly/dashboard/ActivityChart"
import { DistributionPanel } from "@/components/flagly/dashboard/DistributionPanel"
import { LeaderboardPanel } from "@/components/flagly/dashboard/LeaderboardPanel"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tf?: string; type?: string }>
}) {
  const { tf, type } = await searchParams
  const { activeCenter, centers } = await getFlaglyContext()

  if (!activeCenter) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Incident overview" />
        <EmptyState
          icon={FileWarning}
          title="No centre selected."
          description="Add or select a centre to see its incident overview."
        />
      </div>
    )
  }

  const timeframe = parseTimeframe(tf)
  const typeFilter =
    type && type in INCIDENT_TYPE_LABELS ? (type as IncidentType) : null
  const period = TIMEFRAME_LABELS[timeframe].toLowerCase()

  const data = await getDashboardData(activeCenter.id, { timeframe, type: typeFilter })
  const { stats, sparks, deltas } = data

  // KPI deltas: for incident counts, fewer than last period is good.
  const downIsGood = (v: number | null) =>
    v === null ? null : { value: v, goodWhen: "down" as const }

  return (
    <div data-duty-board className="space-y-5">
      {/* Duty-board header: the centre name posted as board signage, with a
          live "on watch" status. The one bold moment on the page. */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="eyebrow">Duty board · {formatBoardDate(data.generatedAt)}</p>
          <h1 className="board-title text-3xl leading-none sm:text-4xl">
            {activeCenter.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Incident overview · {period}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-accent px-3 py-1 font-mono text-xs font-medium text-accent-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          On watch · updated {formatTime(data.generatedAt)}
        </span>
      </header>

      <DashboardFilters
        centers={centers}
        activeCenterId={activeCenter.id}
        timeframe={timeframe}
        type={typeFilter}
      />

      {/* Needs-attention triage zone */}
      <AttentionPanel attention={data.attention} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Incidents"
          value={stats.incidents}
          sub={period}
          icon={FileWarning}
          spark={sparks.incidents}
          delta={downIsGood(deltas.incidents)}
          href="/flagly/incidents"
        />
        <MetricCard
          label="Open incidents"
          value={stats.open}
          sub="right now"
          icon={Activity}
          href="/flagly/incidents"
        />
        <MetricCard
          label="Overdue actions"
          value={stats.overdueActions}
          sub="right now"
          icon={Clock}
          tone="danger"
          href="/flagly/actions"
        />
        <MetricCard
          label="Reportable"
          value={stats.reportable}
          sub={period}
          icon={ShieldAlert}
          tone="warning"
          spark={sparks.reportable}
          delta={downIsGood(deltas.reportable)}
        />
        <MetricCard
          label="Injured parties"
          value={stats.injured}
          sub={period}
          icon={UserRound}
          spark={sparks.injured}
          delta={downIsGood(deltas.injured)}
        />
      </div>

      {/* Activity */}
      <ActivityChart data={data.activity} />

      {/* Distributions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionPanel
          title="Top areas"
          rows={data.locations}
          gradient="warm"
          icon={MapPin}
          iconTint="bg-severity-reportable-bg text-severity-reportable"
          emptyText="No incidents in this period."
        />
        <DistributionPanel
          title="Incidents by type"
          rows={data.types.map((t) => ({
            label: INCIDENT_TYPE_LABELS[t.type],
            count: t.count,
          }))}
          gradient="cool"
          icon={Tag}
          emptyText="No incidents in this period."
        />
      </div>

      {/* Leaderboards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderboardPanel
          title="Most active reporters"
          rows={data.reporters.map((r, i) => ({
            name: r.name,
            sub: `${r.count} ${pluralize(r.count, "incident")} reported`,
            rank: i + 1,
            trend: r.trend,
          }))}
          emptyText="No reports in this period."
        />
        <LeaderboardPanel
          title="Open actions by assignee"
          rows={data.assignees.map((a, i) => ({
            name: a.name,
            sub:
              a.overdue > 0
                ? `${a.open} open · ${a.overdue} overdue`
                : `${a.open} open`,
            rank: i + 1,
            trend: a.overdue > 0 ? "down" : "up",
          }))}
          emptyText="No outstanding actions."
        />
      </div>
    </div>
  )
}
