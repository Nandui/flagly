"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { DEFAULT_ROLE, USER_ROLE_OPTIONS } from "@/lib/centrely/roles"
import { createUser, updateUser } from "@/lib/flagly/actions/users"
import type { UserRow } from "@/lib/flagly/types"
import type { CenterSummary } from "@/lib/centrely/active-center"

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
  const [role, setRole] = React.useState<string>(DEFAULT_ROLE)
  const [centerIds, setCenterIds] = React.useState<string[]>([])
  const [password, setPassword] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setName(record?.name ?? "")
    setEmail(record?.email ?? "")
    setRole(record?.role ?? DEFAULT_ROLE)
    setCenterIds(record?.centers.map((c) => c.id) ?? [])
    setPassword("")
  }, [open, record])

  function toggleCenter(id: string) {
    setCenterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function submit() {
    startTransition(async () => {
      const base = {
        name: name.trim(),
        email: email.trim(),
        role,
        centerIds,
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
          <Field
            label="Centres"
            hint="Select one or more. Leave all unticked if the user isn't tied to a centre."
          >
            {centers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No centres yet.</p>
            ) : (
              <div className="flex flex-col gap-1 rounded-[var(--radius)] border p-1">
                {centers.map((c) => (
                  <label
                    key={c.id}
                    htmlFor={`u-center-${c.id}`}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`u-center-${c.id}`}
                      checked={centerIds.includes(c.id)}
                      onCheckedChange={() => toggleCenter(c.id)}
                    />
                    <span className="text-sm">
                      {c.name}
                      {c.siteCode ? (
                        <span className="text-muted-foreground"> ({c.siteCode})</span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
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
