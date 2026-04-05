import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"
import { createUserDefaults, isDatabaseEmpty } from "@/models/defaults"
import { randomUUID } from "crypto"

const PLATFORM_SECRET = process.env.BUILDFLOW_PLATFORM_SECRET

interface LaunchTokenPayload {
  sub: string // ControlHub user ID
  email: string
  name: string
  tenantId: string
  tenantSlug: string
  appSlug: string
}

/**
 * SSO Token Exchange endpoint.
 * Receives a short-lived JWT from ControlHub, validates it,
 * upserts the user, creates a Better-Auth session, and redirects to the dashboard.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token obrigatório" }, { status: 400 })
  }

  if (!PLATFORM_SECRET) {
    console.error("[BuildFlow Auth] BUILDFLOW_PLATFORM_SECRET not configured")
    return NextResponse.json(
      { error: "SSO não configurado" },
      { status: 500 }
    )
  }

  // 1. Validate the JWT launch token
  let payload: LaunchTokenPayload
  try {
    const secret = new TextEncoder().encode(PLATFORM_SECRET)
    const { payload: decoded } = await jwtVerify(token, secret, {
      issuer: "buildflow-controlhub",
    })
    payload = decoded as unknown as LaunchTokenPayload
  } catch (error) {
    console.error("[BuildFlow Auth] Invalid or expired token:", error)
    return NextResponse.json(
      { error: "Token inválido ou expirado" },
      { status: 401 }
    )
  }

  // 2. Validate required fields
  if (!payload.sub || !payload.email || !payload.name) {
    return NextResponse.json(
      { error: "Token com campos em falta" },
      { status: 400 }
    )
  }

  // 3. Upsert user: find by externalId or email, create if not exists
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { externalId: payload.sub },
        { email: payload.email.toLowerCase() },
      ],
    },
  })

  if (user) {
    // Update external mapping and name if changed
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        externalId: payload.sub,
        externalTenantId: payload.tenantId,
        name: payload.name,
        emailVerified: true,
      },
    })
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        name: payload.name,
        externalId: payload.sub,
        externalTenantId: payload.tenantId,
        tenantId: payload.tenantId,
        emailVerified: true,
        membershipPlan: "buildflow",
        storageLimit: -1, // unlimited for BuildFlow users
        aiBalance: 100,
      },
    })

    // Create default categories, fields, and settings for new user
    if (await isDatabaseEmpty(user.id)) {
      await createUserDefaults(user.id)
    }
  }

  // 4. Create a Better-Auth compatible session directly in the database
  const sessionToken = randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await prisma.session.create({
    data: {
      token: sessionToken,
      userId: user.id,
      expiresAt,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "BuildFlow SSO",
    },
  })

  // 5. Redirect to dashboard with session cookie
  const baseUrl = process.env.BASE_URL || "http://localhost:7331"
  const response = NextResponse.redirect(new URL("/dashboard", baseUrl))

  // Set the Better-Auth session cookie (prefix: "ledge")
  response.cookies.set("ledge.session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  console.log(
    `[BuildFlow Auth] SSO exchange successful for ${payload.email} (externalId: ${payload.sub})`
  )

  return response
}
