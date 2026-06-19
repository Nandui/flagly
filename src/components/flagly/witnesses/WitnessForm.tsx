"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Witness } from "@prisma/client"

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
import { addWitness, updateWitness } from "@/lib/flagly/actions/witnesses"

export function WitnessForm({
  open,
  onOpenChange,
  incidentId,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  incidentId: string
  record?: Witness | null
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [name, setName] = React.useState("")
  const [roleOrRelation, setRoleOrRelation] = React.useState("")
  const [contactPhone, setContactPhone] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [statement, setStatement] = React.useState("")
  const [statementDate, setStatementDate] = React.useState(
    toDateInputValue(new Date())
  )

  React.useEffect(() => {
    if (!open) return
    setName(record?.name ?? "")
    setRoleOrRelation(record?.roleOrRelation ?? "")
    setContactPhone(record?.contactPhone ?? "")
    setContactEmail(record?.contactEmail ?? "")
    setStatement(record?.statement ?? "")
    setStatementDate(
      record?.statementDate
        ? toDateInputValue(record.statementDate)
        : toDateInputValue(new Date())
    )
  }, [open, record])

  function submit() {
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        roleOrRelation: roleOrRelation.trim(),
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        statement,
        statementDate,
      }
      const result = record
        ? await updateWitness({ id: record.id, ...payload })
        : await addWitness({ incidentId, ...payload })

      if (result.ok) {
        toast.success(record ? "Witness updated." : "Witness statement added.")
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
          <SheetTitle>{record ? "Edit witness" : "Add witness"}</SheetTitle>
          <SheetDescription>
            Record a witness statement for this incident.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <Field label="Name" htmlFor="w-name" required>
            <Input id="w-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Role / relationship" htmlFor="w-role" required>
            <Input
              id="w-role"
              value={roleOrRelation}
              onChange={(e) => setRoleOrRelation(e.target.value)}
              placeholder="e.g. Lifeguard on duty, Gym member"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact phone" htmlFor="w-phone">
              <Input
                id="w-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </Field>
            <Field label="Contact email" htmlFor="w-email">
              <Input
                id="w-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Statement" htmlFor="w-statement" required>
            <Textarea
              id="w-statement"
              rows={5}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
            />
          </Field>
          <Field label="Statement date" htmlFor="w-date" required>
            <Input
              id="w-date"
              type="date"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
            />
          </Field>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {record ? "Save changes" : "Add witness"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
