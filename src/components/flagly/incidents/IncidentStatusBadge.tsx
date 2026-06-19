import type { IncidentStatus } from "@prisma/client"

import { cn } from "@/lib/utils"
import { StatusPill } from "@/components/flagly/shared/StatusPill"
import { INCIDENT_STATUS_LABELS, statusBadgeClass } from "@/lib/flagly/utils"

export function IncidentStatusBadge({
  status,
  className,
}: {
  status: IncidentStatus
  className?: string
}) {
  return (
    <StatusPill className={cn(statusBadgeClass(status), className)}>
      {INCIDENT_STATUS_LABELS[status]}
    </StatusPill>
  )
}
