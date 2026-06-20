"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"
import {
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Filter,
  Loader2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDate, ACTION_STATUS_LABELS } from "@/lib/flagly/utils"
import { setActionStatus } from "@/lib/flagly/actions/followup"
import type { ActionListItem } from "@/lib/flagly/types"
import type { CenterSummary } from "@/lib/centrely/active-center"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { ActionStatusBadge } from "@/components/flagly/actions/ActionStatusBadge"

const ALL_CENTERS = "__all__"

// "Outstanding" hides completed actions by default.
type StatusFilter = "OUTSTANDING" | "OPEN" | "IN_PROGRESS" | "COMPLETE" | "OVERDUE" | "ALL"

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "OUTSTANDING", label: "Outstanding" },
  { value: "OPEN", label: ACTION_STATUS_LABELS.OPEN },
  { value: "IN_PROGRESS", label: ACTION_STATUS_LABELS.IN_PROGRESS },
  { value: "OVERDUE", label: ACTION_STATUS_LABELS.OVERDUE },
  { value: "COMPLETE", label: ACTION_STATUS_LABELS.COMPLETE },
  { value: "ALL", label: "All statuses" },
]

function MarkCompleteButton({ action }: { action: ActionListItem }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await setActionStatus({
            id: action.id,
            status: "COMPLETE",
          })
          if (result.ok) {
            toast.success("Action marked complete.")
            router.refresh()
          } else {
            toast.error(result.error)
          }
        })
      }}
    >
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <CheckCircle2 />
      )}
      Mark complete
    </Button>
  )
}

export function FollowUpActionsOverviewTable({
  actions,
  centers,
}: {
  actions: ActionListItem[]
  centers: CenterSummary[]
}) {
  const [centerId, setCenterId] = React.useState<string>(ALL_CENTERS)
  const [status, setStatus] = React.useState<StatusFilter>("OUTSTANDING")
  const [assignedTo, setAssignedTo] = React.useState<string>("")

  const filtered = React.useMemo(() => {
    const query = assignedTo.trim().toLowerCase()
    return actions.filter((action) => {
      if (centerId !== ALL_CENTERS && action.incident.centerId !== centerId) {
        return false
      }
      if (status === "OUTSTANDING") {
        if (action.status === "COMPLETE") return false
      } else if (status !== "ALL" && action.status !== status) {
        return false
      }
      if (query && !action.assignedTo.toLowerCase().includes(query)) {
        return false
      }
      return true
    })
  }, [actions, centerId, status, assignedTo])

  const columns = React.useMemo<ColumnDef<ActionListItem>[]>(
    () => [
      {
        accessorKey: "reference",
        header: "Incident",
        cell: ({ row }) => (
          <Link
            href={`/flagly/incidents/${row.original.incident.id}`}
            className="font-mono text-sm text-primary hover:underline"
          >
            {row.original.incident.reference}
          </Link>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.incident.location}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Action",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.description}</span>
        ),
      },
      {
        accessorKey: "assignedTo",
        header: "Assigned to",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.assignedTo}</span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due date",
        cell: ({ row }) => (
          <span className="font-mono text-sm whitespace-nowrap">
            {formatDate(row.original.dueDate)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ActionStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            {row.original.status !== "COMPLETE" ? (
              <MarkCompleteButton action={row.original} />
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link href={`/flagly/incidents/${row.original.incident.id}`}>
                View incident
                <ArrowRight />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // No actions exist at all.
  if (actions.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No follow-up actions have been assigned."
        description="Follow-up actions added to incidents will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          <span className="font-medium">Filters</span>
        </div>
        <Select value={centerId} onValueChange={setCenterId}>
          <SelectTrigger className="h-9 w-auto min-w-[180px] gap-2">
            <span className="text-muted-foreground">Centre:</span>
            <SelectValue placeholder="All centres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CENTERS}>All centres</SelectItem>
            {centers.map((center) => (
              <SelectItem key={center.id} value={center.id}>
                {center.name}
                {center.siteCode ? ` (${center.siteCode})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[170px] gap-2">
            <span className="text-muted-foreground">Status:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={assignedTo}
          onChange={(event) => setAssignedTo(event.target.value)}
          placeholder="Assigned to…"
          className="h-9 w-auto min-w-[180px]"
          aria-label="Filter by assignee"
        />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.id === "actions" ? "text-right" : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No actions match your filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    row.original.status === "OVERDUE" &&
                      "border-l-4 border-l-severity-critical bg-severity-critical-bg/40"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
