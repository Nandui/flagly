"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import type {
  FollowUpAction,
  InjuredParty,
  Witness,
} from "@prisma/client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IncidentSeverityBadge } from "@/components/flagly/incidents/IncidentSeverityBadge"
import { IncidentStatusBadge } from "@/components/flagly/incidents/IncidentStatusBadge"
import { IncidentTypeBadge } from "@/components/flagly/incidents/IncidentTypeBadge"
import { ExportIncidentReportButton } from "@/components/flagly/incidents/ExportIncidentReportButton"
import { CloseIncidentForm } from "@/components/flagly/incidents/CloseIncidentForm"
import { WitnessForm } from "@/components/flagly/witnesses/WitnessForm"
import { WitnessList } from "@/components/flagly/witnesses/WitnessList"
import { InjuredPartyForm } from "@/components/flagly/injured/InjuredPartyForm"
import { InjuredPartyList } from "@/components/flagly/injured/InjuredPartyList"
import { FollowUpActionForm } from "@/components/flagly/actions/FollowUpActionForm"
import { FollowUpActionTable } from "@/components/flagly/actions/FollowUpActionTable"
import { RiddorFlagForm } from "@/components/flagly/riddor/RiddorFlagForm"
import { MarkReportedForm } from "@/components/flagly/riddor/MarkReportedForm"
import { RiddorStatusCard } from "@/components/flagly/riddor/RiddorStatusCard"
import { IncidentTimeline, type TimelineEvent } from "@/components/flagly/shared/IncidentTimeline"
import { daysSince, formatDateTime } from "@/lib/flagly/utils"
import { setIncidentStatus, submitDraft } from "@/lib/flagly/actions/incidents"
import type { IncidentDetail } from "@/lib/flagly/types"

type SheetState =
  | null
  | { k: "witness"; record?: Witness }
  | { k: "injured"; record?: InjuredParty }
  | { k: "action"; record?: FollowUpAction }
  | { k: "riddor" }
  | { k: "markReported" }
  | { k: "close" }

const TAB_VALUES = ["overview", "witnesses", "injured", "actions", "riddor"]

