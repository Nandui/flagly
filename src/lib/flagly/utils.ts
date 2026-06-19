import { differenceInCalendarDays, format } from "date-fns"
import type {
  ActionStatus,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  InjuredPartyType,
  Region,
  ReportingAuthority,
  RiddorStatus,
  TreatmentGiven,
} from "@prisma/client"

// ─── Enum labels ──────────────────────────────────────────────────────────────

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  ACCIDENT: "Accident",
  NEAR_MISS: "Near miss",
  PROPERTY_DAMAGE: "Property damage",
  VIOLENCE_AGGRESSION: "Violence / aggression",
  HAZARDOUS_SUBSTANCE: "Hazardous substance",
  FIRE_OR_EVACUATION: "Fire / evacuation",
  OTHER: "Other",
}

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  UNDER_INVESTIGATION: "Under investigation",
  CLOSED: "Closed",
}

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  MINOR: "Minor",
  SIGNIFICANT: "Significant",
  REPORTABLE: "Reportable",
  CRITICAL: "Critical",
}

export const SEVERITY_DESCRIPTIONS: Record<IncidentSeverity, string> = {
  MINOR: "First aid only. No lost time. No further medical treatment required.",
  SIGNIFICANT:
    "Medical treatment required or possible. Lost time likely. Hospital or GP visit.",
  REPORTABLE: "Meets HSA / RIDDOR reporting threshold (see criteria below).",
  CRITICAL: "Fatality or life-threatening injury.",
}

export const INJURED_PARTY_TYPE_LABELS: Record<InjuredPartyType, string> = {
  STAFF: "Staff",
  MEMBER: "Member",
  CONTRACTOR: "Contractor",
  VISITOR: "Visitor",
  PUBLIC: "Public",
}

export const TREATMENT_LABELS: Record<TreatmentGiven, string> = {
  NONE: "None",
  FIRST_AID_ONLY: "First aid only",
  GP_REFERRAL: "GP referral",
  HOSPITAL_AE: "Hospital A&E",
  HOSPITAL_ADMITTED: "Hospital (admitted)",
}

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  COMPLETE: "Complete",
  OVERDUE: "Overdue",
}

export const AUTHORITY_LABELS: Record<ReportingAuthority, string> = {
  HSA_IRELAND: "HSA Ireland",
  HSENI: "HSENI (NI)",
  HSE_UK: "HSE UK",
}

export const AUTHORITY_FULL_LABELS: Record<ReportingAuthority, string> = {
  HSA_IRELAND: "HSA Ireland (BeSafe Portal)",
  HSENI: "HSENI — Health & Safety Executive NI",
  HSE_UK: "HSE — Health & Safety Executive (GB)",
}

export const RIDDOR_STATUS_LABELS: Record<RiddorStatus, string> = {
  PENDING: "Pending",
  REPORTED: "Reported",
  OVERDUE: "Overdue",
}

export const REGION_LABELS: Record<Region, string> = {
  IRELAND: "Republic of Ireland",
  NORTHERN_IRELAND: "Northern Ireland",
  GREAT_BRITAIN: "Great Britain",
}

// Option arrays for <Select> controls.
export function toOptions<T extends string>(
  labels: Record<T, string>
): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
  }))
}

export const INCIDENT_TYPE_OPTIONS = toOptions(INCIDENT_TYPE_LABELS)
export const INJURED_PARTY_TYPE_OPTIONS = toOptions(INJURED_PARTY_TYPE_LABELS)
export const TREATMENT_OPTIONS = toOptions(TREATMENT_LABELS)
export const AUTHORITY_OPTIONS = toOptions(AUTHORITY_LABELS)
export const REGION_OPTIONS = toOptions(REGION_LABELS)

export const SEVERITY_ORDER: IncidentSeverity[] = [
  "MINOR",
  "SIGNIFICANT",
  "REPORTABLE",
  "CRITICAL",
]

// ─── Badge colour classes (driven by globals.css tokens) ────────────────────────

export function severityBadgeClass(severity: IncidentSeverity): string {
  switch (severity) {
    case "MINOR":
      return "bg-severity-minor-bg text-severity-minor"
    case "SIGNIFICANT":
      return "bg-severity-significant-bg text-severity-significant"
    case "REPORTABLE":
      return "bg-severity-reportable-bg text-severity-reportable"
    case "CRITICAL":
      return "bg-severity-critical-bg text-severity-critical"
  }
}

export function severityBorderClass(severity: IncidentSeverity): string {
  switch (severity) {
    case "MINOR":
      return "border-l-severity-minor"
    case "SIGNIFICANT":
      return "border-l-severity-significant"
    case "REPORTABLE":
      return "border-l-severity-reportable"
    case "CRITICAL":
      return "border-l-severity-critical"
  }
}

export function statusBadgeClass(status: IncidentStatus): string {
  switch (status) {
    case "DRAFT":
      return "bg-status-draft-bg text-status-draft"
    case "OPEN":
      return "bg-status-open-bg text-status-open"
    case "UNDER_INVESTIGATION":
      return "bg-status-investigating-bg text-status-investigating"
    case "CLOSED":
      return "bg-status-closed-bg text-status-closed"
  }
}

export function actionStatusBadgeClass(status: ActionStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-status-open-bg text-status-open"
    case "IN_PROGRESS":
      return "bg-status-investigating-bg text-status-investigating"
    case "COMPLETE":
      return "bg-status-closed-bg text-status-closed"
    case "OVERDUE":
      return "bg-severity-critical-bg text-severity-critical"
  }
}

export function riddorStatusBadgeClass(status: RiddorStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-status-investigating-bg text-status-investigating"
    case "REPORTED":
      return "bg-status-closed-bg text-status-closed"
    case "OVERDUE":
      return "bg-severity-critical-bg text-severity-critical"
  }
}

// ─── Date formatting ────────────────────────────────────────────────────────────

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

/** "15 Jan 2025" */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—"
  return format(asDate(value), "d MMM yyyy")
}

/** "15 Jan 2025, 14:23" */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—"
  return format(asDate(value), "d MMM yyyy, HH:mm")
}

/** "14:23" */
export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "—"
  return format(asDate(value), "HH:mm")
}

/** "yyyy-MM-dd" for <input type="date"> */
export function toDateInputValue(value: Date | string): string {
  return format(asDate(value), "yyyy-MM-dd")
}

/** "HH:mm" for <input type="time"> */
export function toTimeInputValue(value: Date | string): string {
  return format(asDate(value), "HH:mm")
}

// ─── Day-difference helpers ─────────────────────────────────────────────────────

/** Positive = days remaining, negative = days overdue, 0 = due today. */
export function daysUntil(value: Date | string): number {
  return differenceInCalendarDays(asDate(value), new Date())
}

/** Whole days since the given date (>= 0 for past dates). */
export function daysSince(value: Date | string): number {
  return Math.max(0, differenceInCalendarDays(new Date(), asDate(value)))
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}
