import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, ShieldAlert, TriangleAlert } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Panel } from "@/components/flagly/shared/Panel"
import { IncidentSeverityBadge } from "@/components/flagly/incidents/IncidentSeverityBadge"
import { formatDate, pluralize, severityBorderClass } from "@/lib/flagly/utils"
import type { DashboardAttention } from "@/lib/flagly/types"

/**
 * The dashboard's triage zone: what a duty/ops manager must act on right now —
 * overdue follow-up actions and open reportable/critical incidents. Placed above
 * the KPI row so "needs attention" sits above "nice to know".
 */
export function AttentionPanel({ attention }: { attention: DashboardAttention }) {
  const { overdueActions, overdueActionsTotal, reportableOpen, reportableOpenTotal } =
    attention

  if (overdueActionsTotal === 0 && reportableOpenTotal === 0) {
    return (
      <Panel contentClassName="flex items-center gap-3 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-severity-minor-bg text-severity-minor">
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Nothing needs attention</p>
          <p className="text-xs text-muted-foreground">
            No overdue actions or open reportable incidents at this centre.
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <TriangleAlert className="size-4 text-severity-reportable" />
          Needs attention
        </span>
      }
      contentClassName="grid divide-y p-0 lg:grid-cols-2 lg:divide-x lg:divide-y-0"
    >
      <Column
        icon={Clock}
        iconTint="bg-severity-critical-bg text-severity-critical"
        title="Overdue actions"
        total={overdueActionsTotal}
        shown={overdueActions.length}
        viewAllHref="/flagly/actions"
        emptyText="No overdue actions."
      >
        {overdueActions.map((a, i) => (
          <li key={`${a.reference}-${i}`}>
            <Link
              href={`/flagly/incidents/${a.incidentId}`}
              className="flex items-center gap-3 rounded-r-lg border-l-[3px] border-l-severity-critical py-2 pl-2.5 pr-2 transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <span className="font-mono">{a.reference}</span> · {a.assignedTo}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-severity-critical-bg px-2 py-0.5 text-xs font-medium tabular-nums text-severity-critical">
                {a.daysOverdue}d overdue
              </span>
            </Link>
          </li>
        ))}
      </Column>

      <Column
        icon={ShieldAlert}
        iconTint="bg-severity-reportable-bg text-severity-reportable"
        title="Open reportable incidents"
        total={reportableOpenTotal}
        shown={reportableOpen.length}
        viewAllHref="/flagly/incidents"
        emptyText="No open reportable incidents."
      >
        {reportableOpen.map((i) => (
          <li key={i.id}>
            <Link
              href={`/flagly/incidents/${i.id}`}
              className={cn(
                "flex items-center gap-3 rounded-r-lg border-l-[3px] py-2 pl-2.5 pr-2 transition-colors hover:bg-muted/60",
                severityBorderClass(i.severity)
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  <span className="font-mono">{i.reference}</span>
                  <span className="font-normal text-muted-foreground"> · {i.location}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(i.occurredAt)}
                  {i.openActions > 0
                    ? ` · ${i.openActions} open ${pluralize(i.openActions, "action")}`
                    : ""}
                </p>
              </div>
              <IncidentSeverityBadge severity={i.severity} />
            </Link>
          </li>
        ))}
      </Column>
    </Panel>
  )
}

function Column({
  icon: Icon,
  iconTint,
  title,
  total,
  shown,
  viewAllHref,
  emptyText,
  children,
}: {
  icon: LucideIcon
  iconTint: string
  title: string
  total: number
  shown: number
  viewAllHref: string
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col p-4">
      <div className="mb-1.5 flex items-center gap-2 px-2">
        <span className={cn("flex size-6 items-center justify-center rounded-md", iconTint)}>
          <Icon className="size-3.5" />
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="tabular-nums text-sm text-muted-foreground">{total}</span>
      </div>

      {total === 0 ? (
        <p className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="-mx-0">{children}</ul>
      )}

      {total > shown ? (
        <Link
          href={viewAllHref}
          className="mt-1.5 inline-flex items-center gap-1 self-start px-2 text-xs font-medium text-primary hover:underline"
        >
          View all {total}
          <ArrowRight className="size-3" />
        </Link>
      ) : null}
    </div>
  )
}
