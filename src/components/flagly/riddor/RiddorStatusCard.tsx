import { Pencil } from "lucide-react"
import type { RiddorFlag } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RiddorStatusBadge } from "@/components/flagly/riddor/RiddorStatusBadge"
import { DeadlineCountdown } from "@/components/flagly/riddor/DeadlineCountdown"
import { AUTHORITY_FULL_LABELS, formatDate } from "@/lib/flagly/utils"

export function RiddorStatusCard({
  flag,
  onMarkReported,
  onEdit,
}: {
  flag: RiddorFlag
  onMarkReported: () => void
  onEdit: () => void
}) {
  const isReported = flag.status === "REPORTED"

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Authority
            </p>
            <p className="font-medium">{AUTHORITY_FULL_LABELS[flag.authority]}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
              Classification
            </p>
            <p className="font-medium">{flag.classification}</p>
          </div>
          <div className="flex items-center gap-2">
            <RiddorStatusBadge status={flag.status} />
            <Button variant="ghost" size="icon" aria-label="Edit flag" onClick={onEdit}>
              <Pencil className="text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Reporting deadline
            </p>
            <p className="font-mono text-sm">{formatDate(flag.reportingDeadline)}</p>
          </div>
          <DeadlineCountdown deadline={flag.reportingDeadline} status={flag.status} />
        </div>

        {isReported ? (
          <div className="grid gap-4 rounded-lg border bg-muted/40 p-4 sm:grid-cols-2">
            <Detail label="Reported on" value={formatDate(flag.reportedAt)} mono />
            <Detail label="Reference number" value={flag.referenceNumber ?? "—"} mono />
            <Detail label="Reported by" value={flag.reportedBy ?? "—"} />
            <Detail label="Method" value={flag.method ?? "—"} />
          </div>
        ) : (
          <Button onClick={onMarkReported}>Mark as reported</Button>
        )}

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {flag.notes?.trim() ? flag.notes : "No notes recorded."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-sm" : "text-sm"}>{value}</p>
    </div>
  )
}
