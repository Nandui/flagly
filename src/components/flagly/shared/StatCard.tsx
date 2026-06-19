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
    default: "text-muted-foreground",
    danger: "text-severity-critical",
    warning: "text-severity-significant",
    success: "text-severity-minor",
  }

  const body = (
    <div
      className={cn(
        "group flex items-start justify-between gap-3 rounded-[var(--radius-card)] border bg-card p-5 shadow-xs transition-colors",
        href && "hover:border-primary/40 hover:bg-accent/40"
      )}
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg bg-muted",
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
