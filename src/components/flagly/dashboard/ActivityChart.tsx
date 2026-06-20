"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { ActivityPoint } from "@/lib/flagly/types"
import { Panel } from "@/components/flagly/shared/Panel"

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  return (
    <Panel
      title="Activity"
      action={
        <span className="rounded-md border bg-card px-2 py-0.5 text-xs text-muted-foreground">
          Last 12 months
        </span>
      }
      contentClassName="p-5 pt-3"
    >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
            <defs>
              <linearGradient id="activityBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="month"
              stroke="currentColor"
              strokeOpacity={0.2}
              tick={{ fill: "currentColor", fillOpacity: 0.55, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="currentColor"
              strokeOpacity={0.2}
              tick={{ fill: "currentColor", fillOpacity: 0.55, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--card-foreground)",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(17,24,39,0.08)",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(value) => [value as number, "Incidents"]}
            />
            <Bar dataKey="count" fill="url(#activityBar)" radius={[6, 6, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
    </Panel>
  )
}
