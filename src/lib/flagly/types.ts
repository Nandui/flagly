import type {
  ActionStatus,
  Center,
  FollowUpAction,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  InjuredParty,
  ReportingAuthority,
  RiddorFlag,
  RiddorStatus,
  Witness,
} from "@prisma/client"

// ─── Server Action result ──────────────────────────────────────────────────────

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

// ─── Incident list (table rows, dashboard panels) ───────────────────────────────

export type IncidentListItem = {
  id: string
  reference: string
  type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  location: string
  locationDetail: string | null
  occurredAt: Date
  reportedBy: string
  riddorRequired: boolean
  centerId: string
  centerName: string
  centerSiteCode: string | null
  injuredCount: number
  witnessCount: number
  openActionCount: number
  totalActionCount: number
  riddorStatus: RiddorStatus | null
}

// ─── Incident detail (full record + relations) ───────────────────────────────────

export type IncidentDetail = Incident & {
  center: Center
  witnesses: Witness[]
  injuredParties: InjuredParty[]
  followUpActions: FollowUpAction[]
  riddorFlag: RiddorFlag | null
}

// ─── Cross-incident follow-up action row ─────────────────────────────────────────

export type ActionListItem = {
  id: string
  description: string
  assignedTo: string
  dueDate: Date
  status: ActionStatus
  completedAt: Date | null
  completedBy: string | null
  notes: string
  incident: {
    id: string
    reference: string
    location: string
    centerId: string
    centerName: string
  }
}

// ─── RIDDOR / HSA tracker row ─────────────────────────────────────────────────────

export type RiddorListItem = {
  id: string
  authority: ReportingAuthority
  classification: string
  reportingDeadline: Date
  status: RiddorStatus
  reportedAt: Date | null
  referenceNumber: string | null
  reportedBy: string | null
  method: string | null
  notes: string
  incident: {
    id: string
    reference: string
    location: string
    occurredAt: Date
    type: IncidentType
    centerId: string
    centerName: string
  }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────────

export type Timeframe = "LAST_7_DAYS" | "THIS_MONTH" | "THIS_YEAR" | "ALL_TIME"

export type DashboardStats = {
  incidents: number
  open: number
  overdueActions: number
  riddorPending: number
  reportable: number
  injured: number
}

export type DashboardSparks = {
  incidents: number[]
  reportable: number[]
  injured: number[]
}

export type DashboardAlertFlag = {
  incidentId: string
  reference: string
  reportingDeadline: Date
  status: RiddorStatus
  daysRemaining: number
}

export type ActivityPoint = { month: string; count: number }

export type DistributionItem = { label: string; count: number }
export type TypeDistributionItem = { type: IncidentType; count: number }

export type ReporterRank = {
  name: string
  count: number
  trend: "up" | "down" | "flat"
}

export type AssigneeRank = { name: string; open: number; overdue: number }

export type DashboardData = {
  timeframe: Timeframe
  stats: DashboardStats
  sparks: DashboardSparks
  activity: ActivityPoint[]
  locations: DistributionItem[]
  types: TypeDistributionItem[]
  reporters: ReporterRank[]
  assignees: AssigneeRank[]
  alertFlags: DashboardAlertFlag[]
  hasOverdueFlag: boolean
}
