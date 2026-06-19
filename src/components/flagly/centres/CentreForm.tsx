"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { REGION_OPTIONS } from "@/lib/flagly/utils"
import { createCenter, updateCenter } from "@/lib/flagly/actions/centers"
import type { CenterRow } from "@/lib/flagly/data/centers"

export function CentreForm({
  open,
  onOpenChange,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: CenterRow | null
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [name, setName] = React.useState("")
  const [siteCode, setSiteCode] = React.useState("")
  const [region, setRegion] = React.useState("IRELAND")
  const [address, setAddress] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setName(record?.name ?? "")
    setSiteCode(record?.siteCode ?? "")
    setRegion(record?.region ?? "IRELAND")
    setAddress(record?.address ?? "")
  }, [open, record])

  function submit() {
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        siteCode: siteCode.trim() || undefined,
        region,
        address: address.trim() || undefined,
      }
      const result = record
        ? await updateCenter({ id: record.id, ...payload })
        : await createCenter(payload)

      if (result.ok) {
        toast.success(record ? "Centre updated." : "Centre added.")
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
          <SheetTitle>{record ? "Edit centre" : "Add centre"}</SheetTitle>
          <SheetDescription>
            Centres scope incidents and drive the incident reference prefix
            (INC-<span className="font-mono">XX</span>-NNNN).
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <Field label="Name" htmlFor="c-name" required>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field
            label="Site code"
            htmlFor="c-code"
            hint="2–4 letters, used in references e.g. INC-LW-0001."
          >
            <Input
              id="c-code"
              value={siteCode}
              maxLength={4}
              className="font-mono uppercase"
              onChange={(e) => setSiteCode(e.target.value.toUpperCase())}
              placeholder="LW"
            />
          </Field>
          <Field label="Region" required>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Address" htmlFor="c-address">
            <Input
              id="c-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {record ? "Save changes" : "Add centre"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
