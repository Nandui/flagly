import { requireUser } from "@/lib/session"
import { getActiveCenter, type CenterSummary } from "@/lib/centrely/active-center"
import type { SessionUser } from "@/lib/session"

export type FlaglyContext = {
  user: SessionUser
  activeCenter: CenterSummary | null
  centers: CenterSummary[]
}

export async function getFlaglyContext(): Promise<FlaglyContext> {
  const user = await requireUser()
  const { active, centers } = await getActiveCenter(user)
  return { user, activeCenter: active, centers }
}
