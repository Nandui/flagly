"use client"

import { Download, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type ExportMenuItem = {
  label: string
  icon?: LucideIcon
  onSelect: () => void
}

export function ExportMenu({
  items,
  label = "Export",
  align = "end",
  disabled = false,
}: {
  items: ExportMenuItem[]
  label?: string
  align?: "start" | "center" | "end"
  disabled?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.label} onSelect={item.onSelect}>
              {Icon ? <Icon /> : null}
              {item.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
