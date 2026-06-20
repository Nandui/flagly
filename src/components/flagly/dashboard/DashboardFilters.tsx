"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_TIMEFRAME,
  INCIDENT_TYPE_OPTIONS,
  TIMEFRAME_LABELS,
  TIMEFRAME_OPTION_KEYS,
} from "@/lib/flagly/utils"
import { setActiveCenter } from "@/lib/centrely/actions"
import type { Timeframe } from "@/lib/flagly/types"
import type { CenterSummary } from "@/lib/centrely/active-center"

export function DashboardFilters({
  centers,
  activeCenterId,
  timeframe,
  type,
}: {
  centers: CenterSummary[]
  activeCenterId: string | null
  timeframe: Timeframe
  type: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function navigate(next: { tf?: Timeframe; type?: string }) {
    const tf = next.tf ?? timeframe
    const ty = next.type ?? type ?? "ALL"
    const params = new URLSearchParams()
    if (tf !== DEFAULT_TIMEFRAME) params.set("tf", tf)
    if (ty && ty !== "ALL") params.set("type", ty)
    const qs = params.toString()
    router.push(qs ? `/flagly?${qs}` : "/flagly")
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={timeframe} onValueChange={(v) => navigate({ tf: v as Timeframe })}>
        <SelectTrigger className="h-10 w-auto min-w-[185px] gap-2 font-medium">
          <span className="text-muted-foreground">Timeframe:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIMEFRAME_OPTION_KEYS.map((k) => (
            <SelectItem key={k} value={k}>
              {TIMEFRAME_LABELS[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={activeCenterId ?? undefined}
        disabled={pending || centers.length === 0}
        onValueChange={(v) =>
          startTransition(async () => {
            await setActiveCenter(v)
            router.refresh()
          })
        }
      >
        <SelectTrigger className="h-10 w-auto min-w-[200px] gap-2 font-medium">
          <span className="text-muted-foreground">Centre:</span>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {centers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type ?? "ALL"} onValueChange={(v) => navigate({ type: v })}>
        <SelectTrigger className="h-10 w-auto min-w-[150px] gap-2 font-medium">
          <span className="text-muted-foreground">Type:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All</SelectItem>
          {INCIDENT_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
