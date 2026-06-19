import type { ZodError } from "zod"

import type { ActionResult } from "@/lib/flagly/types"

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors }
}

export function fromZodError(error: ZodError): ActionResult<never> {
  const flat = error.flatten() as {
    formErrors: string[]
    fieldErrors: Record<string, string[] | undefined>
  }
  const fieldErrors: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(flat.fieldErrors)) {
    if (value && value.length) fieldErrors[key] = value
  }
  const first =
    Object.values(fieldErrors)[0]?.[0] ??
    flat.formErrors[0] ??
    "Please check the form and try again."
  return { ok: false, error: first, fieldErrors }
}
