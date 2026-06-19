import type {
  FollowUpInput,
  InjuredPartyInput,
  WitnessInput,
} from "@/lib/flagly/validation"

function nullify(value?: string | null): string | null {
  return value && value.trim() ? value.trim() : null
}

export function mapWitnessCreate(w: WitnessInput) {
  return {
    name: w.name.trim(),
    roleOrRelation: w.roleOrRelation.trim(),
    contactPhone: nullify(w.contactPhone),
    contactEmail: nullify(w.contactEmail),
    statement: w.statement,
    statementDate: new Date(w.statementDate),
  }
}

export function mapInjuredCreate(p: InjuredPartyInput) {
  const hospitalRelevant =
    p.treatment === "HOSPITAL_AE" || p.treatment === "HOSPITAL_ADMITTED"
  return {
    partyType: p.partyType,
    name: p.name.trim(),
    contactPhone: nullify(p.contactPhone),
    contactEmail: nullify(p.contactEmail),
    injuryNature: p.injuryNature.trim(),
    bodyPartAffected: p.bodyPartAffected.trim(),
    treatment: p.treatment,
    hospitalName: hospitalRelevant ? nullify(p.hospitalName) : null,
    gpReferral: p.treatment === "GP_REFERRAL",
    lostTime: p.lostTime,
    lostTimeDays: p.lostTime ? p.lostTimeDays ?? null : null,
  }
}

export function mapFollowUpCreate(a: FollowUpInput) {
  return {
    description: a.description.trim(),
    assignedTo: a.assignedTo.trim(),
    dueDate: new Date(a.dueDate),
  }
}
