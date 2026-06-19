import type { IncidentSeverity } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SEVERITY_LABELS, severityBadgeClass } from "@/lib/flagly/utils"

export function IncidentSeverityBadge({
  severity,
  className,
}: {
  severity: IncidentSeverity
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(severityBadgeClass(severity), className)}
    >
      {SEVERITY_LABELS[severity]}
    </Badge>
  )
}
