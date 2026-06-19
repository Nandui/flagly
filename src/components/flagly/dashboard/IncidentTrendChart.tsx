"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { IncidentType } from "@prisma/client"

import type { TrendBucket } from "@/lib/flagly/types"
import { INCIDENT_TYPE_LABELS } from "@/lib/flagly/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const TYPE_FILLS: Record<IncidentType, string> = {
  ACCIDENT: "#4f46e5",
  NEAR_MISS: "#0891b2",
  PROPERTY_DAMAGE: "#a16207",
  VIOLENCE_AGGRESSION: "#b91c1c",
  HAZARDOUS_SUBSTANCE: "#15803d",
  FIRE_OR_EVACUATION: "#c2410c",
  OTHER: "#64748b",
}

const TYPE_ORDER: IncidentType[] = [
  "ACCIDENT",
  "NEAR_MISS",
  "PROPERTY_DAMAGE",
  "VIOLENCE_AGGRESSION",
  "HAZARDOUS_SUBSTANCE",
  "FIRE_OR_EVACUATION",
  "OTHER",
]

export function IncidentTrendChart({ data }: { data: TrendBucket[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident trend</CardTitle>
        <CardDescription>Last 6 months by type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="currentColor"
              strokeOpacity={0.3}
              tick={{ fill: "currentColor", fillOpacity: 0.6, fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="currentColor"
              strokeOpacity={0.3}
              tick={{ fill: "currentColor", fillOpacity: 0.6, fontSize: 12 }}
              tickLine={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--card-foreground)",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
            />
            {TYPE_ORDER.map((type) => (
              <Bar
                key={type}
                dataKey={type}
                name={INCIDENT_TYPE_LABELS[type]}
                stackId="incidents"
                fill={TYPE_FILLS[type]}
                radius={type === "OTHER" ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
