"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  UserRound,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import type { IncidentSeverity } from "@prisma/client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field } from "@/components/flagly/shared/Field"
import { SeverityTriageBanner } from "@/components/flagly/incidents/SeverityTriageBanner"
import {
  INCIDENT_TYPE_OPTIONS,
  INJURED_PARTY_TYPE_OPTIONS,
  SEVERITY_DESCRIPTIONS,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  TREATMENT_OPTIONS,
  pluralize,
  severityBorderClass,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/flagly/utils"
import { createIncident, updateIncident } from "@/lib/flagly/actions/incidents"
import type { CenterSummary } from "@/lib/centrely/active-center"
import type { AreaOption, UserOption } from "@/lib/flagly/types"

type InjuredRow = {
  key: string
  partyType: string
  name: string
  contactPhone: string
  contactEmail: string
  injuryNature: string
  bodyPartAffected: string
  treatment: string
  hospitalName: string
  lostTime: boolean
  lostTimeDays: string
}

type WitnessRow = {
  key: string
  name: string
  roleOrRelation: string
  contactPhone: string
  contactEmail: string
  statement: string
  statementDate: string
}

export type IncidentFormInitial = {
  id: string
  centerId: string
  type: string
  severity: IncidentSeverity
  occurredAt: string | Date
  areaId: string | null
  subAreaId: string | null
  description: string
  immediateAction: string | null
  reportedById: string | null
  reportedByName: string
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: number
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 rounded-[var(--radius-card)] border bg-card p-5 shadow-card sm:p-6">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {number}
          </span>
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

// Maps a validation key to the DOM id of its control, so the error summary and
// failed submits can scroll to / focus the offending field.
const ERROR_FIELD_IDS: Record<string, string> = {
  centerId: "centre",
  areaId: "area",
  subAreaId: "subarea",
  occurredAt: "occurredOn",
  description: "description",
  reportedById: "reportedBy",
  type: "type",
}

export function IncidentForm({
  mode,
  centers,
  areas,
  users,
  currentUser,
  isAdmin,
  defaultCenterId,
  initial,
}: {
  mode: "create" | "edit"
  centers: CenterSummary[]
  areas: AreaOption[]
  users: UserOption[]
  currentUser: { id: string; name: string }
  isAdmin: boolean
  defaultCenterId: string | null
  initial?: IncidentFormInitial
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [submittingDraft, setSubmittingDraft] = React.useState(false)

  const initialDate = initial?.occurredAt ?? new Date()

  const [centerId, setCenterId] = React.useState(
    initial?.centerId ?? defaultCenterId ?? centers[0]?.id ?? ""
  )
  const [type, setType] = React.useState(initial?.type ?? "ACCIDENT")
  const [severity, setSeverity] = React.useState<IncidentSeverity>(
    initial?.severity ?? "MINOR"
  )
  const [occurredOn, setOccurredOn] = React.useState(
    toDateInputValue(initialDate)
  )
  const [occurredTime, setOccurredTime] = React.useState(
    toTimeInputValue(initialDate)
  )
  const [areaId, setAreaId] = React.useState(initial?.areaId ?? "")
  const [subAreaId, setSubAreaId] = React.useState(initial?.subAreaId ?? "")
  const [description, setDescription] = React.useState(initial?.description ?? "")
  const [immediateAction, setImmediateAction] = React.useState(
    initial?.immediateAction ?? ""
  )
  // Create defaults to the signed-in user; on edit we preselect the linked user
  // (may be blank for legacy reports — then the recorded name is shown instead).
  const [reportedById, setReportedById] = React.useState(
    initial ? (initial.reportedById ?? "") : currentUser.id
  )
  const reportedByName = initial?.reportedByName ?? currentUser.name

  const [injured, setInjured] = React.useState<InjuredRow[]>([])
  const [witnesses, setWitnesses] = React.useState<WitnessRow[]>([])

  const isEdit = mode === "edit"

  // ── Inline validation ──
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function focusField(key: string) {
    const el = document.getElementById(ERROR_FIELD_IDS[key] ?? key)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      ;(el as HTMLElement).focus?.()
    }
  }

  function validate(asDraft: boolean): Record<string, string> {
    const e: Record<string, string> = {}
    if (!centerId) e.centerId = "Select a centre."
    if (!areaId) e.areaId = "Select an area."
    if (!buildOccurredAt()) e.occurredAt = "Enter a valid date and time."
    if (!asDraft && description.trim().length < 10)
      e.description = "Add a fuller description (at least 10 characters)."
    if (isAdmin && !reportedById) e.reportedById = "Select a reporter."
    return e
  }

  function applyServerErrors(result: {
    error: string
    fieldErrors?: Record<string, string[]>
  }) {
    if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
      const e: Record<string, string> = {}
      for (const [k, msgs] of Object.entries(result.fieldErrors)) {
        if (msgs && msgs.length) e[k] = msgs[0]
      }
      setErrors(e)
      const first = Object.keys(e)[0]
      if (first) focusField(first)
    } else {
      toast.error(result.error)
    }
  }

  // Areas are per-centre; show only those for the selected centre, and the
  // sub-areas of the selected area.
  const centerAreas = React.useMemo(
    () => areas.filter((a) => a.centerId === centerId),
    [areas, centerId]
  )
  const subAreas = React.useMemo(
    () => centerAreas.find((a) => a.id === areaId)?.subAreas ?? [],
    [centerAreas, areaId]
  )

  // Keep the cascading selects consistent when the centre or area changes.
  React.useEffect(() => {
    if (areaId && !centerAreas.some((a) => a.id === areaId)) {
      setAreaId("")
      setSubAreaId("")
    }
  }, [centerAreas, areaId])

  React.useEffect(() => {
    if (subAreaId && !subAreas.some((s) => s.id === subAreaId)) {
      setSubAreaId("")
    }
  }, [subAreas, subAreaId])

  function buildOccurredAt(): string | null {
    if (!occurredOn) return null
    const time = occurredTime || "00:00"
    const d = new Date(`${occurredOn}T${time}:00`)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString()
  }

  function buildCorePayload() {
    return {
      centerId,
      type,
      severity,
      occurredAt: buildOccurredAt() ?? "",
      areaId,
      subAreaId: subAreaId || undefined,
      description,
      immediateAction: immediateAction.trim() || undefined,
      reportedById: reportedById || undefined,
    }
  }

  function buildRelations() {
    return {
      injuredParties: injured.map((p) => ({
        partyType: p.partyType,
        name: p.name.trim(),
        contactPhone: p.contactPhone.trim() || undefined,
        contactEmail: p.contactEmail.trim() || undefined,
        injuryNature: p.injuryNature.trim(),
        bodyPartAffected: p.bodyPartAffected.trim(),
        treatment: p.treatment,
        hospitalName: p.hospitalName.trim() || undefined,
        lostTime: p.lostTime,
        lostTimeDays:
          p.lostTime && p.lostTimeDays ? Number(p.lostTimeDays) : undefined,
      })),
      witnesses: witnesses.map((w) => ({
        name: w.name.trim(),
        roleOrRelation: w.roleOrRelation.trim(),
        contactPhone: w.contactPhone.trim() || undefined,
        contactEmail: w.contactEmail.trim() || undefined,
        statement: w.statement,
        statementDate: w.statementDate,
      })),
    }
  }

  function handleCreate(asDraft: boolean) {
    const e = validate(asDraft)
    setErrors(e)
    if (Object.keys(e).length > 0) {
      focusField(Object.keys(e)[0])
      return
    }
    setSubmittingDraft(asDraft)
    startTransition(async () => {
      const result = await createIncident({
        ...buildCorePayload(),
        ...buildRelations(),
        asDraft,
      })
      if (result.ok) {
        toast.success(asDraft ? "Draft saved." : "Incident report submitted.")
        router.push(`/flagly/incidents/${result.data.id}`)
      } else {
        applyServerErrors(result)
      }
    })
  }

  function handleUpdate() {
    if (!initial) return
    const e = validate(false)
    setErrors(e)
    if (Object.keys(e).length > 0) {
      focusField(Object.keys(e)[0])
      return
    }
    startTransition(async () => {
      const result = await updateIncident({ id: initial.id, ...buildCorePayload() })
      if (result.ok) {
        toast.success("Incident updated.")
        router.push(`/flagly/incidents/${initial.id}`)
      } else {
        applyServerErrors(result)
      }
    })
  }

  return (
    <div
      data-incident-form
      className="mx-auto w-full max-w-[760px] space-y-5 pb-28 sm:pb-6"
    >
      {/* Error summary */}
      {Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-severity-critical-line bg-severity-critical-bg p-4 text-sm text-severity-critical"
        >
          <p className="font-semibold">
            Please fix {Object.keys(errors).length}{" "}
            {pluralize(Object.keys(errors).length, "issue")} before submitting:
          </p>
          <ul className="mt-1.5 space-y-1">
            {Object.entries(errors).map(([k, m]) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => focusField(k)}
                  className="text-left underline underline-offset-2 hover:opacity-80"
                >
                  {m}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Section 1 — Incident Details */}
      <Section number={1} title="Incident details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Centre"
            htmlFor="centre"
            required
            className="sm:col-span-2"
            error={errors.centerId}
          >
            <Select
              value={centerId}
              onValueChange={(v) => {
                setCenterId(v)
                clearError("centerId")
              }}
            >
              <SelectTrigger id="centre" aria-invalid={!!errors.centerId}>
                <SelectValue placeholder="Select centre" />
              </SelectTrigger>
              <SelectContent>
                {centers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.siteCode ? ` (${c.siteCode})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Type" htmlFor="type" required className="sm:col-span-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Occurred on"
            htmlFor="occurredOn"
            required
            error={errors.occurredAt}
          >
            <Input
              id="occurredOn"
              type="date"
              aria-invalid={!!errors.occurredAt}
              value={occurredOn}
              onChange={(e) => {
                setOccurredOn(e.target.value)
                clearError("occurredAt")
              }}
            />
          </Field>
          <Field label="Occurred at" htmlFor="occurredTime" required>
            <Input
              id="occurredTime"
              type="time"
              aria-invalid={!!errors.occurredAt}
              value={occurredTime}
              onChange={(e) => {
                setOccurredTime(e.target.value)
                clearError("occurredAt")
              }}
            />
          </Field>

          <Field
            label="Area"
            htmlFor="area"
            required
            error={errors.areaId}
            hint={
              centerId && centerAreas.length === 0
                ? "No areas defined for this centre yet — add them under Admin → Areas."
                : undefined
            }
          >
            <Select
              value={areaId}
              onValueChange={(v) => {
                setAreaId(v)
                setSubAreaId("")
                clearError("areaId")
              }}
              disabled={!centerId || centerAreas.length === 0}
            >
              <SelectTrigger id="area" aria-invalid={!!errors.areaId}>
                <SelectValue
                  placeholder={
                    centerAreas.length === 0 ? "No areas available" : "Select area"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {centerAreas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sub-area" htmlFor="subarea" hint="Optional">
            <Select
              value={subAreaId}
              onValueChange={setSubAreaId}
              disabled={!areaId || subAreas.length === 0}
            >
              <SelectTrigger id="subarea">
                <SelectValue
                  placeholder={
                    !areaId
                      ? "Select an area first"
                      : subAreas.length === 0
                        ? "No sub-areas"
                        : "Select sub-area"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subAreas.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Section 2 — Description */}
      <Section number={2} title="Description">
        <Field
          label="What happened?"
          htmlFor="description"
          required
          error={errors.description}
        >
          <Textarea
            id="description"
            rows={5}
            maxLength={5000}
            aria-invalid={!!errors.description}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              clearError("description")
            }}
            placeholder="Describe the incident in full. Include what happened, in what sequence, and any relevant conditions."
          />
        </Field>
        <Field label="Immediate action taken" htmlFor="immediateAction">
          <Textarea
            id="immediateAction"
            rows={3}
            maxLength={2000}
            value={immediateAction}
            onChange={(e) => setImmediateAction(e.target.value)}
            placeholder="What was done at the time? First aid given, emergency services called, area cordoned, etc."
          />
        </Field>
      </Section>

      {/* Section 3 — Severity */}
      <Section number={3} title="Severity">
        <RadioGroup
          value={severity}
          onValueChange={(v) => setSeverity(v as IncidentSeverity)}
          className="gap-3"
        >
          {SEVERITY_ORDER.map((value) => (
            <label
              key={value}
              htmlFor={`sev-${value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-l-4 bg-background p-3 transition-colors hover:bg-accent/40",
                severityBorderClass(value),
                severity === value && "ring-2 ring-ring"
              )}
            >
              <RadioGroupItem id={`sev-${value}`} value={value} className="mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{SEVERITY_LABELS[value]}</p>
                <p className="text-xs text-muted-foreground">
                  {SEVERITY_DESCRIPTIONS[value]}
                </p>
              </div>
            </label>
          ))}
        </RadioGroup>

        <Collapsible>
          <CollapsibleTrigger className="group flex items-center gap-1.5 text-sm font-medium text-primary">
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            What counts as Reportable?
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            <p>
              Mark an incident{" "}
              <span className="font-medium text-foreground">Reportable</span> when it
              is serious enough to need escalation beyond the centre — for example a
              major or lost-time injury, or a dangerous occurrence — so management
              can review it and arrange any external notification.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <SeverityTriageBanner severity={severity} />
      </Section>

      {/* Section 4 — People involved (capture at report time; also editable later) */}
      {!isEdit ? (
        <>
          <Section
            number={4}
            title="People involved"
            description="Optional — injured parties and witnesses can also be added later during the investigation."
          >
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <UserRound className="size-4 text-muted-foreground" />
                    Injured parties
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      setInjured((rows) => [
                        ...rows,
                        {
                          key: uid(),
                          partyType: "MEMBER",
                          name: "",
                          contactPhone: "",
                          contactEmail: "",
                          injuryNature: "",
                          bodyPartAffected: "",
                          treatment: "FIRST_AID_ONLY",
                          hospitalName: "",
                          lostTime: false,
                          lostTimeDays: "",
                        },
                      ])
                    }
                  >
                    <Plus /> Add injured party
                  </Button>
                </div>

                {injured.map((row, index) => {
                  const showHospital =
                    row.treatment === "HOSPITAL_AE" ||
                    row.treatment === "HOSPITAL_ADMITTED"
                  return (
                    <div
                      key={row.key}
                      className="space-y-3 rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Injured party {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove injured party"
                          onClick={() =>
                            setInjured((rows) =>
                              rows.filter((r) => r.key !== row.key)
                            )
                          }
                        >
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Party type" required>
                          <Select
                            value={row.partyType}
                            onValueChange={(v) =>
                              setInjured((rows) =>
                                rows.map((r) =>
                                  r.key === row.key ? { ...r, partyType: v } : r
                                )
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INJURED_PARTY_TYPE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Name" required>
                          <Input
                            value={row.name}
                            onChange={(e) =>
                              setInjured((rows) =>
                                rows.map((r) =>
                                  r.key === row.key
                                    ? { ...r, name: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Field>
                        <Field label="Contact phone">
                          <Input
                            value={row.contactPhone}
                            onChange={(e) =>
                              setInjured((rows) =>
                                rows.map((r) =>
                                  r.key === row.key
                                    ? { ...r, contactPhone: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Field>
                        <Field label="Contact email">
                          <Input
                            type="email"
                            value={row.contactEmail}
                            onChange={(e) =>
                              setInjured((rows) =>
                                rows.map((r) =>
                                  r.key === row.key
                                    ? { ...r, contactEmail: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Field>
                        <Field label="Nature of injury" required>
                          <Input
                            value={row.injuryNature}
                            placeholder="e.g. Suspected fractured wrist"
                            onChange={(e) =>
                              setInjured((rows) =>
                                rows.map((r) =>
                                  r.key === row.key
                                    ? { ...r, injuryNature: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Field>
                        <Field label="Body part affected" required>
                          <Input
                            value={row.bodyPartAffected}
                            onChange={(e) =>
                              setInjured((rows) =>
                                rows.map((r) =>
                                  r.key === row.key
                                    ? { ...r, bodyPartAffected: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Field>
                        <Field label="Treatment given" required>
                          <Select
                            value={row.treatment}
                            onValueChange={(v) =>
                              setInjured((rows) =>
                                rows.map((r) =>
                                  r.key === row.key ? { ...r, treatment: v } : r
                                )
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TREATMENT_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        {showHospital ? (
                          <Field label="Hospital name">
                            <Input
                              value={row.hospitalName}
                              onChange={(e) =>
                                setInjured((rows) =>
                                  rows.map((r) =>
                                    r.key === row.key
                                      ? { ...r, hospitalName: e.target.value }
                                      : r
                                  )
                                )
                              }
                            />
                          </Field>
                        ) : null}
                        <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 sm:col-span-2">
                          <span className="text-sm font-medium">Lost time?</span>
                          <Switch
                            checked={row.lostTime}
                            onCheckedChange={(checked) =>
                              setInjured((rows) =>
                                rows.map((r) =>
                                  r.key === row.key
                                    ? { ...r, lostTime: checked }
                                    : r
                                )
                              )
                            }
                          />
                        </div>
                        {row.lostTime ? (
                          <Field label="Days lost">
                            <Input
                              type="number"
                              min={1}
                              value={row.lostTimeDays}
                              onChange={(e) =>
                                setInjured((rows) =>
                                  rows.map((r) =>
                                    r.key === row.key
                                      ? { ...r, lostTimeDays: e.target.value }
                                      : r
                                  )
                                )
                              }
                            />
                          </Field>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4 text-muted-foreground" />
                    Witnesses
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      setWitnesses((rows) => [
                        ...rows,
                        {
                          key: uid(),
                          name: "",
                          roleOrRelation: "",
                          contactPhone: "",
                          contactEmail: "",
                          statement: "",
                          statementDate: toDateInputValue(new Date()),
                        },
                      ])
                    }
                  >
                    <Plus /> Add witness
                  </Button>
                </div>

                {witnesses.map((row, index) => (
                  <div
                    key={row.key}
                    className="space-y-3 rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Witness {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove witness"
                        onClick={() =>
                          setWitnesses((rows) =>
                            rows.filter((r) => r.key !== row.key)
                          )
                        }
                      >
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Name" required>
                        <Input
                          value={row.name}
                          onChange={(e) =>
                            setWitnesses((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, name: e.target.value }
                                  : r
                              )
                            )
                          }
                        />
                      </Field>
                      <Field label="Role / relationship" required>
                        <Input
                          value={row.roleOrRelation}
                          placeholder="e.g. Lifeguard on duty"
                          onChange={(e) =>
                            setWitnesses((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, roleOrRelation: e.target.value }
                                  : r
                              )
                            )
                          }
                        />
                      </Field>
                      <Field label="Contact phone">
                        <Input
                          value={row.contactPhone}
                          onChange={(e) =>
                            setWitnesses((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, contactPhone: e.target.value }
                                  : r
                              )
                            )
                          }
                        />
                      </Field>
                      <Field label="Contact email">
                        <Input
                          type="email"
                          value={row.contactEmail}
                          onChange={(e) =>
                            setWitnesses((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, contactEmail: e.target.value }
                                  : r
                              )
                            )
                          }
                        />
                      </Field>
                      <Field label="Statement" required className="sm:col-span-2">
                        <Textarea
                          rows={3}
                          value={row.statement}
                          onChange={(e) =>
                            setWitnesses((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, statement: e.target.value }
                                  : r
                              )
                            )
                          }
                        />
                      </Field>
                      <Field label="Statement date" required>
                        <Input
                          type="date"
                          value={row.statementDate}
                          onChange={(e) =>
                            setWitnesses((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, statementDate: e.target.value }
                                  : r
                              )
                            )
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </>
      ) : null}

      {/* Reported by — last section (4 in edit mode, 5 on create) */}
      <Section number={isEdit ? 4 : 5} title="Reported by">
        {isAdmin ? (
          <Field
            label="Reporter"
            htmlFor="reportedBy"
            required
            error={errors.reportedById}
            hint={
              initial && !initial.reportedById
                ? `Currently recorded as “${reportedByName}”. Choose a user to attribute this report.`
                : "Defaults to you. As an admin you can attribute this report to another user."
            }
          >
            <Select
              value={reportedById}
              onValueChange={(v) => {
                setReportedById(v)
                clearError("reportedById")
              }}
            >
              <SelectTrigger id="reportedBy" aria-invalid={!!errors.reportedById}>
                <SelectValue placeholder="Select reporter" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.id === currentUser.id ? " (you)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <Field label="Reporter" hint="Reports are filed under your name.">
            <Input value={reportedByName} disabled />
          </Field>
        )}
      </Section>

      {/* Action bar */}
      {isEdit ? (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push(`/flagly/incidents/${initial?.id}`)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleUpdate} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(17,24,39,0.05)] backdrop-blur sm:static sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
          <Button
            variant="outline"
            type="button"
            className="h-11 flex-1 sm:h-9 sm:flex-none"
            onClick={() => handleCreate(true)}
            disabled={pending}
          >
            {pending && submittingDraft ? <Loader2 className="animate-spin" /> : null}
            Save as draft
          </Button>
          <Button
            type="button"
            className="h-11 flex-1 sm:h-9 sm:flex-none"
            onClick={() => handleCreate(false)}
            disabled={pending}
          >
            {pending && !submittingDraft ? (
              <Loader2 className="animate-spin" />
            ) : null}
            Submit report
          </Button>
        </div>
      )}
    </div>
  )
}
