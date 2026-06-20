import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Sparkline } from "@/components/flagly/dashboard/Sparkline"

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  spark,
  href,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  icon?: LucideIcon
  tone?: "default" | "danger" | "warning" | "success"
  spark?: number[]
  href?: string
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
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
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
