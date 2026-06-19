import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { RiddorStatus } from "@prisma/client"

import { cn } from "@/lib/utils"
import { daysUntil, formatDate } from "@/lib/flagly/utils"

// Colour bands per spec §17.3
function bandClasses(days: number): { box: string; text: string } {
  if (days <= 0) {
    return {
      box: "bg-severity-critical-bg border-severity-critical-line",
      text: "text-severity-critical",
    }
  }
  if (days <= 2) {
    return {
      box: "bg-severity-reportable-bg border-severity-reportable-line",
      text: "text-severity-reportable",
    }
  }
  if (days <= 7) {
    return {
      box: "bg-severity-significant-bg border-severity-significant-line",
      text: "text-severity-significant",
    }
  }
  return {
    box: "bg-severity-minor-bg border-severity-minor-line",
    text: "text-severity-minor",
  }
}

function remainingLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} overdue`
  if (days === 0) return "Due today"
  return `${days} ${days === 1 ? "day" : "days"} remaining`
}

export function DeadlineCountdown({
  deadline,
  status,
  variant = "box",
  className,
}: {
  deadline: Date | string
  status?: RiddorStatus
  variant?: "box" | "inline"
  className?: string
}) {
  const days = daysUntil(deadline)

  if (status === "REPORTED") {
    if (variant === "inline") {
      return (
        <span className={cn("font-mono text-sm text-severity-minor", className)}>
          Reported
        </span>
      )
    }
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-severity-minor-line bg-severity-minor-bg px-3 py-2 text-sm text-severity-minor",
          className
        )}
      >
        <CheckCircle2 className="size-4" />
        <span>Reported to authority</span>
      </div>
    )
  }

  const band = bandClasses(days)

  if (variant === "inline") {
    return (
      <span className={cn("font-mono text-sm font-medium", band.text, className)}>
        {days < 0 ? `−${Math.abs(days)}d` : `${days}d`}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
        band.box,
        className
      )}
    >
      <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", band.text)} />
      <div className="leading-tight">
        <p className={cn("text-sm font-medium", band.text)}>
          Report by {formatDate(deadline)}
        </p>
        <p className={cn("text-xs", band.text)}>{remainingLabel(days)}</p>
      </div>
    </div>
  )
}
