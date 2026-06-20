"use client"

import * as React from "react"
import Link from "next/link"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { ReportingAuthority, RiddorStatus } from "@prisma/client"
import { ArrowRight, Filter, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import type { RiddorListItem } from "@/lib/flagly/types"
import {
  AUTHORITY_LABELS,
  AUTHORITY_OPTIONS,
  RIDDOR_STATUS_LABELS,
  daysUntil,
  formatDate,
} from "@/lib/flagly/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { DeadlineCountdown } from "@/components/flagly/riddor/DeadlineCountdown"
import { RiddorStatusBadge } from "@/components/flagly/riddor/RiddorStatusBadge"
import { IncidentTypeBadge } from "@/components/flagly/incidents/IncidentTypeBadge"

type AuthorityFilter = ReportingAuthority | "ALL"
type StatusFilter = RiddorStatus | "ALL"

function incidentHref(id: string): string {
  return `/flagly/incidents/${id}`
}

function riddorTabHref(id: string): string {
  return `/flagly/incidents/${id}?tab=riddor`
}

const columns: ColumnDef<RiddorListItem>[] = [
  {
    id: "incident",
    header: "Incident",
    accessorFn: (row) => row.incident.reference,
    enableSorting: false,
    cell: ({ row }) => {
      const incident = row.original.incident
      return (
        <div className="space-y-0.5">
          <Link
            href={incidentHref(incident.id)}
            className="font-mono text-sm font-medium text-foreground hover:text-primary hover:underline"
          >
            {incident.reference}
          </Link>
          <p className="text-xs text-muted-foreground">{incident.location}</p>
        </div>
      )
    },
  },
  {
    id: "occurred",
    header: "Occurred",
    accessorFn: (row) => row.incident.occurredAt.getTime(),
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {formatDate(row.original.incident.occurredAt)}
      </span>
    ),
  },
  {
    id: "type",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => <IncidentTypeBadge type={row.original.incident.type} />,
  },
  {
    id: "classification",
    header: "Classification",
    accessorFn: (row) => row.classification,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.classification}</span>
    ),
  },
  {
    id: "authority",
    header: "Authority",
    accessorFn: (row) => row.authority,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{AUTHORITY_LABELS[row.original.authority]}</span>
    ),
  },
  {
    id: "deadline",
    header: "Deadline",
    accessorFn: (row) => row.reportingDeadline.getTime(),
    cell: ({ row }) => {
      const { reportingDeadline, status } = row.original
      const overdue = daysUntil(reportingDeadline) < 0 && status !== "REPORTED"
      return (
        <span
          className={cn(
            "font-mono text-sm",
            overdue ? "text-severity-critical" : "text-muted-foreground"
          )}
        >
          {formatDate(reportingDeadline)}
        </span>
      )
    },
  },
  {
    id: "daysRemaining",
    header: "Days remaining",
    accessorFn: (row) => row.reportingDeadline.getTime(),
    cell: ({ row }) => (
      <DeadlineCountdown
        deadline={row.original.reportingDeadline}
        status={row.original.status}
        variant="inline"
      />
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.status,
    enableSorting: false,
    cell: ({ row }) => <RiddorStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const { incident, status } = row.original
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open actions menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={incidentHref(incident.id)}>
                  <ArrowRight className="size-4" />
                  View incident
                </Link>
              </DropdownMenuItem>
              {status !== "REPORTED" ? (
                <DropdownMenuItem asChild>
                  <Link href={riddorTabHref(incident.id)}>
                    <ArrowRight className="size-4" />
                    Mark reported
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]

export function RiddorTrackerTable({ flags }: { flags: RiddorListItem[] }) {
  const [authority, setAuthority] = React.useState<AuthorityFilter>("ALL")
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  // Data already arrives sorted by deadline ascending; keep that as initial sort.
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "deadline", desc: false },
  ])

  const filtered = React.useMemo(() => {
    return flags.filter((flag) => {
      if (authority !== "ALL" && flag.authority !== authority) return false
      if (status !== "ALL" && flag.status !== status) return false
      return true
    })
  }, [flags, authority, status])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          <span className="font-medium">Filters</span>
        </div>
        <Select
          value={authority}
          onValueChange={(value) => setAuthority(value as AuthorityFilter)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[180px] gap-2">
            <span className="text-muted-foreground">Authority:</span>
            <SelectValue placeholder="Authority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All authorities</SelectItem>
            {AUTHORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[160px] gap-2">
            <span className="text-muted-foreground">Status:</span>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(Object.keys(RIDDOR_STATUS_LABELS) as RiddorStatus[]).map(
              (value) => (
                <SelectItem key={value} value={value}>
                  {RIDDOR_STATUS_LABELS[value]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-foreground"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " ↑",
                            desc: " ↓",
                          }[header.column.getIsSorted() as string] ?? null}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState
                    title="No flags match your filters."
                    description="Adjust the authority or status filters to see more results."
                    className="border-0 bg-transparent"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
