import type { IncidentType } from "@prisma/client"

import { cn } from "@/lib/utils"
import { INCIDENT_TYPE_LABELS } from "@/lib/flagly/utils"

export function IncidentTypeBadge({
  type,
  className,
}: {
  type: IncidentType
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground",
        className
      )}
    >
      {INCIDENT_TYPE_LABELS[type]}
    </span>
  )
}
