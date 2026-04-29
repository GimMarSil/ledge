import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { createUserDefaults, isDatabaseEmpty } from "@/models/defaults"
import { ensurePersonalTreasuryAccount } from "@/models/treasury-accounts"

/**
 * Provision a new tenant workspace in Despesas.
 * Called by ControlHub when a tenant subscribes to the Despesas app.
 * Creates the admin user and default data (categories, fields, settings).
 *
 * Auth note: this endpoint does NOT use the shared `authenticateBuildFlowRequest`
 * middleware because that middleware requires an existing user — and this is
 * the endpoint that creates the user. Server-to-server API key only.
 */
export async function POST(request: Request) {
  const apiKey = (await headers()).get("x-buildflow-api-key")
  const expectedKey = process.env.BUILDFLOW_API_KEY
  if (!expectedKey || !apiKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: "API key inválida" }, { status: 401 })
  }

  const body = await request.json()
  const { tenantId, adminEmail, adminName } = body

  if (!adminEmail) {
    return NextResponse.json(
      { error: "adminEmail obrigatório" },
      { status: 400 }
    )
  }

  try {
    // Upsert the admin user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { externalTenantId: tenantId },
          { email: adminEmail.toLowerCase() },
        ],
      },
    })

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          externalTenantId: tenantId,
          name: adminName || user.name,
          emailVerified: true,
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          name: adminName || adminEmail.split("@")[0],
          externalTenantId: tenantId,
          tenantId: tenantId,
          emailVerified: true,
          membershipPlan: "buildflow",
          storageLimit: -1, // unlimited for BuildFlow users
          aiBalance: 100,
        },
      })
    }

    // Create default categories, fields, and settings
    if (await isDatabaseEmpty(user.id)) {
      await createUserDefaults(user.id)
    }

    // Every tenant gets a "personal" treasury account so out-of-pocket
    // expenses paid by the user always have a payer to attach to.
    await ensurePersonalTreasuryAccount(user.id, user.name)

    return NextResponse.json({
      success: true,
      userId: user.id,
      workspaceUrl: `/dashboard`,
    })
  } catch (error) {
    console.error("[BuildFlow Provision] Error:", error)
    return NextResponse.json(
      { error: "Erro ao provisionar workspace" },
      { status: 500 }
    )
  }
}
