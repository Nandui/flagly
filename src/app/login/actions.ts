"use server"

import { AuthError } from "next-auth"

import { signIn } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { PRIMARY_ADMIN_ROLE } from "@/lib/centrely/roles"
import { firstAdminSchema } from "@/lib/flagly/validation"

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/flagly",
    })
    return undefined
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? "Incorrect email or password."
        : "Something went wrong signing you in."
    }
    // Re-throw the NEXT_REDIRECT control-flow error so navigation happens.
    throw error
  }
}

/**
 * One-time bootstrap shown on the sign-in page while no users exist. Creates the
 * first Admin account and, if there are no centres yet, a starter centre so the
 * app is immediately usable (incidents are scoped to a centre).
 */
export async function createFirstAdmin(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  if ((await prisma.user.count()) > 0) {
    return "Setup is already complete — please sign in."
  }

  const parsed = firstAdminSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Check the form and try again."
  }

  const email = parsed.data.email.toLowerCase()
  if (await prisma.user.findUnique({ where: { email } })) {
    return "That email is already registered."
  }

  // Ensure there is at least one centre to report incidents against.
  let center = await prisma.center.findFirst()
  if (!center) {
    center = await prisma.center.create({
      data: { name: "LeisureWorld Cork", siteCode: "LW", region: "IRELAND" },
    })
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: PRIMARY_ADMIN_ROLE,
      centers: { connect: { id: center.id } },
      passwordHash: await hashPassword(parsed.data.password),
    },
  })

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/flagly",
    })
    return undefined
  } catch (error) {
    if (error instanceof AuthError) {
      return "Admin account created — please sign in."
    }
    throw error
  }
}
