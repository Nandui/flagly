"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { UserForm } from "@/components/flagly/users/UserForm"
import { deleteUser } from "@/lib/flagly/actions/users"
import type { UserRow } from "@/lib/flagly/types"
import type { CenterSummary } from "@/lib/centrely/active-center"

export function UsersManager({
  users,
  centers,
  currentUserId,
}: {
  users: UserRow[]
  centers: CenterSummary[]
  currentUserId: string
}) {
  const router = useRouter()
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [, startTransition] = React.useTransition()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<UserRow | null>(null)

  function openAdd() {
    setEditing(null)
    setSheetOpen(true)
  }
  function openEdit(user: UserRow) {
    setEditing(user)
    setSheetOpen(true)
  }

  function remove(user: UserRow) {
    setPendingId(user.id)
    startTransition(async () => {
      const result = await deleteUser(user.id)
      setPendingId(null)
      if (result.ok) {
        toast.success("User deleted.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus />
          Add user
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No users yet."
          description="Add the people who need access to Flagly."
          action={
            <Button onClick={openAdd}>
              <Plus />
              Add user
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Centres</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isSelf ? (
                        <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                          you
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.centers.length > 0
                        ? user.centers.map((c) => c.name).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit user"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="text-muted-foreground" />
                        </Button>
                        {isSelf ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete user"
                                  disabled
                                >
                                  <Trash2 className="text-muted-foreground/50" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              You can&apos;t delete your own account.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete user"
                            disabled={pendingId === user.id}
                            onClick={() => remove(user)}
                          >
                            <Trash2 className="text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <UserForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        record={editing}
        centers={centers}
      />
    </div>
  )
}
