import type { IncidentType } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
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
    <Badge
      variant="outline"
      className={cn("border-border bg-secondary text-secondary-foreground", className)}
    >
      {INCIDENT_TYPE_LABELS[type]}
    </Badge>
  )
}
