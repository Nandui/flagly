import type { Metadata } from "next"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  FileWarning,
} from "lucide-react"

import { getFlaglyContext } from "@/lib/flagly/context"
import { getDashboardData } from "@/lib/flagly/data/dashboard"
import { daysUntil, formatDate } from "@/lib/flagly/utils"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { StatCard } from "@/components/flagly/shared/StatCard"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IncidentTypeBadge } from "@/components/flagly/incidents/IncidentTypeBadge"
import { IncidentSeverityBadge } from "@/components/flagly/incidents/IncidentSeverityBadge"
import { IncidentStatusBadge } from "@/components/flagly/incidents/IncidentStatusBadge"
import { RiddorAlertBanner } from "@/components/flagly/dashboard/RiddorAlertBanner"
import { IncidentTrendChart } from "@/components/flagly/dashboard/IncidentTrendChart"

export const metadata: Metadata = { title: "Dashboard" }

export default async function FlaglyDashboardPage() {
  const { activeCenter } = await getFlaglyContext()

  if (!activeCenter) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <PageHeader title="Dashboard" description="Incident overview" />
        <EmptyState
          title="No centre selected."
          description="Select an active centre to view its incident dashboard."
        />
      </div>
    )
  }

  const data = await getDashboardData(activeCenter.id)
  const { stats, alertFlags, hasOverdueFlag, activeIncidents, overdueActions } =
    data

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Incident overview · ${activeCenter.name}`}
      >
        <Button asChild>
          <Link href="/flagly/incidents/new">Report incident</Link>
        </Button>
      </PageHeader>

      {/* 11.1 Stats bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Incidents this month"
          value={stats.incidentsThisMonth}
          icon={FileWarning}
          href="/flagly/incidents"
        />
        <StatCard
          label="Open incidents"
          value={stats.openIncidents}
          icon={Activity}
          href="/flagly/incidents"
        />
        <StatCard
          label="RIDDOR / HSA pending"
          value={stats.riddorPending}
          icon={AlertTriangle}
          tone="warning"
          href="/flagly/riddor"
        />
        <StatCard
          label="Overdue actions"
          value={stats.overdueActions}
          icon={Clock}
          tone="danger"
          href="/flagly/actions"
        />
      </div>

      {/* 11.2 RIDDOR / HSA alert banner */}
      <RiddorAlertBanner flags={alertFlags} hasOverdueFlag={hasOverdueFlag} />

      {/* 11.5 Trend chart + 11.4 Overdue actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncidentTrendChart data={data.trend} />
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Overdue actions</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueActions.length === 0 ? (
              <EmptyState
                title="No overdue actions."
                description="All follow-up is on track."
                className="border-0 bg-transparent p-6"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-0">Incident</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigned to</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueActions.map((action) => {
                    const daysOverdue = Math.abs(daysUntil(action.dueDate))
                    return (
                      <TableRow key={action.id}>
                        <TableCell className="px-0 align-top">
                          <Link
                            href={`/flagly/incidents/${action.incident.id}`}
                            className="font-mono text-sm font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {action.incident.reference}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[14rem] align-top">
                          <span className="line-clamp-2 text-sm">
                            {action.description}
                          </span>
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          {action.assignedTo}
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="font-mono text-sm text-severity-critical">
                            {formatDate(action.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell className="align-top text-right text-sm font-medium tabular-nums">
                          {daysOverdue}d
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 11.3 Active incidents panel */}
      <Card>
        <CardHeader>
          <CardTitle>Active incidents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeIncidents.length === 0 ? (
            <EmptyState
              title="No active incidents."
              className="border-0 bg-transparent p-6"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Occurred</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow-up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <Link
                          href={`/flagly/incidents/${incident.id}`}
                          className="font-mono text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {incident.reference}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <IncidentTypeBadge type={incident.type} />
                      </TableCell>
                      <TableCell>
                        <IncidentSeverityBadge severity={incident.severity} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {incident.location}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatDate(incident.occurredAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <IncidentStatusBadge status={incident.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {incident.openActionCount > 0
                          ? `${incident.openActionCount} open`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Link
                href="/flagly/incidents"
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium text-primary",
                  "underline-offset-4 hover:underline"
                )}
              >
                View all incidents
                <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
