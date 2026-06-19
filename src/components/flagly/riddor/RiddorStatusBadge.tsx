import type { RiddorStatus } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RIDDOR_STATUS_LABELS, riddorStatusBadgeClass } from "@/lib/flagly/utils"

export function RiddorStatusBadge({
  status,
  className,
}: {
  status: RiddorStatus
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(riddorStatusBadgeClass(status), className)}
    >
      {RIDDOR_STATUS_LABELS[status]}
    </Badge>
  )
}
