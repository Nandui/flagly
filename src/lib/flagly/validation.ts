import { z } from "zod"

// ─── First-run admin setup ───────────────────────────────────────────────────

export const firstAdminSchema = z.object({
  name: z.string().min(1, "Enter your name").max(200),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
})

// ─── Shared item schemas (used both nested-at-create and standalone-add) ─────────

const witnessBase = z.object({
  name: z.string().min(1).max(200),
  roleOrRelation: z.string().min(1).max(200),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  statement: z.string().min(1).max(5000),
  statementDate: z.string().date(),
})

const injuredPartyBase = z.object({
  partyType: z.enum(["STAFF", "MEMBER", "CONTRACTOR", "VISITOR", "PUBLIC"]),
  name: z.string().min(1).max(200),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  injuryNature: z.string().min(1).max(500),
  bodyPartAffected: z.string().min(1).max(200),
  treatment: z.enum([
    "NONE",
    "FIRST_AID_ONLY",
    "GP_REFERRAL",
    "HOSPITAL_AE",
    "HOSPITAL_ADMITTED",
  ]),
  hospitalName: z.string().max(200).optional(),
  lostTime: z.boolean().default(false),
  lostTimeDays: z.number().int().min(1).optional(),
})

const followUpBase = z.object({
  description: z.string().min(1).max(1000),
  assignedTo: z.string().min(1).max(200),
  dueDate: z.string().date(),
})

// ─── Incident ──────────────────────────────────────────────────────────────────

export const createIncidentSchema = z.object({
  centerId: z.string().cuid(),
  type: z.enum([
    "ACCIDENT",
    "NEAR_MISS",
    "PROPERTY_DAMAGE",
    "VIOLENCE_AGGRESSION",
    "HAZARDOUS_SUBSTANCE",
    "FIRE_OR_EVACUATION",
    "OTHER",
  ]),
  severity: z.enum(["MINOR", "SIGNIFICANT", "REPORTABLE", "CRITICAL"]),
  occurredAt: z.string().datetime(),
  location: z.string().min(1).max(200),
  locationDetail: z.string().max(500).optional(),
  description: z.string().min(10).max(5000),
  immediateAction: z.string().max(2000).optional(),
  reportedBy: z.string().min(1).max(200),
  reportedById: z.string().cuid().optional(),
  asDraft: z.boolean().default(false),
})

// Drafts only require the Section-1 essentials; description can be short/empty.
export const draftIncidentSchema = createIncidentSchema.extend({
  description: z.string().max(5000).optional().default(""),
  asDraft: z.literal(true),
})

// Full payload submitted by the Report New Incident form, including the optional
// nested People Involved / Follow-up Actions sections.
export const createIncidentFullSchema = createIncidentSchema.extend({
  witnesses: z.array(witnessBase).default([]),
  injuredParties: z.array(injuredPartyBase).default([]),
  followUpActions: z.array(followUpBase).default([]),
})

// Draft save: only the Section-1 essentials are enforced; the narrative can be
// short or empty (spec §13 "no validation beyond required fields in Section 1").
export const createIncidentDraftSchema = createIncidentFullSchema.extend({
  description: z.string().max(5000).optional().default(""),
})

export const updateIncidentSchema = z.object({
  id: z.string().cuid(),
  centerId: z.string().cuid(),
  type: z.enum([
    "ACCIDENT",
    "NEAR_MISS",
    "PROPERTY_DAMAGE",
    "VIOLENCE_AGGRESSION",
    "HAZARDOUS_SUBSTANCE",
    "FIRE_OR_EVACUATION",
    "OTHER",
  ]),
  severity: z.enum(["MINOR", "SIGNIFICANT", "REPORTABLE", "CRITICAL"]),
  occurredAt: z.string().datetime(),
  location: z.string().min(1).max(200),
  locationDetail: z.string().max(500).optional(),
  description: z.string().min(10).max(5000),
  immediateAction: z.string().max(2000).optional(),
  reportedBy: z.string().min(1).max(200),
})

export const submitDraftSchema = z.object({
  incidentId: z.string().cuid(),
})

// ─── Witness ─────────────────────────────────────────────────────────────────

export const addWitnessSchema = witnessBase.extend({
  incidentId: z.string().cuid(),
})

export const updateWitnessSchema = witnessBase.extend({
  id: z.string().cuid(),
})

// ─── Injured party ─────────────────────────────────────────────────────────────

export const addInjuredPartySchema = injuredPartyBase.extend({
  incidentId: z.string().cuid(),
})

export const updateInjuredPartySchema = injuredPartyBase.extend({
  id: z.string().cuid(),
})

// ─── Follow-up action ────────────────────────────────────────────────────────

export const addFollowUpActionSchema = followUpBase.extend({
  incidentId: z.string().cuid(),
})

export const updateFollowUpActionSchema = followUpBase.extend({
  id: z.string().cuid(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETE", "OVERDUE"]),
})

export const setActionStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETE", "OVERDUE"]),
  completedBy: z.string().max(200).optional(),
})

// ─── RIDDOR / HSA ──────────────────────────────────────────────────────────────

export const createRiddorFlagSchema = z.object({
  incidentId: z.string().cuid(),
  authority: z.enum(["HSA_IRELAND", "HSENI", "HSE_UK"]),
  classification: z.string().min(1).max(200),
  reportingDeadline: z.string().datetime(),
  notes: z.string().max(2000).default(""),
})

export const markReportedSchema = z.object({
  riddorFlagId: z.string().cuid(),
  reportedAt: z.string().date(),
  referenceNumber: z.string().max(100).optional(),
  reportedBy: z.string().min(1).max(200),
  method: z.string().min(1).max(200),
  notes: z.string().max(2000).default(""),
})

// ─── Close incident ────────────────────────────────────────────────────────────

export const closeIncidentSchema = z.object({
  incidentId: z.string().cuid(),
  closureNotes: z.string().min(1).max(2000),
})

// ─── Inferred types ────────────────────────────────────────────────────────────

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>
export type CreateIncidentFullInput = z.infer<typeof createIncidentFullSchema>
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>
export type WitnessInput = z.infer<typeof witnessBase>
export type InjuredPartyInput = z.infer<typeof injuredPartyBase>
export type FollowUpInput = z.infer<typeof followUpBase>
export type AddWitnessInput = z.infer<typeof addWitnessSchema>
export type AddInjuredPartyInput = z.infer<typeof addInjuredPartySchema>
export type AddFollowUpActionInput = z.infer<typeof addFollowUpActionSchema>
export type CreateRiddorFlagInput = z.infer<typeof createRiddorFlagSchema>
export type MarkReportedInput = z.infer<typeof markReportedSchema>
export type CloseIncidentInput = z.infer<typeof closeIncidentSchema>
