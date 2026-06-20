"use client"

import * as React from "react"
import Link from "next/link"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import type {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from "@prisma/client"

import type { CenterSummary } from "@/lib/centrely/active-center"
import type { IncidentListItem } from "@/lib/flagly/types"
import {
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_OPTIONS,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  formatDateTime,
  pluralize,
} from "@/lib/flagly/utils"
import {
  exportIncidentsToExcel,
  exportIncidentsToPdf,
} from "@/lib/flagly/export/list-exports"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { ExportMenu } from "@/components/flagly/shared/ExportMenu"
import { IncidentSeverityBadge } from "@/components/flagly/incidents/IncidentSeverityBadge"
import { IncidentStatusBadge } from "@/components/flagly/incidents/IncidentStatusBadge"
import { IncidentTypeBadge } from "@/components/flagly/incidents/IncidentTypeBadge"

const SEVERITY_OPTIONS = SEVERITY_ORDER.map((value) => ({
  value,
  label: SEVERITY_LABELS[value],
}))

const STATUS_ORDER: IncidentStatus[] = [
  "DRAFT",
  "OPEN",
  "UNDER_INVESTIGATION",
  "CLOSED",
]
const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({
  value,
  label: INCIDENT_STATUS_LABELS[value],
}))

const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  MINOR: 0,
  SIGNIFICANT: 1,
  REPORTABLE: 2,
  CRITICAL: 3,
}
const STATUS_RANK: Record<IncidentStatus, number> = {
  DRAFT: 0,
  OPEN: 1,
  UNDER_INVESTIGATION: 2,
  CLOSED: 3,
}

const ALL_CENTERS = "__all__"
const PAGE_SIZE = 15
const RIGHT_ALIGNED = new Set(["injuredCount"])

function ActionsCell({ row }: { row: IncidentListItem }) {
  if (row.totalActionCount === 0) {
    return <span className="text-muted-foreground">—</span>
  }
  if (row.openActionCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-status-closed">
        <CheckCircle2 className="size-4" />
        complete
      </span>
    )
  }
  return <span className="font-medium">{row.openActionCount} open</span>
}

const columns: ColumnDef<IncidentListItem>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <Link
        href={`/flagly/incidents/${row.original.id}`}
        className="font-mono text-primary hover:underline"
      >
        {row.original.reference}
      </Link>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => <IncidentTypeBadge type={row.original.type} />,
  },
  {
    accessorKey: "severity",
    header: "Severity",
    sortingFn: (a, b) =>
      SEVERITY_RANK[a.original.severity] - SEVERITY_RANK[b.original.severity],
    cell: ({ row }) => <IncidentSeverityBadge severity={row.original.severity} />,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="min-w-[10rem]">
        <div>{row.original.location}</div>
        {row.original.locationDetail ? (
          <div className="text-xs text-muted-foreground">
            {row.original.locationDetail}
          </div>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "occurredAt",
    header: "Occurred",
    sortingFn: (a, b) =>
      new Date(a.original.occurredAt).getTime() -
      new Date(b.original.occurredAt).getTime(),
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-mono text-sm">
        {formatDateTime(row.original.occurredAt)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    sortingFn: (a, b) => STATUS_RANK[a.original.status] - STATUS_RANK[b.original.status],
    cell: ({ row }) => <IncidentStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "injuredCount",
    header: "Injured",
    cell: ({ row }) => <span className="tabular-nums">{row.original.injuredCount}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => <ActionsCell row={row.original} />,
  },
  {
    accessorKey: "reportedBy",
    header: "Reporter",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.original.reportedBy}</span>
    ),
  },
]

