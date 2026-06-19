import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/flagly/utils"

export type TimelineEvent = {
  label: string
  date: Date | string | null
  icon: LucideIcon
  description?: string
  tone?: "default" | "primary" | "success" | "danger"
}

const toneClasses: Record<NonNullable<TimelineEvent["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-status-open-bg text-status-open",
  success: "bg-status-closed-bg text-status-closed",
  danger: "bg-severity-critical-bg text-severity-critical",
}

export function IncidentTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-4">
      {events.map((event, index) => {
        const Icon = event.icon
        const last = index === events.length - 1
        return (
          <li key={index} className="relative flex gap-3">
            {!last ? (
              <span
                aria-hidden
                className="absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px bg-border"
              />
            ) : null}
            <div
              className={cn(
                "z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                toneClasses[event.tone ?? "default"]
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="pt-1 leading-tight">
              <p className="text-sm font-medium">{event.label}</p>
              {event.description ? (
                <p className="text-xs text-muted-foreground">{event.description}</p>
              ) : null}
              <p className="font-mono text-xs text-muted-foreground">
                {formatDateTime(event.date)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
