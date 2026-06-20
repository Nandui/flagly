import { z } from "zod"

import { USER_ROLES } from "@/lib/centrely/roles"

// ─── First-run admin setup ───────────────────────────────────────────────────

export const firstAdminSchema = z.object({
  name: z.string().min(1, "Enter your name").max(200),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
})

// ─── Centre management (admin) ───────────────────────────────────────────────

const siteCodeField = z
  .string()
  .trim()
  .max(4)
  .optional()
  .transform((v) => (v ? v.toUpperCase() : undefined))
  .refine((v) => !v || /^[A-Z]{2,4}$/.test(v), "Site code must be 2–4 letters")

export const createCenterSchema = z.object({
  name: z.string().min(1, "Enter a centre name").max(200),
  siteCode: siteCodeField,
  region: z.enum(["IRELAND", "NORTHERN_IRELAND", "GREAT_BRITAIN"]),
  address: z.string().max(300).optional(),
})

export const updateCenterSchema = createCenterSchema.extend({
  id: z.string().cuid(),
})

// ─── User management (admin) ─────────────────────────────────────────────────

const roleField = z.enum(USER_ROLES)

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(200),
  email: z.string().trim().email("Enter a valid email address").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: roleField,
  // Centres the user belongs to (zero or more).
  centerIds: z.array(z.string().cuid()).default([]),
})

export const updateUserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1, "Enter a name").max(200),
  email: z.string().trim().email("Enter a valid email address").max(200),
  role: roleField,
  centerIds: z.array(z.string().cuid()).default([]),
  // Optional password reset — blank means "leave unchanged".
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .optional()
    .or(z.literal("")),
})

// ─── Area / sub-area management (admin) ──────────────────────────────────────

const areaNameField = z.string().trim().min(1, "Enter a name").max(120)

export const createAreaSchema = z.object({
  centerId: z.string().cuid(),
  name: areaNameField,
})

export const updateAreaSchema = z.object({
  id: z.string().cuid(),
  name: areaNameField,
})

export const createSubAreaSchema = z.object({
  areaId: z.string().cuid(),
  name: areaNameField,
})

export const updateSubAreaSchema = z.object({
  id: z.string().cuid(),
  name: areaNameField,
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
  areaId: z.string().cuid(),
  subAreaId: z.string().cuid().optional(),
  description: z.string().min(10).max(5000),
  immediateAction: z.string().max(2000).optional(),
  // Who the report is attributed to. Defaults server-side to the signed-in
  // user; only admins may set this to another user.
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
  areaId: z.string().cuid(),
  subAreaId: z.string().cuid().optional(),
  description: z.string().min(10).max(5000),
  immediateAction: z.string().max(2000).optional(),
  // Only admins may change the reporter; blank/absent leaves it unchanged.
  reportedById: z.string().cuid().optional(),
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
export type CloseIncidentInput = z.infer<typeof closeIncidentSchema>
