import { cn } from "@/lib/utils"

/**
 * Lightweight inline sparkline (pure SVG, no chart lib). Renders a smoothed-ish
 * line + soft area fill scaled to the data range.
 */
export function Sparkline({
  data,
  className,
  stroke = "var(--primary)",
}: {
  data: number[]
  className?: string
  stroke?: string
}) {
  const w = 100
  const h = 32
  const pad = 3
  const id = `sl-${Math.random().toString(36).slice(2, 8)}`

  const points = data.length >= 2 ? data : [0, ...data]
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const stepX = (w - pad * 2) / (points.length - 1)

  const coords = points.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return [x, y] as const
  })

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${h} L${coords[0][0].toFixed(1)},${h} Z`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-9 w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
