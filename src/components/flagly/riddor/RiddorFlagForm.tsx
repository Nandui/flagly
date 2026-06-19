"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { RiddorFlag } from "@prisma/client"

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
import { AUTHORITY_OPTIONS, formatDate } from "@/lib/flagly/utils"
import {
  computeDeadline,
  findRule,
  rulesForAuthority,
  type ReportingAuthorityId,
} from "@/lib/flagly/deadline"
import { createRiddorFlag } from "@/lib/flagly/actions/riddor"

export function RiddorFlagForm({
  open,
  onOpenChange,
  incidentId,
  occurredAt,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  incidentId: string
  occurredAt: Date | string
  record?: RiddorFlag | null
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [authority, setAuthority] = React.useState<ReportingAuthorityId>(
    "HSA_IRELAND"
  )
  const [classification, setClassification] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const classifications = React.useMemo(
    () => rulesForAuthority(authority).map((r) => r.classification),
    [authority]
  )

  React.useEffect(() => {
    if (!open) return
    const initialAuthority = (record?.authority ?? "HSA_IRELAND") as ReportingAuthorityId
    setAuthority(initialAuthority)
    setClassification(
      record?.classification ?? rulesForAuthority(initialAuthority)[0]?.classification ?? ""
    )
    setNotes(record?.notes ?? "")
  }, [open, record])

  // When the authority changes, keep the selected classification valid.
  React.useEffect(() => {
    if (!classifications.includes(classification)) {
      setClassification(classifications[0] ?? "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authority])

  const occurredDate =
    occurredAt instanceof Date ? occurredAt : new Date(occurredAt)
  const rule = findRule(authority, classification)
  const deadline = rule ? computeDeadline(occurredDate, rule) : null

  function submit() {
    if (!classification) {
      toast.error("Select a classification.")
      return
    }
    startTransition(async () => {
      const result = await createRiddorFlag({
        incidentId,
        authority,
        classification,
        reportingDeadline: (deadline ?? new Date()).toISOString(),
        notes,
      })
      if (result.ok) {
        toast.success("RIDDOR / HSA flag saved.")
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
            {record ? "Edit RIDDOR / HSA flag" : "Create RIDDOR / HSA flag"}
          </SheetTitle>
          <SheetDescription>
            Flag this incident for authority notification. The reporting deadline
            is computed from the incident date.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <Field label="Authority" required>
            <Select
              value={authority}
              onValueChange={(v) => setAuthority(v as ReportingAuthorityId)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTHORITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Classification" required>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger>
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                {classifications.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Reporting deadline"
            hint={
              rule?.notes ??
              "Computed automatically from the incident date and the selected classification."
            }
          >
            <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 font-mono text-sm">
              {deadline ? formatDate(deadline) : "—"}
            </div>
          </Field>

          <Field label="Notes">
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save flag
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
