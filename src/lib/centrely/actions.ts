"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { ACTIVE_CENTER_COOKIE } from "@/lib/centrely/active-center"

export async function setActiveCenter(centerId: string) {
  const store = await cookies()
  store.set(ACTIVE_CENTER_COOKIE, centerId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })
  revalidatePath("/flagly", "layout")
}
