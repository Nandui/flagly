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
          {critical
            ? "This is a critical incident"
            : "This is a reportable incident"}
        </p>
        <p className="leading-relaxed">
          {critical
            ? "Fatalities and life-threatening injuries should be escalated to senior management immediately."
            : "Reportable incidents should be escalated for management review and any required external notification."}
        </p>
      </div>
    </div>
  )
}
