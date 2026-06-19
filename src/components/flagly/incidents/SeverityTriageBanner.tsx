import { TriangleAlert } from "lucide-react"
import type { IncidentSeverity } from "@prisma/client"

import { cn } from "@/lib/utils"

export function SeverityTriageBanner({
  severity,
  className,
}: {
  severity: IncidentSeverity
  className?: string
}) {
  if (severity !== "REPORTABLE" && severity !== "CRITICAL") return null

  const critical = severity === "CRITICAL"

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        critical
          ? "border-severity-critical-line bg-severity-critical-bg text-severity-critical"
          : "border-severity-reportable-line bg-severity-reportable-bg text-severity-reportable",
        className
      )}
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-2 text-sm">
        <p className="font-semibold">
          This incident may require authority notification
        </p>
        <p className="leading-relaxed">
          HSA Ireland: submit via the BeSafe portal within 7–30 days. RIDDOR
          (NI/UK): notify within 10–15 days depending on incident type.
        </p>
        <p className="leading-relaxed">
          You will be prompted to set up a RIDDOR / HSA flag after submitting this
          report.
        </p>
      </div>
    </div>
  )
}
