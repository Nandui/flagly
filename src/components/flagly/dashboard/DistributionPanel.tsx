import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/flagly/shared/EmptyState"

export type DistributionRow = {
  label: string
  count: number
}

const gradientClass: Record<string, string> = {
  warm: "bar-warm",
  cool: "bar-cool",
  green: "bar-green",
  amber: "bar-amber",
}

export function DistributionPanel({
  title,
  rows,
  gradient,
  icon: Icon,
  iconTint = "bg-accent text-primary",
  emptyText = "No data for this period.",
  valueSuffix,
}: {
  title: string
  rows: DistributionRow[]
  gradient: "warm" | "cool" | "green" | "amber"
  icon: LucideIcon
  iconTint?: string
  emptyText?: string
  valueSuffix?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="rounded-[var(--radius-card)] border bg-card shadow-card">
      <div className="px-5 pt-5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-5">
        {rows.length === 0 ? (
          <EmptyState icon={Icon} title={emptyText} className="border-0 bg-transparent py-6" />
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                    iconTint
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.label}</p>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", gradientClass[gradient])}
                      style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                  {row.count}
                  {valueSuffix ? <span className="text-xs"> {valueSuffix}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
