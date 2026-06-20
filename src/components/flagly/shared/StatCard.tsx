import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone = "default",
  hint,
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  href?: string
  tone?: "default" | "danger" | "warning" | "success"
  hint?: string
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-accent text-primary",
    danger: "bg-severity-critical-bg text-severity-critical",
    warning: "bg-severity-significant-bg text-severity-significant",
    success: "bg-severity-minor-bg text-severity-minor",
  }

  const body = (
    <div
      className={cn(
        "group flex items-start justify-between gap-3 rounded-[var(--radius-card)] border bg-card p-6 shadow-card transition-all duration-200",
        href && "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-lift"
      )}
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-lg",
          toneClasses[tone]
        )}
      >
        <Icon className="size-5" />
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    )
  }
  return body
}
