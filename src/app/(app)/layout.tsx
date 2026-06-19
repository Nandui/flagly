import { requireUser } from "@/lib/session"
import { getActiveCenter } from "@/lib/centrely/active-center"
import { FlaglyShell } from "@/components/flagly/layout/FlaglyShell"

export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const { active, centers } = await getActiveCenter(user)

  return (
    <FlaglyShell
      user={{ name: user.name, email: user.email, role: user.role }}
      centers={centers}
      activeCenterId={active?.id ?? null}
    >
      {children}
    </FlaglyShell>
  )
}
