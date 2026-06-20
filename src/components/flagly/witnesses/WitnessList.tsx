"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Mail, Pencil, PhoneCall, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Witness } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { formatDate } from "@/lib/flagly/utils"
import { deleteWitness } from "@/lib/flagly/actions/witnesses"

export function WitnessList({
  witnesses,
  onEdit,
}: {
  witnesses: Witness[]
  onEdit: (witness: Witness) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  if (witnesses.length === 0) {
    return <EmptyState title="No witness statements recorded." />
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteWitness(id)
      if (result.ok) {
        toast.success("Witness removed.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {witnesses.map((witness) => (
        <div key={witness.id} className="rounded-[var(--radius-card)] border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{witness.name}</p>
              <p className="text-sm text-muted-foreground">{witness.roleOrRelation}</p>
            </div>
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit witness"
                onClick={() => onEdit(witness)}
              >
                <Pencil className="text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove witness"
                disabled={pending}
                onClick={() => remove(witness.id)}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          {witness.contactPhone || witness.contactEmail ? (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {witness.contactPhone ? (
                <span className="inline-flex items-center gap-1">
                  <PhoneCall className="size-3" />
                  {witness.contactPhone}
                </span>
              ) : null}
              {witness.contactEmail ? (
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3" />
                  {witness.contactEmail}
                </span>
              ) : null}
            </div>
          ) : null}

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {witness.statement}
          </p>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Statement dated {formatDate(witness.statementDate)}
          </p>
        </div>
      ))}
    </div>
  )
}
