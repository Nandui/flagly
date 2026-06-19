import type { IncidentStatus } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { INCIDENT_STATUS_LABELS, statusBadgeClass } from "@/lib/flagly/utils"

export function IncidentStatusBadge({
  status,
  className,
}: {
  status: IncidentStatus
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(statusBadgeClass(status), className)}>
      {INCIDENT_STATUS_LABELS[status]}
    </Badge>
  )
}