export function IncidentDetailView({
  incident,
  currentUserName,
  initialTab,
}: {
  incident: IncidentDetail
  currentUserName: string
  initialTab?: string
}) {
  const router = useRouter()
  const [tab, setTab] = React.useState(
    initialTab && TAB_VALUES.includes(initialTab) ? initialTab : "overview"
  )
  const [sheet, setSheet] = React.useState<SheetState>(null)
  const [statusPending, startStatusTransition] = React.useTransition()

  const openActionCount = incident.followUpActions.filter(
    (a) => a.status !== "COMPLETE"
  ).length
  const canClose =
    (incident.status === "OPEN" || incident.status === "UNDER_INVESTIGATION") &&
    openActionCount === 0
  const flag = incident.riddorFlag
  const showRiddorBanner =
    incident.riddorRequired && (!flag || flag.status !== "REPORTED")

  function close() {
    setSheet(null)
  }

  function submitReport() {
    startStatusTransition(async () => {
      const result = await submitDraft({ incidentId: incident.id })
      if (result.ok) {
        toast.success("Report submitted.")
        if (result.data.needsRiddor) setTab("riddor")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function startInvestigation() {
    startStatusTransition(async () => {
      const result = await setIncidentStatus(incident.id, "UNDER_INVESTIGATION")
      if (result.ok) {
        toast.success("Investigation started.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const timeline: TimelineEvent[] = [
    { label: "Incident occurred", date: incident.occurredAt, icon: Calendar },
    {
      label: incident.status === "DRAFT" ? "Draft created" : "Report submitted",
      date: incident.createdAt,
      icon: FileText,
      tone: "primary",
    },
  ]
  if (incident.status === "CLOSED") {
    timeline.push({
      label: `Closed${incident.closedBy ? ` by ${incident.closedBy}` : ""}`,
      date: incident.closedAt,
      icon: CheckCircle2,
      tone: "success",
    })
  }

  return (
    <div className="space-y-5">
      <Link
        href="/flagly/incidents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All incidents
      </Link>

      {/* DRAFT submit banner */}
      {incident.status === "DRAFT" ? (
        <div className="flex flex-col gap-3 rounded-lg border border-status-draft bg-status-draft-bg p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 size-5 shrink-0 text-status-draft" />
            <div>
              <p className="font-medium">This incident is still a draft.</p>
              <p className="text-sm text-muted-foreground">
                Submit the report to make it active and start the investigation
                workflow.
              </p>
            </div>
          </div>
          <Button onClick={submitReport} disabled={statusPending}>
            {statusPending ? <Loader2 className="animate-spin" /> : null}
            Submit report
          </Button>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <IncidentSeverityBadge severity={incident.severity} />
            <IncidentStatusBadge status={incident.status} />
            <IncidentTypeBadge type={incident.type} />
          </div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">
            {incident.reference}
          </h1>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4" />
            {incident.location}
            {incident.locationDetail ? ` — ${incident.locationDetail}` : ""}
          </p>
          <p className="font-mono text-sm text-muted-foreground">
            {formatDateTime(incident.occurredAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            Reported by {incident.reportedBy}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/flagly/incidents/${incident.id}/edit`}>
              <Pencil />
              Edit
            </Link>
          </Button>
          <ExportIncidentReportButton incident={incident} />
          <Button variant="outline" size="sm" onClick={() => setSheet({ k: "action" })}>
            <Plus />
            Log action
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSheet({ k: "witness" })}>
            <Plus />
            Add witness
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSheet({ k: "injured" })}
          >
            <Plus />
            Add injured party
          </Button>
        </div>
      </div>

      {/* RIDDOR banner */}
      {showRiddorBanner ? (
        <button
          type="button"
          onClick={() => setTab("riddor")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
            flag?.status === "OVERDUE"
              ? "border-severity-critical-line bg-severity-critical-bg text-severity-critical hover:bg-severity-critical-bg/80"
              : "border-severity-reportable-line bg-severity-reportable-bg text-severity-reportable hover:bg-severity-reportable-bg/80"
          )}
        >
          <TriangleAlert className="size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">
              {flag
                ? "This incident requires authority notification."
                : "This incident was marked as reportable. A RIDDOR / HSA flag is required."}
            </p>
            <p className="text-sm opacity-90">
              {flag ? "Open the RIDDOR / HSA tab to report it." : "Complete the flag in the RIDDOR / HSA tab."}
            </p>
          </div>
          <span className="text-sm font-medium underline-offset-4 hover:underline">
            {flag ? "View →" : "Complete flag →"}
          </span>
        </button>
      ) : null}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="no-scrollbar overflow-x-auto border-b">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="witnesses">
              Witnesses
              <Count n={incident.witnesses.length} />
            </TabsTrigger>
            <TabsTrigger value="injured">
              Injured parties
              <Count n={incident.injuredParties.length} />
            </TabsTrigger>
            <TabsTrigger value="actions">
              Follow-up actions
              <Count n={incident.followUpActions.length} />
            </TabsTrigger>
            <TabsTrigger value="riddor">RIDDOR / HSA</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="space-y-5 p-5">
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    What happened
                  </h3>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {incident.description || "No description recorded."}
                  </p>
                </div>
                {incident.immediateAction ? (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Immediate action taken
                    </h3>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {incident.immediateAction}
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile
                    icon={Users}
                    label="Witnesses"
                    value={incident.witnesses.length}
                  />
                  <StatTile
                    icon={UserRound}
                    label="Injured parties"
                    value={incident.injuredParties.length}
                  />
                  <StatTile
                    icon={ClipboardList}
                    label="Open actions"
                    value={openActionCount}
                  />
                  <StatTile
                    icon={Calendar}
                    label="Days since"
                    value={daysSince(incident.occurredAt)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-5 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </h3>
                  <IncidentStatusBadge status={incident.status} />
                </div>

                <IncidentTimeline events={timeline} />

                <div className="space-y-2 border-t pt-4">
                  {incident.status === "OPEN" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={startInvestigation}
                      disabled={statusPending}
                    >
                      {statusPending ? <Loader2 className="animate-spin" /> : <Search />}
                      Start investigation
                    </Button>
                  ) : null}

                  {incident.status === "OPEN" ||
                  incident.status === "UNDER_INVESTIGATION" ? (
                    canClose ? (
                      <Button className="w-full" onClick={() => setSheet({ k: "close" })}>
                        <CheckCircle2 />
                        Close incident
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block w-full">
                            <Button className="w-full" disabled>
                              <CheckCircle2 />
                              Close incident
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          All follow-up actions must be complete before closing.
                        </TooltipContent>
                      </Tooltip>
                    )
                  ) : null}

                  {incident.status === "CLOSED" && incident.closureNotes ? (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Closure notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {incident.closureNotes}
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Witnesses */}
        <TabsContent value="witnesses">
          <SectionToolbar
            title="Witness statements"
            action={
              <Button size="sm" onClick={() => setSheet({ k: "witness" })}>
                <Plus />
                Add witness
              </Button>
            }
          />
          <WitnessList
            witnesses={incident.witnesses}
            onEdit={(record) => setSheet({ k: "witness", record })}
          />
        </TabsContent>

        {/* Injured parties */}
        <TabsContent value="injured">
          <SectionToolbar
            title="Injured parties"
            action={
              <Button size="sm" onClick={() => setSheet({ k: "injured" })}>
                <Plus />
                Add injured party
              </Button>
            }
          />
          <InjuredPartyList
            parties={incident.injuredParties}
            onEdit={(record) => setSheet({ k: "injured", record })}
          />
        </TabsContent>

        {/* Follow-up actions */}
        <TabsContent value="actions">
          <SectionToolbar
            title="Follow-up actions"
            action={
              <Button size="sm" onClick={() => setSheet({ k: "action" })}>
                <Plus />
                Add action
              </Button>
            }
          />
          <FollowUpActionTable
            actions={incident.followUpActions}
            onEdit={(record) => setSheet({ k: "action", record })}
          />
        </TabsContent>

        {/* RIDDOR / HSA */}
        <TabsContent value="riddor">
          {flag ? (
            <RiddorStatusCard
              flag={flag}
              onMarkReported={() => setSheet({ k: "markReported" })}
              onEdit={() => setSheet({ k: "riddor" })}
            />
          ) : incident.riddorRequired ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="flex items-start gap-3 text-severity-reportable">
                  <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                  <p className="font-medium">
                    This incident was marked as reportable. A RIDDOR / HSA flag is
                    required.
                  </p>
                </div>
                <Button onClick={() => setSheet({ k: "riddor" })}>
                  Complete flag →
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="space-y-1">
                  <p className="font-medium">
                    This incident has not been flagged for authority notification.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If this incident meets reporting criteria, use the button below
                    to create a flag.
                  </p>
                </div>
                <Button onClick={() => setSheet({ k: "riddor" })}>
                  Create RIDDOR / HSA flag
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Sheets */}
      <WitnessForm
        open={sheet?.k === "witness"}
        onOpenChange={(o) => !o && close()}
        incidentId={incident.id}
        record={sheet?.k === "witness" ? sheet.record : null}
      />
      <InjuredPartyForm
        open={sheet?.k === "injured"}
        onOpenChange={(o) => !o && close()}
        incidentId={incident.id}
        record={sheet?.k === "injured" ? sheet.record : null}
      />
      <FollowUpActionForm
        open={sheet?.k === "action"}
        onOpenChange={(o) => !o && close()}
        incidentId={incident.id}
        record={sheet?.k === "action" ? sheet.record : null}
      />
      <RiddorFlagForm
        open={sheet?.k === "riddor"}
        onOpenChange={(o) => !o && close()}
        incidentId={incident.id}
        occurredAt={incident.occurredAt}
        record={flag}
      />
      {flag ? (
        <MarkReportedForm
          open={sheet?.k === "markReported"}
          onOpenChange={(o) => !o && close()}
          riddorFlagId={flag.id}
          defaultReportedBy={currentUserName}
          defaultNotes={flag.notes}
        />
      ) : null}
      <CloseIncidentForm
        open={sheet?.k === "close"}
        onOpenChange={(o) => !o && close()}
        incidentId={incident.id}
        closedByName={currentUserName}
      />
    </div>
  )
}

function Count({ n }: { n: number }) {
  return (
    <span className="ml-1 rounded-full bg-secondary px-1.5 text-xs tabular-nums text-secondary-foreground">
      {n}
    </span>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function SectionToolbar({
  title,
  action,
}: {
  title: string
  action: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {action}
    </div>
  )
}
