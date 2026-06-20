"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-2 hover:text-sidebar-ink [&_svg]:size-4",
        className
      )}
    >
      {mounted && isDark ? <Moon /> : <Sun />}
    </button>
  )
}
