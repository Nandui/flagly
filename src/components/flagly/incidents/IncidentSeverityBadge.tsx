import type { IncidentSeverity } from "@prisma/client"

import { cn } from "@/lib/utils"
import { StatusPill } from "@/components/flagly/shared/StatusPill"
import { SEVERITY_LABELS, severityBadgeClass } from "@/lib/flagly/utils"

export function IncidentSeverityBadge({
  severity,
  className,
}: {
  severity: IncidentSeverity
  className?: string
}) {
  return (
    <StatusPill className={cn(severityBadgeClass(severity), className)}>
      {SEVERITY_LABELS[severity]}
    </StatusPill>
  )
}
