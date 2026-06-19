"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { FollowUpAction } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Field } from "@/components/flagly/shared/Field"
import { ACTION_STATUS_LABELS, toDateInputValue } from "@/lib/flagly/utils"
import {
  addFollowUpAction,
  updateFollowUpAction,
} from "@/lib/flagly/actions/followup"

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "COMPLETE", "OVERDUE"] as const

export function FollowUpActionForm({
  open,
  onOpenChange,
  incidentId,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  incidentId: string
  record?: FollowUpAction | null
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [description, setDescription] = React.useState("")
  const [assignedTo, setAssignedTo] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [status, setStatus] = React.useState<string>("OPEN")

  React.useEffect(() => {
    if (!open) return
    setDescription(record?.description ?? "")
    setAssignedTo(record?.assignedTo ?? "")
    setDueDate(record?.dueDate ? toDateInputValue(record.dueDate) : "")
    setStatus(record?.status ?? "OPEN")
  }, [open, record])

  function submit() {
    startTransition(async () => {
      const base = {
        description: description.trim(),
        assignedTo: assignedTo.trim(),
        dueDate,
      }
      const result = record
        ? await updateFollowUpAction({ id: record.id, status, ...base })
        : await addFollowUpAction({ incidentId, ...base })

      if (result.ok) {
        toast.success(record ? "Action updated." : "Follow-up action added.")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {record ? "Edit follow-up action" : "Log follow-up action"}
          </SheetTitle>
          <SheetDescription>
            Assign a corrective or preventive action with a due date.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <Field label="Action description" htmlFor="fa-desc" required>
            <Textarea
              id="fa-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Assigned to" htmlFor="fa-assigned" required>
            <Input
              id="fa-assigned"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </Field>
          <Field label="Due date" htmlFor="fa-due" required>
            <Input
              id="fa-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          {record ? (
            <Field label="Status" required>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ACTION_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {record ? "Save changes" : "Add action"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
