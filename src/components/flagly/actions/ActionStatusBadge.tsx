import type { ActionStatus } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ACTION_STATUS_LABELS, actionStatusBadgeClass } from "@/lib/flagly/utils"

export function ActionStatusBadge({
  status,
  className,
}: {
  status: ActionStatus
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(actionStatusBadgeClass(status), className)}
    >
      {ACTION_STATUS_LABELS[status]}
    </Badge>
  )
}
