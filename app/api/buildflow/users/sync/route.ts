import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticateBuildFlowRequest } from "../../middleware"
import { createUserDefaults, isDatabaseEmpty } from "@/models/defaults"

/**
 * User lifecycle sync endpoint.
 * Called by ControlHub when users are invited, updated, or removed.
 */
export async function POST(request: Request) {
  const authResult = await authenticateBuildFlowRequest()
  if (authResult instanceof NextResponse) return authResult

  const body = await request.json()
  const { event, email, name, userId: externalUserId, tenantId } = body

  if (!event || !email) {
    return NextResponse.json(
      { error: "event e email obrigatórios" },
      { status: 400 }
    )
  }

  try {
    switch (event) {
      case "user.invited": {
        // Upsert user
        let user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              externalId: externalUserId || user.externalId,
              externalTenantId: tenantId || user.externalTenantId,
              name: name || user.name,
              emailVerified: true,
            },
          })
        } else {
          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name: name || email.split("@")[0],
              externalId: externalUserId,
              externalTenantId: tenantId,
              tenantId: tenantId,
              emailVerified: true,
              membershipPlan: "buildflow",
              storageLimit: 5 * 1024 * 1024 * 1024,
              aiBalance: 50,
            },
          })

          if (await isDatabaseEmpty(user.id)) {
            await createUserDefaults(user.id)
          }
        }

        return NextResponse.json({ success: true, userId: user.id })
      }

      case "user.updated": {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name: name || user.name,
              externalId: externalUserId || user.externalId,
              externalTenantId: tenantId || user.externalTenantId,
            },
          })
        }

        return NextResponse.json({ success: true })
      }

      case "user.removed": {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (user) {
          // Soft-disable: clear external mapping, keep data for auditing
          await prisma.user.update({
            where: { id: user.id },
            data: {
              externalId: null,
              externalTenantId: null,
            },
          })
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { error: `Evento desconhecido: ${event}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("[BuildFlow UserSync] Error:", error)
    return NextResponse.json(
      { error: "Erro ao sincronizar utilizador" },
      { status: 500 }
    )
  }
}
