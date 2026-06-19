"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setActiveCenter } from "@/lib/centrely/actions"
import type { CenterSummary } from "@/lib/centrely/active-center"

export function CenterSwitcher({
  centers,
  activeCenterId,
}: {
  centers: CenterSummary[]
  activeCenterId: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  if (centers.length === 0) return null

  return (
    <Select
      value={activeCenterId ?? undefined}
      disabled={pending}
      onValueChange={(value) => {
        startTransition(async () => {
          await setActiveCenter(value)
          router.refresh()
        })
      }}
    >
      <SelectTrigger className="h-9 w-full gap-2">
        <Building2 className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Select centre" />
      </SelectTrigger>
      <SelectContent>
        {centers.map((center) => (
          <SelectItem key={center.id} value={center.id}>
            {center.name}
            {center.siteCode ? ` (${center.siteCode})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
