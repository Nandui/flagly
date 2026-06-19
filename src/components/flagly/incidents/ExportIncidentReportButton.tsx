"use client"

import * as React from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportIncidentReportToPdf } from "@/lib/flagly/export/incident-report-pdf"
import type { IncidentDetail } from "@/lib/flagly/types"

export function ExportIncidentReportButton({
  incident,
}: {
  incident: IncidentDetail
}) {
  const [pending, setPending] = React.useState(false)

  async function run() {
    setPending(true)
    try {
      await exportIncidentReportToPdf(incident)
    } catch (error) {
      console.error(error)
      toast.error("Could not generate the PDF.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Download />}
      Export PDF
    </Button>
  )
}
