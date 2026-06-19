import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    // Type checking is run separately via `npm run typecheck`.
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
}

export default nextConfig
