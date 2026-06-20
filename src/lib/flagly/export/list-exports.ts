import type { IncidentListItem } from "@/lib/flagly/types"
import {
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,
  formatDateTime,
} from "@/lib/flagly/utils"

// ─── Shared row mapping ──────────────────────────────────────────────────────
// Turn an IncidentListItem into a flat, human-readable record using the label
// maps so exported cells read like the UI, not raw enum values.

const COLUMNS = [
  "Reference",
  "Type",
  "Severity",
  "Centre",
  "Location",
  "Occurred",
  "Status",
  "Injured",
  "Actions",
  "Reporter",
] as const

function actionsLabel(row: IncidentListItem): string {
  if (row.totalActionCount === 0) return "—"
  if (row.openActionCount === 0) return "Complete"
  return `${row.openActionCount} open`
}

function locationLabel(row: IncidentListItem): string {
  return row.locationDetail
    ? `${row.location} — ${row.locationDetail}`
    : row.location
}

function toRecord(row: IncidentListItem): Record<(typeof COLUMNS)[number], string | number> {
  return {
    Reference: row.reference,
    Type: INCIDENT_TYPE_LABELS[row.type],
    Severity: SEVERITY_LABELS[row.severity],
    Centre: row.centerName,
    Location: locationLabel(row),
    Occurred: formatDateTime(row.occurredAt),
    Status: INCIDENT_STATUS_LABELS[row.status],
    Injured: row.injuredCount,
    Actions: actionsLabel(row),
    Reporter: row.reportedBy,
  }
}

function exportTimestamp(): string {
  return formatDateTime(new Date())
}

// ─── Excel (SheetJS) ─────────────────────────────────────────────────────────

export async function exportIncidentsToExcel(rows: IncidentListItem[]): Promise<void> {
  const XLSX = await import("xlsx")

  const data = rows.map(toRecord)
  const worksheet = XLSX.utils.json_to_sheet(data, { header: [...COLUMNS] })

  // Reasonable default column widths.
  worksheet["!cols"] = [
    { wch: 14 }, // Reference
    { wch: 18 }, // Type
    { wch: 12 }, // Severity
    { wch: 22 }, // Centre
    { wch: 32 }, // Location
    { wch: 20 }, // Occurred
    { wch: 18 }, // Status
    { wch: 8 }, // Injured
    { wch: 12 }, // Actions
    { wch: 20 }, // Reporter
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Incidents")

  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `flagly-incidents-${stamp}.xlsx`)
}

// ─── PDF (jsPDF) ─────────────────────────────────────────────────────────────

export async function exportIncidentsToPdf(rows: IncidentListItem[]): Promise<void> {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 32

  // Clean white background.
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, "F")

  // Header.
  doc.setTextColor(17, 24, 39)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("Flagly — Incident Log", margin, margin + 4)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text(`Exported ${exportTimestamp()}`, margin, margin + 22)
  doc.text(`${rows.length} incident${rows.length === 1 ? "" : "s"}`, pageWidth - margin, margin + 22, {
    align: "right",
  })

  // Table geometry. A compact subset of columns keeps the landscape page tidy.
  const headers = [
    "Reference",
    "Type",
    "Severity",
    "Centre",
    "Location",
    "Occurred",
    "Status",
    "Reporter",
  ]
  const widths = [70, 70, 64, 96, 120, 96, 84, 92]
  const startX = margin
  let y = margin + 48
  const rowHeight = 18

  const drawHeaderRow = () => {
    doc.setFillColor(243, 244, 246)
    doc.rect(startX, y - 12, pageWidth - margin * 2, rowHeight, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(55, 65, 81)
    let x = startX + 4
    headers.forEach((h, i) => {
      doc.text(h, x, y)
      x += widths[i]
    })
    y += rowHeight
  }

  const clip = (text: string, width: number): string => {
    const max = Math.max(1, Math.floor(width / 4.2))
    return text.length > max ? `${text.slice(0, max - 1)}…` : text
  }

  drawHeaderRow()

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  rows.forEach((row, index) => {
    if (y > pageHeight - margin) {
      doc.addPage()
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, "F")
      y = margin + 12
      drawHeaderRow()
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
    }

    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251)
      doc.rect(startX, y - 12, pageWidth - margin * 2, rowHeight, "F")
    }

    const record = toRecord(row)
    const cells = [
      record.Reference,
      record.Type,
      record.Severity,
      record.Centre,
      record.Location,
      record.Occurred,
      record.Status,
      record.Reporter,
    ].map(String)

    doc.setTextColor(31, 41, 55)
    let x = startX + 4
    cells.forEach((cell, i) => {
      doc.text(clip(cell, widths[i]), x, y)
      x += widths[i]
    })
    y += rowHeight
  })

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`flagly-incidents-${stamp}.pdf`)
}
