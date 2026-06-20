"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CornerDownRight, Loader2, Map, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Field } from "@/components/flagly/shared/Field"
import { Panel } from "@/components/flagly/shared/Panel"
import { EmptyState } from "@/components/flagly/shared/EmptyState"
import {
  createArea,
  createSubArea,
  deleteArea,
  deleteSubArea,
  updateArea,
  updateSubArea,
} from "@/lib/flagly/actions/areas"
import { pluralize } from "@/lib/flagly/utils"
import type { AreaItem } from "@/lib/flagly/types"
import type { CenterSummary } from "@/lib/centrely/active-center"

type Editor =
  | null
  | { kind: "area"; mode: "create" }
  | { kind: "area"; mode: "edit"; id: string; name: string }
  | { kind: "subarea"; mode: "create"; areaId: string; areaName: string }
  | { kind: "subarea"; mode: "edit"; id: string; name: string; areaName: string }

export function AreasManager({
  centers,
  centerId,
  areas,
}: {
  centers: CenterSummary[]
  centerId: string
  areas: AreaItem[]
}) {
  const router = useRouter()
  const [editor, setEditor] = React.useState<Editor>(null)
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [, startTransition] = React.useTransition()

  function removeArea(area: AreaItem) {
    setPendingId(area.id)
    startTransition(async () => {
      const result = await deleteArea(area.id)
      setPendingId(null)
      if (result.ok) {
        toast.success("Area deleted.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function removeSubArea(id: string) {
    setPendingId(id)
    startTransition(async () => {
      const result = await deleteSubArea(id)
      setPendingId(null)
      if (result.ok) {
        toast.success("Sub-area deleted.")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          value={centerId}
          onValueChange={(id) => router.push(`/flagly/areas?center=${id}`)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[220px] gap-2">
            <span className="text-muted-foreground">Centre:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {centers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.siteCode ? ` (${c.siteCode})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setEditor({ kind: "area", mode: "create" })}>
          <Plus />
          Add area
        </Button>
      </div>

      {areas.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No areas defined for this centre."
          description="Add areas (e.g. Pool, Gym, Reception) and, optionally, sub-areas within them."
          action={
            <Button onClick={() => setEditor({ kind: "area", mode: "create" })}>
              <Plus />
              Add area
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {areas.map((area) => (
            <Panel
              key={area.id}
              title={area.name}
              description={`${area.incidentCount} ${pluralize(
                area.incidentCount,
                "incident"
              )} · ${area.subAreas.length} ${pluralize(
                area.subAreas.length,
                "sub-area"
              )}`}
              action={
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit area"
                    onClick={() =>
                      setEditor({
                        kind: "area",
                        mode: "edit",
                        id: area.id,
                        name: area.name,
                      })
                    }
                  >
                    <Pencil className="text-muted-foreground" />
                  </Button>
                  <DeleteButton
                    label="Delete area"
                    disabledReason={
                      area.incidentCount > 0
                        ? "Areas used by incidents can't be deleted."
                        : null
                    }
                    pending={pendingId === area.id}
                    onConfirm={() => removeArea(area)}
                  />
                </div>
              }
            >
              <div className="space-y-1">
                {area.subAreas.length === 0 ? (
                  <p className="py-1 text-sm text-muted-foreground">
                    No sub-areas yet.
                  </p>
                ) : (
                  area.subAreas.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm">{sub.name}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {sub.incidentCount}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit sub-area"
                        onClick={() =>
                          setEditor({
                            kind: "subarea",
                            mode: "edit",
                            id: sub.id,
                            name: sub.name,
                            areaName: area.name,
                          })
                        }
                      >
                        <Pencil className="text-muted-foreground" />
                      </Button>
                      <DeleteButton
                        label="Delete sub-area"
                        disabledReason={
                          sub.incidentCount > 0
                            ? "Sub-areas used by incidents can't be deleted."
                            : null
                        }
                        pending={pendingId === sub.id}
                        onConfirm={() => removeSubArea(sub.id)}
                      />
                    </div>
                  ))
                )}
                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditor({
                        kind: "subarea",
                        mode: "create",
                        areaId: area.id,
                        areaName: area.name,
                      })
                    }
                  >
                    <Plus />
                    Add sub-area
                  </Button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <NameSheet
        editor={editor}
        centerId={centerId}
        onOpenChange={(open) => !open && setEditor(null)}
      />
    </div>
  )
}

function DeleteButton({
  label,
  disabledReason,
  pending,
  onConfirm,
}: {
  label: string
  disabledReason: string | null
  pending: boolean
  onConfirm: () => void
}) {
  if (disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button variant="ghost" size="icon" aria-label={label} disabled>
              <Trash2 className="text-muted-foreground/50" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={pending}
      onClick={onConfirm}
    >
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Trash2 className="text-muted-foreground" />
      )}
    </Button>
  )
}

function sheetCopy(editor: Editor): { title: string; description: string } {
  if (!editor) return { title: "", description: "" }
  if (editor.kind === "area") {
    return editor.mode === "create"
      ? {
          title: "Add area",
          description:
            "A top-level location within this centre, e.g. Pool, Gym or Reception.",
        }
      : {
          title: "Edit area",
          description:
            "Rename this area. Incidents already reported keep their recorded location.",
        }
  }
  return editor.mode === "create"
    ? {
        title: `Add sub-area to ${editor.areaName}`,
        description: "A more specific spot within the area, e.g. Deep end or Lane 3.",
      }
    : {
        title: "Edit sub-area",
        description: `Rename this sub-area in ${editor.areaName}.`,
      }
}

function NameSheet({
  editor,
  centerId,
  onOpenChange,
}: {
  editor: Editor
  centerId: string
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [name, setName] = React.useState("")

  React.useEffect(() => {
    if (!editor) return
    setName(editor.mode === "edit" ? editor.name : "")
  }, [editor])

  function submit() {
    if (!editor) return
    const ed = editor
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("Enter a name.")
      return
    }
    startTransition(async () => {
      const result =
        ed.kind === "area"
          ? ed.mode === "create"
            ? await createArea({ centerId, name: trimmed })
            : await updateArea({ id: ed.id, name: trimmed })
          : ed.mode === "create"
            ? await createSubArea({ areaId: ed.areaId, name: trimmed })
            : await updateSubArea({ id: ed.id, name: trimmed })

      if (result.ok) {
        toast.success(ed.mode === "create" ? "Added." : "Saved.")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const { title, description } = sheetCopy(editor)

  return (
    <Sheet open={editor !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-6 pt-2">
          <Field label="Name" htmlFor="area-name" required>
            <Input
              id="area-name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit()
              }}
            />
          </Field>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
