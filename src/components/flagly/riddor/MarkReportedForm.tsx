"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Field } from "@/components/flagly/shared/Field"
import { toDateInputValue } from "@/lib/flagly/utils"
import { markReported } from "@/lib/flagly/actions/riddor"

export function MarkReportedForm({
  open,
  onOpenChange,
  riddorFlagId,
  defaultReportedBy,
  defaultNotes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  riddorFlagId: string
  defaultReportedBy: string
  defaultNotes?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [reportedAt, setReportedAt] = React.useState(toDateInputValue(new Date()))
  const [referenceNumber, setReferenceNumber] = React.useState("")
  const [reportedBy, setReportedBy] = React.useState(defaultReportedBy)
  const [method, setMethod] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setReportedAt(toDateInputValue(new Date()))
    setReferenceNumber("")
    setReportedBy(defaultReportedBy)
    setMethod("")
    setNotes(defaultNotes ?? "")
  }, [open, defaultReportedBy, defaultNotes])

  function submit() {
    startTransition(async () => {
      const result = await markReported({
        riddorFlagId,
        reportedAt,
        referenceNumber: referenceNumber.trim() || undefined,
        reportedBy: reportedBy.trim(),
        method: method.trim(),
        notes,
      })
      if (result.ok) {
        toast.success("Marked as reported.")
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
          <SheetTitle>Mark as reported</SheetTitle>
          <SheetDescription>
            Record the submission to the relevant authority.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <Field label="Date reported" htmlFor="mr-date" required>
            <Input
              id="mr-date"
              type="date"
              value={reportedAt}
              onChange={(e) => setReportedAt(e.target.value)}
            />
          </Field>
          <Field
            label="Reference number"
            htmlFor="mr-ref"
            hint="The reference given by the HSA / RIDDOR portal."
          >
            <Input
              id="mr-ref"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </Field>
          <Field label="Reported by" htmlFor="mr-by" required>
            <Input
              id="mr-by"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
            />
          </Field>
          <Field label="Method" htmlFor="mr-method" required>
            <Input
              id="mr-method"
              value={method}
              placeholder="e.g. Online via BeSafe portal, Phone"
              onChange={(e) => setMethod(e.target.value)}
            />
          </Field>
          <Field label="Notes" htmlFor="mr-notes">
            <Textarea
              id="mr-notes"
              rows={3}
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
            Mark as reported
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
