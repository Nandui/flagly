import { cn } from "@/lib/utils"

/**
 * The standard content surface for the app: a white card on the grey canvas
 * with a soft shadow and the shared card radius. Optionally renders a borderless
 * header (title + description + right-aligned action).
 *
 * For flush content (e.g. a table), pass `contentClassName="p-0"`.
 */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  const hasHeader = title || description || action
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-card",
        className
      )}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="space-y-0.5">
            {title ? (
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            ) : null}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </div>
  )
}
