import { redirect } from "next/navigation"

import { auth } from "@/auth"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  centerId: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    name: session.user.name ?? "Unknown",
    email: session.user.email ?? "",
    role: session.user.role ?? "Viewer",
    centerId: session.user.centerId ?? null,
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}
