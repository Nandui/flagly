import type { Metadata } from "next"

import { getFlaglyContext } from "@/lib/flagly/context"
import { getAllActions } from "@/lib/flagly/data/actions"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { FollowUpActionsOverviewTable } from "@/components/flagly/actions/FollowUpActionsOverviewTable"

export const metadata: Metadata = { title: "Follow-up actions" }

export default async function FollowUpActionsPage() {
  const [{ centers }, actions] = await Promise.all([
    getFlaglyContext(),
    getAllActions(),
  ])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Follow-up actions"
        description="Everything that needs doing across all incidents."
      />
      <FollowUpActionsOverviewTable actions={actions} centers={centers} />
    </div>
  )
}
