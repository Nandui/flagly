import type { Metadata } from "next"
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"

import { getRiddorCounts, getRiddorFlags } from "@/lib/flagly/data/riddor"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { StatCard } from "@/components/flagly/shared/StatCard"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import { RiddorTrackerTable } from "@/components/flagly/riddor/RiddorTrackerTable"

export const metadata: Metadata = { title: "RIDDOR / HSA" }

export default async function RiddorTrackerPage() {
  const [flags, counts] = await Promise.all([
    getRiddorFlags(),
    getRiddorCounts(),
  ])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="RIDDOR / HSA"
        description="Authority notifications across all incidents."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending"
          value={counts.pending}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Reported"
          value={counts.reported}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Overdue"
          value={counts.overdue}
          icon={AlertTriangle}
          tone="danger"
          hint={
            counts.overdue > 0
              ? "Past deadline — report to authority now."
              : undefined
          }
        />
      </div>

      {flags.length === 0 ? (
        <EmptyState
          title="No RIDDOR / HSA flags."
          description="Reportable incidents that require authority notification will appear here."
        />
      ) : (
        <RiddorTrackerTable flags={flags} />
      )}
    </div>
  )
}
