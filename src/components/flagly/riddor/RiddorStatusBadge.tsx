import type { RiddorStatus } from "@prisma/client"

import { cn } from "@/lib/utils"
import { StatusPill } from "@/components/flagly/shared/StatusPill"
import { RIDDOR_STATUS_LABELS, riddorStatusBadgeClass } from "@/lib/flagly/utils"

export function RiddorStatusBadge({
  status,
  className,
}: {
  status: RiddorStatus
  className?: string
}) {
  return (
    <StatusPill className={cn(riddorStatusBadgeClass(status), className)}>
      {RIDDOR_STATUS_LABELS[status]}
    </StatusPill>
  )
}
