"use server"
import { cookies } from "next/headers"

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies()
  const token = cookieStore.get("keystonejs-session")?.value

  if (token) {
    return { Cookie: `keystonejs-session=${token}` }
  }

  return {}
}

export const removeAuthToken = async () => {
  (await cookies()).set("keystonejs-session", "", {
    maxAge: -1,
  })
}