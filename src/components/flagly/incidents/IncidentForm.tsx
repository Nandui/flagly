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
  severityBorderClass,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/flagly/utils"
import { createIncident, updateIncident } from "@/lib/flagly/actions/incidents"
import type { CenterSummary } from "@/lib/centrely/active-center"

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

type ActionRow = {
  key: string
  description: string
  assignedTo: string
  dueDate: string
}

export type IncidentFormInitial = {
  id: string
  centerId: string
  type: string
  severity: IncidentSeverity
  occurredAt: string | Date
  location: string
  locationDetail: string | null
  description: string
  immediateAction: string | null
  reportedBy: string
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
    <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
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

export function IncidentForm({
  mode,
  centers,
  defaultCenterId,
  defaultReportedBy,
  initial,
}: {
  mode: "create" | "edit"
  centers: CenterSummary[]
  defaultCenterId: string | null
  defaultReportedBy: string
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
  const [location, setLocation] = React.useState(initial?.location ?? "")
  const [locationDetail, setLocationDetail] = React.useState(
    initial?.locationDetail ?? ""
  )
  const [description, setDescription] = React.useState(initial?.description ?? "")
  const [immediateAction, setImmediateAction] = React.useState(
    initial?.immediateAction ?? ""
  )
  const [reportedBy, setReportedBy] = React.useState(
    initial?.reportedBy ?? defaultReportedBy
  )

  const [injured, setInjured] = React.useState<InjuredRow[]>([])
  const [witnesses, setWitnesses] = React.useState<WitnessRow[]>([])
  const [actions, setActions] = React.useState<ActionRow[]>([])

  const isEdit = mode === "edit"

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
      location: location.trim(),
      locationDetail: locationDetail.trim() || undefined,
      description,
      immediateAction: immediateAction.trim() || undefined,
      reportedBy: reportedBy.trim(),
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
      followUpActions: actions.map((a) => ({
        description: a.description.trim(),
        assignedTo: a.assignedTo.trim(),
        dueDate: a.dueDate,
      })),
    }
  }

  function handleCreate(asDraft: boolean) {
    if (!centerId) {
      toast.error("Please select a centre.")
      return
    }
    if (!buildOccurredAt()) {
      toast.error("Please enter a valid date and time for the incident.")
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
        const suffix = result.data.needsRiddor ? "?tab=riddor" : ""
        router.push(`/flagly/incidents/${result.data.id}${suffix}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUpdate() {
    if (!initial) return
    if (!buildOccurredAt()) {
      toast.error("Please enter a valid date and time for the incident.")
      return
    }
    startTransition(async () => {
      const result = await updateIncident({ id: initial.id, ...buildCorePayload() })
      if (result.ok) {
        toast.success("Incident updated.")
        router.push(`/flagly/incidents/${initial.id}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-5 pb-28 sm:pb-6">
      {/* Section 1 — Incident Details */}
      <Section number={1} title="Incident details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Centre" htmlFor="centre" required className="sm:col-span-2">
            <Select value={centerId} onValueChange={setCenterId}>
              <SelectTrigger id="centre">
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

          <Field label="Occurred on" htmlFor="occurredOn" required>
            <Input
              id="occurredOn"
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
            />
          </Field>
          <Field label="Occurred at" htmlFor="occurredTime" required>
            <Input
              id="occurredTime"
              type="time"
              value={occurredTime}
              onChange={(e) => setOccurredTime(e.target.value)}
            />
          </Field>

          <Field label="Location" htmlFor="location" required>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main pool, Gym floor"
            />
          </Field>
          <Field label="Location detail" htmlFor="locationDetail">
            <Input
              id="locationDetail"
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              placeholder="e.g. Deep end, lane 3"
            />
          </Field>
        </div>
      </Section>

      {/* Section 2 — Description */}
      <Section number={2} title="Description">
        <Field label="What happened?" htmlFor="description" required>
          <Textarea
            id="description"
            rows={5}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            What qualifies as Reportable?
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">HSA Ireland:</span>{" "}
              fatalities, dangerous occurrences, and injuries causing more than 3
              days&apos; absence from normal work.
            </p>
            <p>
              <span className="font-medium text-foreground">RIDDOR (NI/UK):</span>{" "}
              fatalities, specified injuries, over-7-day injuries, and dangerous
              occurrences.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <SeverityTriageBanner severity={severity} />
      </Section>

      {/* Sections 4 & 6 — People + actions are captured at report time only */}
      {!isEdit ? (
        <>
          <Section
            number={4}
            title="People involved"
            description="Optional — injured parties and witnesses can also be added after submission."
          >
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <UserRound className="size-4 text-muted-foreground" />
                    Injured parties
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4 text-muted-foreground" />
                    Witnesses
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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

          <Section number={6} title="Follow-up actions" description="Optional.">
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActions((rows) => [
                      ...rows,
                      {
                        key: uid(),
                        description: "",
                        assignedTo: "",
                        dueDate: "",
                      },
                    ])
                  }
                >
                  <Plus /> Add follow-up action
                </Button>
              </div>
              {actions.map((row, index) => (
                <div
                  key={row.key}
                  className="space-y-3 rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Action {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove action"
                      onClick={() =>
                        setActions((rows) => rows.filter((r) => r.key !== row.key))
                      }
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Action description" required className="sm:col-span-2">
                      <Input
                        value={row.description}
                        onChange={(e) =>
                          setActions((rows) =>
                            rows.map((r) =>
                              r.key === row.key
                                ? { ...r, description: e.target.value }
                                : r
                            )
                          )
                        }
                      />
                    </Field>
                    <Field label="Assigned to" required>
                      <Input
                        value={row.assignedTo}
                        onChange={(e) =>
                          setActions((rows) =>
                            rows.map((r) =>
                              r.key === row.key
                                ? { ...r, assignedTo: e.target.value }
                                : r
                            )
                          )
                        }
                      />
                    </Field>
                    <Field label="Due date" required>
                      <Input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) =>
                          setActions((rows) =>
                            rows.map((r) =>
                              r.key === row.key
                                ? { ...r, dueDate: e.target.value }
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
          </Section>
        </>
      ) : null}

      {/* Section 5 — Reported By */}
      <Section number={5} title="Reported by">
        <Field label="Your name" htmlFor="reportedBy" required>
          <Input
            id="reportedBy"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
          />
        </Field>
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
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-background/95 p-3 backdrop-blur sm:static sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <Button
            variant="outline"
            type="button"
            className="flex-1 sm:flex-none"
            onClick={() => handleCreate(true)}
            disabled={pending}
          >
            {pending && submittingDraft ? <Loader2 className="animate-spin" /> : null}
            Save as draft
          </Button>
          <Button
            type="button"
            className="flex-1 sm:flex-none"
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
