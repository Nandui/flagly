import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { DashboardAlertFlag } from "@/lib/flagly/types"
import { pluralize } from "@/lib/flagly/utils"

function deadlineText(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const abs = Math.abs(daysRemaining)
    return `OVERDUE by ${abs} ${pluralize(abs, "day")}`
  }
  if (daysRemaining === 0) return "deadline today"
  return `deadline in ${daysRemaining} ${pluralize(daysRemaining, "day")}`
}

export function RiddorAlertBanner({
  flags,
  hasOverdueFlag,
}: {
  flags: DashboardAlertFlag[]
  hasOverdueFlag: boolean
}) {
  if (flags.length === 0) return null

  const tone = hasOverdueFlag
    ? "bg-severity-critical-bg border-severity-critical-line text-severity-critical"
    : "bg-severity-significant-bg border-severity-significant-line text-severity-significant"

  return (
    <div className={cn("rounded-xl border p-5 shadow-sm", tone)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="font-display text-base font-semibold">
            {flags.length}{" "}
            {pluralize(flags.length, "incident")} require authority notification
          </p>
          <ul className="space-y-2">
            {flags.map((flag) => (
              <li
                key={flag.incidentId}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-current/15 pt-2 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mono text-sm font-medium">
                    {flag.reference}
                  </span>
                  <span className="text-sm opacity-90">
                    {deadlineText(flag.daysRemaining)}
                  </span>
                </div>
                <Link
                  href={`/flagly/incidents/${flag.incidentId}?tab=riddor`}
                  className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                >
                  View
                  <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
