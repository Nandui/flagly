"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2, Pencil, Plus, Trash2 } from "lucide-react"
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
import { CentreForm } from "@/components/flagly/centres/CentreForm"
import { REGION_LABELS } from "@/lib/flagly/utils"
import { deleteCenter } from "@/lib/flagly/actions/centers"
import type { CenterRow } from "@/lib/flagly/data/centers"

export function CentresManager({ centers }: { centers: CenterRow[] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [, startTransition] = React.useTransition()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CenterRow | null>(null)

  function openAdd() {
    setEditing(null)
    setSheetOpen(true)
  }
  function openEdit(center: CenterRow) {
    setEditing(center)
    setSheetOpen(true)
  }

  function remove(center: CenterRow) {
    setPendingId(center.id)
    startTransition(async () => {
      const result = await deleteCenter(center.id)
      setPendingId(null)
      if (result.ok) {
        toast.success("Centre deleted.")
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
          Add centre
        </Button>
      </div>

      {centers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No centres yet."
          description="Add your first centre to start reporting incidents."
          action={
            <Button onClick={openAdd}>
              <Plus />
              Add centre
            </Button>
          }
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Site code</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Incidents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centers.map((center) => {
                const hasIncidents = center.incidentCount > 0
                return (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {center.siteCode ?? "—"}
                    </TableCell>
                    <TableCell>{REGION_LABELS[center.region]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {center.address ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{center.incidentCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit centre"
                          onClick={() => openEdit(center)}
                        >
                          <Pencil className="text-muted-foreground" />
                        </Button>
                        {hasIncidents ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete centre"
                                  disabled
                                >
                                  <Trash2 className="text-muted-foreground/50" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Centres with incidents can&apos;t be deleted.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete centre"
                            disabled={pendingId === center.id}
                            onClick={() => remove(center)}
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

      <CentreForm open={sheetOpen} onOpenChange={setSheetOpen} record={editing} />
    </div>
  )
}
