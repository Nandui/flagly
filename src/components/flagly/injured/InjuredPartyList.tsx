"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Hospital, Mail, Pencil, PhoneCall, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { InjuredParty } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import {
  INJURED_PARTY_TYPE_LABELS,
  TREATMENT_LABELS,
} from "@/lib/flagly/utils"
import { deleteInjuredParty } from "@/lib/flagly/actions/injured"

export function InjuredPartyList({
  parties,
  onEdit,
}: {
  parties: InjuredParty[]
  onEdit: (party: InjuredParty) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  if (parties.length === 0) {
    return <EmptyState title="No injured parties recorded for this incident." />
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteInjuredParty(id)
      if (result.ok) {
        toast.success("Injured party removed.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {parties.map((party) => (
        <div key={party.id} className="rounded-[var(--radius-card)] border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {INJURED_PARTY_TYPE_LABELS[party.partyType]}
                </Badge>
                {party.lostTime ? (
                  <Badge
                    variant="outline"
                    className="bg-severity-significant-bg text-severity-significant border-severity-significant-line"
                  >
                    Lost time{party.lostTimeDays ? ` · ${party.lostTimeDays}d` : ""}
                  </Badge>
                ) : null}
              </div>
              <p className="font-medium">{party.name}</p>
            </div>
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit injured party"
                onClick={() => onEdit(party)}
              >
                <Pencil className="text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove injured party"
                disabled={pending}
                onClick={() => remove(party.id)}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Injury</dt>
              <dd>{party.injuryNature}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Body part</dt>
              <dd>{party.bodyPartAffected}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Treatment</dt>
              <dd>{TREATMENT_LABELS[party.treatment]}</dd>
            </div>
            {party.hospitalName ? (
              <div>
                <dt className="text-xs text-muted-foreground">Hospital</dt>
                <dd className="inline-flex items-center gap-1">
                  <Hospital className="size-3.5 text-muted-foreground" />
                  {party.hospitalName}
                </dd>
              </div>
            ) : null}
          </dl>

          {party.contactPhone || party.contactEmail ? (
            <div className="mt-3 flex flex-wrap gap-3 border-t pt-3 text-xs text-muted-foreground">
              {party.contactPhone ? (
                <span className="inline-flex items-center gap-1">
                  <PhoneCall className="size-3" />
                  {party.contactPhone}
                </span>
              ) : null}
              {party.contactEmail ? (
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3" />
                  {party.contactEmail}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