function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: T; label: string }[]
  selected: Set<T>
  onToggle: (value: T) => void
}) {
  const count = selected.size
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <Filter className="size-4" />
            {label}
            {count > 0 ? (
              <span className="rounded bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {count}
              </span>
            ) : null}
          </span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.has(option.value)}
            onCheckedChange={() => onToggle(option.value)}
            onSelect={(event) => event.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function IncidentCardItem({ row }: { row: IncidentListItem }) {
  return (
    <Link
      href={`/flagly/incidents/${row.id}`}
      className="block rounded-[var(--radius-card)] border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-medium text-primary">
          {row.reference}
        </span>
        <IncidentSeverityBadge severity={row.severity} />
      </div>
      <p className="mt-1.5 text-sm">
        {row.location}
        {row.locationDetail ? (
          <span className="text-muted-foreground"> · {row.locationDetail}</span>
        ) : null}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <IncidentStatusBadge status={row.status} />
        <span className="font-mono">{formatDateTime(row.occurredAt)}</span>
        <span>{row.reportedBy}</span>
        {row.openActionCount > 0 ? (
          <span className="font-medium text-severity-significant">
            {row.openActionCount} open {pluralize(row.openActionCount, "action")}
          </span>
        ) : null}
      </div>
    </Link>
  )
}

export function IncidentTable({
  incidents,
  centers,
}: {
  incidents: IncidentListItem[]
  centers: CenterSummary[]
}) {
  const [search, setSearch] = React.useState("")
  const [centerId, setCenterId] = React.useState<string>(ALL_CENTERS)
  const [types, setTypes] = React.useState<Set<IncidentType>>(new Set())
  const [severities, setSeverities] = React.useState<Set<IncidentSeverity>>(
    new Set()
  )
  const [statuses, setStatuses] = React.useState<Set<IncidentStatus>>(new Set())
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "occurredAt", desc: true },
  ])

  function makeToggle<T extends string>(
    setter: React.Dispatch<React.SetStateAction<Set<T>>>
  ) {
    return (value: T) =>
      setter((prev) => {
        const next = new Set(prev)
        if (next.has(value)) next.delete(value)
        else next.add(value)
        return next
      })
  }

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null

    return incidents.filter((row) => {
      if (term) {
        const haystack =
          `${row.reference} ${row.location} ${row.locationDetail ?? ""} ${row.reportedBy}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (centerId !== ALL_CENTERS && row.centerId !== centerId) return false
      if (types.size > 0 && !types.has(row.type)) return false
      if (severities.size > 0 && !severities.has(row.severity)) return false
      if (statuses.size > 0 && !statuses.has(row.status)) return false
      const occurred = new Date(row.occurredAt)
      if (from && occurred < from) return false
      if (to && occurred > to) return false
      return true
    })
  }, [incidents, search, centerId, types, severities, statuses, fromDate, toDate])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  })

  const activeFilters =
    search.trim().length > 0 ||
    centerId !== ALL_CENTERS ||
    types.size > 0 ||
    severities.size > 0 ||
    statuses.size > 0 ||
    fromDate.length > 0 ||
    toDate.length > 0

  function clearFilters() {
    setSearch("")
    setCenterId(ALL_CENTERS)
    setTypes(new Set())
    setSeverities(new Set())
    setStatuses(new Set())
    setFromDate("")
    setToDate("")
  }

  async function handleExportExcel() {
    if (filtered.length === 0) {
      toast.error("Nothing to export.")
      return
    }
    try {
      await exportIncidentsToExcel(filtered)
      toast.success("Exported to Excel.")
    } catch {
      toast.error("Export to Excel failed.")
    }
  }

  async function handleExportPdf() {
    if (filtered.length === 0) {
      toast.error("Nothing to export.")
      return
    }
    try {
      await exportIncidentsToPdf(filtered)
      toast.success("Exported to PDF.")
    } catch {
      toast.error("Export to PDF failed.")
    }
  }

  if (incidents.length === 0) {
    return (
      <EmptyState
        title="No incidents reported yet."
        description="Use the button above to file your first report."
        action={
          <Button asChild>
            <Link href="/flagly/incidents/new">Report incident</Link>
          </Button>
        }
      />
    )
  }

  const rows = table.getRowModel().rows
  const total = filtered.length
  const { pageIndex, pageSize } = table.getState().pagination
  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, location, reporter…"
              className="pl-9"
              aria-label="Search incidents"
            />
          </div>

          <Select value={centerId} onValueChange={setCenterId}>
            <SelectTrigger className="w-auto min-w-[12rem] gap-2" aria-label="Filter by centre">
              <span className="text-muted-foreground">Centre:</span>
              <SelectValue placeholder="All centres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CENTERS}>All centres</SelectItem>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <MultiSelectFilter
            label="Type"
            options={INCIDENT_TYPE_OPTIONS}
            selected={types}
            onToggle={makeToggle(setTypes)}
          />
          <MultiSelectFilter
            label="Severity"
            options={SEVERITY_OPTIONS}
            selected={severities}
            onToggle={makeToggle(setSeverities)}
          />
          <MultiSelectFilter
            label="Status"
            options={STATUS_OPTIONS}
            selected={statuses}
            onToggle={makeToggle(setStatuses)}
          />

          <div className="ml-auto">
            <ExportMenu
              items={[
                {
                  label: "Export to Excel",
                  icon: FileSpreadsheet,
                  onSelect: handleExportExcel,
                },
                {
                  label: "Export to PDF",
                  icon: FileText,
                  onSelect: handleExportPdf,
                },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Occurred</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-9 w-[10rem]"
              aria-label="Occurred from"
            />
            <span>to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-9 w-[10rem]"
              aria-label="Occurred to"
            />
          </div>

          {activeFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Search}
          title="No incidents match your filters."
          description="Try a different search, or clear the filters to see every incident."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop / tablet: full table */}
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort()
                      const sorted = header.column.getIsSorted()
                      const alignRight = RIGHT_ALIGNED.has(header.column.id)
                      const label = header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                      return (
                        <TableHead
                          key={header.id}
                          className={alignRight ? "text-right" : undefined}
                        >
                          {canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className={cnSort(alignRight)}
                              aria-label={`Sort by ${String(
                                header.column.columnDef.header
                              )}`}
                            >
                              {label}
                              {sorted === "asc" ? (
                                <ChevronUp className="size-3.5" />
                              ) : sorted === "desc" ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronsUpDown className="size-3.5 opacity-40" />
                              )}
                            </button>
                          ) : (
                            label
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          RIGHT_ALIGNED.has(cell.column.id) ? "text-right" : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <IncidentCardItem key={row.id} row={row.original} />
            ))}
          </div>

          {/* Pagination / count */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground tabular-nums">
              {total > pageSize ? `Showing ${start}–${end} of ${total}` : `${total} ${pluralize(total, "incident")}`}
            </span>
            {total > pageSize ? (
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

function cnSort(alignRight: boolean): string {
  return [
    "inline-flex items-center gap-1 transition-colors hover:text-foreground",
    alignRight ? "flex-row-reverse" : "",
  ]
    .filter(Boolean)
    .join(" ")
}
