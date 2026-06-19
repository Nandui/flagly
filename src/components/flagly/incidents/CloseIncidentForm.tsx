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
import { closeIncident } from "@/lib/flagly/actions/incidents"

export function CloseIncidentForm({
  open,
  onOpenChange,
  incidentId,
  closedByName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  incidentId: string
  closedByName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [closureNotes, setClosureNotes] = React.useState("")

  React.useEffect(() => {
    if (open) setClosureNotes("")
  }, [open])

  function submit() {
    startTransition(async () => {
      const result = await closeIncident({ incidentId, closureNotes })
      if (result.ok) {
        toast.success("Incident closed.")
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
          <SheetTitle>Close incident</SheetTitle>
          <SheetDescription>
            Record the outcome. This marks the incident as closed.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <Field label="Closure notes" htmlFor="ci-notes" required>
            <Textarea
              id="ci-notes"
              rows={6}
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              placeholder="What was the outcome / resolution?"
            />
          </Field>
          <Field label="Closed by" htmlFor="ci-by">
            <Input id="ci-by" value={closedByName} readOnly className="bg-muted/50" />
          </Field>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !closureNotes.trim()}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Close incident
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
