import { addBusinessDays, addDays } from "date-fns"

export type ReportingAuthorityId = "HSA_IRELAND" | "HSENI" | "HSE_UK"

export type DeadlineRule = {
  authority: ReportingAuthorityId
  classification: string
  deadlineDays: number
  businessDays: boolean
  notes: string
}

// Republic of Ireland — HSA, via BeSafe portal (hsa.ie/besafe)
export const HSA_IRELAND_RULES: DeadlineRule[] = [
  {
    authority: "HSA_IRELAND",
    classification: "Fatal accident",
    deadlineDays: 7,
    businessDays: false,
    notes: "Notify HSA immediately by phone, then submit BeSafe report within 7 days.",
  },
  {
    authority: "HSA_IRELAND",
    classification: "Dangerous occurrence",
    deadlineDays: 7,
    businessDays: false,
    notes: "Submit BeSafe report within 7 days of the occurrence.",
  },
  {
    authority: "HSA_IRELAND",
    classification: "Over-3-day injury",
    deadlineDays: 30,
    businessDays: true,
    notes:
      "Injury causing absence from normal work for more than 3 consecutive days. Submit within 30 working days.",
  },
]

// Northern Ireland / Great Britain — RIDDOR
export const RIDDOR_RULES: DeadlineRule[] = [
  {
    authority: "HSENI",
    classification: "Fatality",
    deadlineDays: 10,
    businessDays: false,
    notes: "Notify HSENI immediately, then submit F2508 within 10 days.",
  },
  {
    authority: "HSENI",
    classification: "Specified injury",
    deadlineDays: 10,
    businessDays: false,
    notes:
      "Fractures (except fingers/toes/thumbs), amputations, loss of sight, crush injuries, scalping, chemical/hot metal burns to eye, injuries requiring resuscitation or 24h+ hospitalisation.",
  },
  {
    authority: "HSENI",
    classification: "Over-7-day injury",
    deadlineDays: 15,
    businessDays: false,
    notes:
      "Absence from normal duties for more than 7 consecutive days (not counting day of accident). Submit within 15 days.",
  },
  {
    authority: "HSENI",
    classification: "Dangerous occurrence",
    deadlineDays: 10,
    businessDays: false,
    notes: "Submit within 10 days.",
  },
]

// HSE UK (Great Britain) uses the same RIDDOR rules as HSENI. The deadlines and
// classifications are identical; only the reporting authority/portal differs.
export const HSE_UK_RULES: DeadlineRule[] = RIDDOR_RULES.map((rule) => ({
  ...rule,
  authority: "HSE_UK",
}))

export function rulesForAuthority(authority: ReportingAuthorityId): DeadlineRule[] {
  switch (authority) {
    case "HSA_IRELAND":
      return HSA_IRELAND_RULES
    case "HSENI":
      return RIDDOR_RULES
    case "HSE_UK":
      return HSE_UK_RULES
  }
}

export function findRule(
  authority: ReportingAuthorityId,
  classification: string
): DeadlineRule | undefined {
  return rulesForAuthority(authority).find(
    (rule) => rule.classification === classification
  )
}

export function computeDeadline(occurredAt: Date, rule: DeadlineRule): Date {
  return rule.businessDays
    ? addBusinessDays(occurredAt, rule.deadlineDays)
    : addDays(occurredAt, rule.deadlineDays)
}
