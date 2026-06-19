import type { ActionStatus } from "@prisma/client"

import { cn } from "@/lib/utils"
import { StatusPill } from "@/components/flagly/shared/StatusPill"
import { ACTION_STATUS_LABELS, actionStatusBadgeClass } from "@/lib/flagly/utils"

export function ActionStatusBadge({
  status,
  className,
}: {
  status: ActionStatus
  className?: string
}) {
  return (
    <StatusPill className={cn(actionStatusBadgeClass(status), className)}>
      {ACTION_STATUS_LABELS[status]}
    </StatusPill>
  )
}
