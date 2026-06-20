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
import { USER_ROLE_OPTIONS } from "@/lib/flagly/utils"
import { createUser, updateUser } from "@/lib/flagly/actions/users"
import type { UserRow } from "@/lib/flagly/types"
import type { CenterSummary } from "@/lib/centrely/active-center"

const NO_CENTER = "__none__"

export function UserForm({
  open,
  onOpenChange,
  record,
  centers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: UserRow | null
  centers: CenterSummary[]
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("Viewer")
  const [centerId, setCenterId] = React.useState(NO_CENTER)
  const [password, setPassword] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setName(record?.name ?? "")
    setEmail(record?.email ?? "")
    setRole(record?.role ?? "Viewer")
    setCenterId(record?.centerId ?? NO_CENTER)
    setPassword("")
  }, [open, record])

  function submit() {
    startTransition(async () => {
      const base = {
        name: name.trim(),
        email: email.trim(),
        role,
        centerId: centerId === NO_CENTER ? undefined : centerId,
      }
      const result = record
        ? await updateUser({
            id: record.id,
            ...base,
            password: password.trim() || undefined,
          })
        : await createUser({ ...base, password })

      if (result.ok) {
        toast.success(record ? "User updated." : "User added.")
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
          <SheetTitle>{record ? "Edit user" : "Add user"}</SheetTitle>
          <SheetDescription>
            Users sign in with their email and password. Role controls what they
            can do; the centre is their home site.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <Field label="Name" htmlFor="u-name" required>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="u-email" required>
            <Input
              id="u-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Role" required>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Centre">
            <Select value={centerId} onValueChange={setCenterId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CENTER}>No centre</SelectItem>
                {centers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.siteCode ? ` (${c.siteCode})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label={record ? "New password" : "Password"}
            htmlFor="u-password"
            required={!record}
            hint={
              record
                ? "Leave blank to keep the current password."
                : "At least 8 characters."
            }
          >
            <Input
              id="u-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {record ? "Save changes" : "Add user"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
