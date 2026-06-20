import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Sparkline } from "@/components/flagly/shared/Sparkline"

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  spark,
  href,
  delta,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  icon?: LucideIcon
  tone?: "default" | "danger" | "warning" | "success"
  spark?: number[]
  href?: string
  // Change vs the previous comparable period. `goodWhen` colours the direction
  // (e.g. for incident counts, "down" is good). null/omitted = no comparison.
  delta?: { value: number; goodWhen?: "up" | "down" } | null
}) {
  const toneText: Record<string, string> = {
    default: "text-foreground",
    danger: "text-severity-critical",
    warning: "text-severity-significant",
    success: "text-severity-minor",
  }
  const sparkColor: Record<string, string> = {
    default: "var(--primary)",
    danger: "var(--severity-critical)",
    warning: "var(--severity-significant)",
    success: "var(--severity-minor)",
  }

  const hasDelta = !!delta && delta.value !== 0
  const direction = delta && delta.value > 0 ? "up" : "down"
  const deltaGood = delta?.goodWhen ? direction === delta.goodWhen : null
  const deltaColor =
    deltaGood === true
      ? "text-severity-minor"
      : deltaGood === false
        ? "text-severity-critical"
        : "text-muted-foreground"
  const deltaTitle = delta
    ? `${Math.abs(delta.value)} ${direction === "up" ? "more" : "fewer"} than the previous period`
    : undefined

  const body = (
    <div
      className={cn(
        "flex h-full flex-col gap-2 rounded-[var(--radius-card)] border bg-card p-5 shadow-card transition-all duration-200",
        href && "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-lift"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon className={cn("size-4", toneText[tone])} /> : null}
      </div>
      <p className={cn("font-display text-3xl font-semibold tabular-nums leading-none", toneText[tone])}>
        {value}
      </p>
      {hasDelta || sub ? (
        <p className="flex items-center gap-1.5 text-xs">
          {hasDelta ? (
            <span
              className={cn("inline-flex items-center gap-0.5 font-medium tabular-nums", deltaColor)}
              title={deltaTitle}
            >
              <span aria-hidden>{direction === "up" ? "▲" : "▼"}</span>
              {Math.abs(delta!.value)}
            </span>
          ) : null}
          {sub ? <span className="text-muted-foreground">{sub}</span> : null}
        </p>
      ) : null}
      {spark && spark.length > 1 ? (
        <div className="mt-auto pt-1">
          <Sparkline data={spark} stroke={sparkColor[tone]} />
        </div>
      ) : null}
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}
