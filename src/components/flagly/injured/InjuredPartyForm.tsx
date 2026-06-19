"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { InjuredParty } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
import {
  INJURED_PARTY_TYPE_OPTIONS,
  TREATMENT_OPTIONS,
} from "@/lib/flagly/utils"
import {
  addInjuredParty,
  updateInjuredParty,
} from "@/lib/flagly/actions/injured"

export function InjuredPartyForm({
  open,
  onOpenChange,
  incidentId,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  incidentId: string
  record?: InjuredParty | null
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [partyType, setPartyType] = React.useState("MEMBER")
  const [name, setName] = React.useState("")
  const [contactPhone, setContactPhone] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [injuryNature, setInjuryNature] = React.useState("")
  const [bodyPartAffected, setBodyPartAffected] = React.useState("")
  const [treatment, setTreatment] = React.useState("FIRST_AID_ONLY")
  const [hospitalName, setHospitalName] = React.useState("")
  const [lostTime, setLostTime] = React.useState(false)
  const [lostTimeDays, setLostTimeDays] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setPartyType(record?.partyType ?? "MEMBER")
    setName(record?.name ?? "")
    setContactPhone(record?.contactPhone ?? "")
    setContactEmail(record?.contactEmail ?? "")
    setInjuryNature(record?.injuryNature ?? "")
    setBodyPartAffected(record?.bodyPartAffected ?? "")
    setTreatment(record?.treatment ?? "FIRST_AID_ONLY")
    setHospitalName(record?.hospitalName ?? "")
    setLostTime(record?.lostTime ?? false)
    setLostTimeDays(record?.lostTimeDays ? String(record.lostTimeDays) : "")
  }, [open, record])

  const showHospital =
    treatment === "HOSPITAL_AE" || treatment === "HOSPITAL_ADMITTED"

  function submit() {
    startTransition(async () => {
      const payload = {
        partyType,
        name: name.trim(),
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        injuryNature: injuryNature.trim(),
        bodyPartAffected: bodyPartAffected.trim(),
        treatment,
        hospitalName: hospitalName.trim() || undefined,
        lostTime,
        lostTimeDays: lostTime && lostTimeDays ? Number(lostTimeDays) : undefined,
      }
      const result = record
        ? await updateInjuredParty({ id: record.id, ...payload })
        : await addInjuredParty({ incidentId, ...payload })

      if (result.ok) {
        toast.success(record ? "Injured party updated." : "Injured party added.")
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
            {record ? "Edit injured party" : "Add injured party"}
          </SheetTitle>
          <SheetDescription>
            Record details of a person injured in this incident.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Party type" required>
              <Select value={partyType} onValueChange={setPartyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INJURED_PARTY_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Name" htmlFor="ip-name" required>
              <Input
                id="ip-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Contact phone" htmlFor="ip-phone">
              <Input
                id="ip-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </Field>
            <Field label="Contact email" htmlFor="ip-email">
              <Input
                id="ip-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </Field>
            <Field label="Nature of injury" htmlFor="ip-injury" required>
              <Input
                id="ip-injury"
                value={injuryNature}
                placeholder="e.g. Suspected fractured wrist"
                onChange={(e) => setInjuryNature(e.target.value)}
              />
            </Field>
            <Field label="Body part affected" htmlFor="ip-body" required>
              <Input
                id="ip-body"
                value={bodyPartAffected}
                onChange={(e) => setBodyPartAffected(e.target.value)}
              />
            </Field>
            <Field label="Treatment given" required className="sm:col-span-2">
              <Select value={treatment} onValueChange={setTreatment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TREATMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {showHospital ? (
              <Field label="Hospital name" htmlFor="ip-hospital" className="sm:col-span-2">
                <Input
                  id="ip-hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                />
              </Field>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
            <span className="text-sm font-medium">Lost time?</span>
            <Switch checked={lostTime} onCheckedChange={setLostTime} />
          </div>
          {lostTime ? (
            <Field label="Days lost" htmlFor="ip-days">
              <Input
                id="ip-days"
                type="number"
                min={1}
                value={lostTimeDays}
                onChange={(e) => setLostTimeDays(e.target.value)}
              />
            </Field>
          ) : null}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {record ? "Save changes" : "Add injured party"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
