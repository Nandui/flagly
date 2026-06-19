import type { IncidentDetail } from "@/lib/flagly/types"
import {
  ACTION_STATUS_LABELS,
  AUTHORITY_FULL_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  INJURED_PARTY_TYPE_LABELS,
  RIDDOR_STATUS_LABELS,
  SEVERITY_LABELS,
  TREATMENT_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/flagly/utils"

/**
 * Produce a clean, white-background, text-based PDF of a single incident —
 * narrative, injured parties, witnesses, follow-up actions and the RIDDOR/HSA
 * flag. Suitable for insurance submission or regulatory use.
 */
export async function exportIncidentReportToPdf(incident: IncidentDetail) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "pt", format: "a4" })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const ensure = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  const text = (
    value: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {}
  ) => {
    const size = opts.size ?? 10
    doc.setFont("helvetica", opts.bold ? "bold" : "normal")
    doc.setFontSize(size)
    doc.setTextColor(...(opts.color ?? [17, 24, 39]))
    const lines = doc.splitTextToSize(value, contentWidth) as string[]
    for (const line of lines) {
      ensure(size + 4)
      doc.text(line, margin, y)
      y += size + 4
    }
    y += opts.gap ?? 0
  }

  const heading = (value: string) => {
    ensure(28)
    y += 8
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y, pageWidth - margin, y)
    y += 14
    text(value, { size: 12, bold: true, color: [15, 23, 42] })
    y += 2
  }

  const field = (label: string, value: string) => {
    ensure(26)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(label.toUpperCase(), margin, y)
    y += 12
    text(value || "—", { size: 10 })
    y += 2
  }

  // ── Header ──
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(79, 70, 229)
  doc.text("Flagly", margin, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text("Incident Report", pageWidth - margin, y, { align: "right" })
  y += 18
  doc.setDrawColor(79, 70, 229)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)
  doc.setLineWidth(1)
  y += 20

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text(incident.reference, margin, y)
  y += 18
  text(`${incident.center.name}${incident.center.siteCode ? ` (${incident.center.siteCode})` : ""}`, {
    size: 10,
    color: [71, 85, 105],
  })
  text(`Exported ${formatDateTime(new Date())}`, { size: 9, color: [100, 116, 139], gap: 4 })

  // ── Summary ──
  heading("Incident details")
  field("Type", INCIDENT_TYPE_LABELS[incident.type])
  field("Severity", SEVERITY_LABELS[incident.severity])
  field("Status", INCIDENT_STATUS_LABELS[incident.status])
  field("Occurred", formatDateTime(incident.occurredAt))
  field(
    "Location",
    incident.locationDetail
      ? `${incident.location} — ${incident.locationDetail}`
      : incident.location
  )
  field("Reported by", incident.reportedBy)

  // ── Narrative ──
  heading("Description")
  text(incident.description || "—", { size: 10 })
  if (incident.immediateAction) {
    y += 6
    text("Immediate action taken", { size: 9, bold: true, color: [100, 116, 139] })
    text(incident.immediateAction, { size: 10 })
  }

  // ── Injured parties ──
  heading(`Injured parties (${incident.injuredParties.length})`)
  if (incident.injuredParties.length === 0) {
    text("None recorded.", { size: 10, color: [100, 116, 139] })
  } else {
    incident.injuredParties.forEach((p, i) => {
      text(`${i + 1}. ${p.name} — ${INJURED_PARTY_TYPE_LABELS[p.partyType]}`, {
        size: 10,
        bold: true,
      })
      text(
        `Injury: ${p.injuryNature} · Body part: ${p.bodyPartAffected} · Treatment: ${TREATMENT_LABELS[p.treatment]}` +
          (p.hospitalName ? ` · Hospital: ${p.hospitalName}` : "") +
          (p.lostTime ? ` · Lost time: ${p.lostTimeDays ?? "yes"} day(s)` : ""),
        { size: 9, color: [71, 85, 105], gap: 6 }
      )
    })
  }

  // ── Witnesses ──
  heading(`Witnesses (${incident.witnesses.length})`)
  if (incident.witnesses.length === 0) {
    text("None recorded.", { size: 10, color: [100, 116, 139] })
  } else {
    incident.witnesses.forEach((w, i) => {
      text(`${i + 1}. ${w.name} — ${w.roleOrRelation} (${formatDate(w.statementDate)})`, {
        size: 10,
        bold: true,
      })
      text(w.statement, { size: 9, color: [71, 85, 105], gap: 6 })
    })
  }

  // ── Follow-up actions ──
  heading(`Follow-up actions (${incident.followUpActions.length})`)
  if (incident.followUpActions.length === 0) {
    text("None assigned.", { size: 10, color: [100, 116, 139] })
  } else {
    incident.followUpActions.forEach((a, i) => {
      text(`${i + 1}. ${a.description}`, { size: 10, bold: true })
      text(
        `Assigned to: ${a.assignedTo} · Due: ${formatDate(a.dueDate)} · Status: ${ACTION_STATUS_LABELS[a.status]}` +
          (a.completedAt ? ` · Completed: ${formatDate(a.completedAt)}` : ""),
        { size: 9, color: [71, 85, 105], gap: 6 }
      )
    })
  }

  // ── RIDDOR / HSA ──
  if (incident.riddorFlag) {
    const flag = incident.riddorFlag
    heading("RIDDOR / HSA notification")
    field("Authority", AUTHORITY_FULL_LABELS[flag.authority])
    field("Classification", flag.classification)
    field("Reporting deadline", formatDate(flag.reportingDeadline))
    field("Status", RIDDOR_STATUS_LABELS[flag.status])
    if (flag.status === "REPORTED") {
      field("Reported on", formatDate(flag.reportedAt))
      field("Reference number", flag.referenceNumber ?? "—")
      field("Reported by", flag.reportedBy ?? "—")
      field("Method", flag.method ?? "—")
    }
    if (flag.notes?.trim()) field("Notes", flag.notes)
  }

  if (incident.status === "CLOSED") {
    heading("Closure")
    field("Closed on", formatDate(incident.closedAt))
    field("Closed by", incident.closedBy ?? "—")
    field("Closure notes", incident.closureNotes ?? "—")
  }

  doc.save(`${incident.reference}.pdf`)
}
