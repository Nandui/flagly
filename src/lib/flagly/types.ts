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

export type DashboardStats = {
  incidentsThisMonth: number
  openIncidents: number
  riddorPending: number
  overdueActions: number
}

export type DashboardAlertFlag = {
  incidentId: string
  reference: string
  reportingDeadline: Date
  status: RiddorStatus
  daysRemaining: number
}

export type TrendBucket = {
  month: string
  ACCIDENT: number
  NEAR_MISS: number
  PROPERTY_DAMAGE: number
  VIOLENCE_AGGRESSION: number
  HAZARDOUS_SUBSTANCE: number
  FIRE_OR_EVACUATION: number
  OTHER: number
}

export type DashboardData = {
  stats: DashboardStats
  alertFlags: DashboardAlertFlag[]
  hasOverdueFlag: boolean
  activeIncidents: IncidentListItem[]
  overdueActions: ActionListItem[]
  trend: TrendBucket[]
}
