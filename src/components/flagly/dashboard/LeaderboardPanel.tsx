import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { Panel } from "@/components/flagly/shared/Panel"
import { Users } from "lucide-react"

export type LeaderboardRow = {
  name: string
  sub?: string
  rank: number
  trend?: "up" | "down" | "flat"
}

function initials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function Trend({ trend }: { trend?: "up" | "down" | "flat" }) {
  if (trend === "up") return <span className="text-severity-minor">▲</span>
  if (trend === "down") return <span className="text-severity-critical">▼</span>
  return <span className="text-muted-foreground/50">–</span>
}

export function LeaderboardPanel({
  title,
  rows,
  emptyText = "No data for this period.",
}: {
  title: string
  rows: LeaderboardRow[]
  emptyText?: string
}) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <EmptyState icon={Users} title={emptyText} className="border-0 bg-transparent py-6" />
      ) : (
        <ul className="space-y-3.5">
          {rows.map((row) => (
              <li key={row.name} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {initials(row.name)}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  {row.sub ? (
                    <p className="truncate text-xs text-muted-foreground">{row.sub}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 text-sm tabular-nums">
                  <span className="font-medium">{row.rank}</span>
                  <Trend trend={row.trend} />
                </div>
              </li>
            ))}
          </ul>
        )}
    </Panel>
  )
}
