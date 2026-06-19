"use server"

import { AuthError } from "next-auth"

import { signIn } from "@/auth"

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/flagly",
    })
    return undefined
  } catch (error) {
    if (error instanceof AuthError) {
      return "Invalid email or password."
    }
    // Re-throw the NEXT_REDIRECT control-flow error so navigation happens.
    throw error
  }
}
