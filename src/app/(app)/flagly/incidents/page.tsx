import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { getFlaglyContext } from "@/lib/flagly/context"
import { getIncidents } from "@/lib/flagly/data/incidents"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/flagly/shared/PageHeader"
import { IncidentTable } from "@/components/flagly/incidents/IncidentTable"

export const metadata: Metadata = { title: "All incidents" }

export default async function IncidentsPage() {
  const [{ centers }, incidents] = await Promise.all([
    getFlaglyContext(),
    getIncidents(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="All incidents"
        description="Every incident reported across all centres. Filter, search, and export the log."
      >
        <Button asChild>
          <Link href="/flagly/incidents/new">
            <Plus />
            Report incident
          </Link>
        </Button>
      </PageHeader>

      <IncidentTable incidents={incidents} centers={centers} />
    </div>
  )
}
