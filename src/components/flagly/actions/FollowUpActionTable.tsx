"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import type { FollowUpAction } from "@prisma/client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { ActionStatusBadge } from "@/components/flagly/actions/ActionStatusBadge"
import { formatDate } from "@/lib/flagly/utils"
import { setActionStatus } from "@/lib/flagly/actions/followup"

export function FollowUpActionTable({
  actions,
  onEdit,
}: {
  actions: FollowUpAction[]
  onEdit: (action: FollowUpAction) => void
}) {
  const router = useRouter()
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [, startTransition] = React.useTransition()

  if (actions.length === 0) {
    return <EmptyState title="No follow-up actions assigned." />
  }

  function markComplete(id: string) {
    setPendingId(id)
    startTransition(async () => {
      const result = await setActionStatus({ id, status: "COMPLETE" })
      setPendingId(null)
      if (result.ok) {
        toast.success("Action marked complete.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((action) => {
            const overdue = action.status === "OVERDUE"
            return (
              <TableRow
                key={action.id}
                className={cn(
                  overdue && "bg-severity-critical-bg/40 border-l-4 border-l-severity-critical"
                )}
              >
                <TableCell className="max-w-xs font-medium">
                  {action.description}
                </TableCell>
                <TableCell>{action.assignedTo}</TableCell>
                <TableCell
                  className={cn("font-mono text-sm", overdue && "text-severity-critical")}
                >
                  {formatDate(action.dueDate)}
                </TableCell>
                <TableCell>
                  <ActionStatusBadge status={action.status} />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {action.completedAt ? formatDate(action.completedAt) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {action.status !== "COMPLETE" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingId === action.id}
                        onClick={() => markComplete(action.id)}
                      >
                        {pendingId === action.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                        Complete
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit action"
                      onClick={() => onEdit(action)}
                    >
                      <Pencil className="text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
