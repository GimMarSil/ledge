import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export interface BuildFlowAuthResult {
  userId: string
  tenantId?: string
}

/**
 * Autenticar pedidos da API BuildFlow.
 * Suporta:
 * 1. X-BuildFlow-API-Key header (para integração server-to-server)
 * 2. Cookie de sessão (para iframe embebido)
 */
export async function authenticateBuildFlowRequest(): Promise<BuildFlowAuthResult | NextResponse> {
  const hdrs = await headers()

  // Tentar API key primeiro
  const apiKey = hdrs.get("x-buildflow-api-key")
  if (apiKey) {
    const expectedKey = process.env.BUILDFLOW_API_KEY
    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "API key inválida" }, { status: 401 })
    }

    // Com API key, o tenantId vem do header
    const tenantId = hdrs.get("x-buildflow-tenant-id")
    const userId = hdrs.get("x-buildflow-user-id")

    if (!userId) {
      return NextResponse.json({ error: "X-BuildFlow-User-Id obrigatório" }, { status: 400 })
    }

    // Verificar se o utilizador existe ou criar
    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 })
    }

    return { userId: user.id, tenantId: tenantId || undefined }
  }

  // Fallback para sessão (iframe)
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  return { userId: session.user.id, tenantId: user?.tenantId || undefined }
}

export function isBuildFlowMode(): boolean {
  return process.env.BUILDFLOW_MODULE === "true"
}

export function isEmbedMode(request: Request): boolean {
  const url = new URL(request.url)
  if (url.searchParams.get("embed") === "true") return true

  const hdrs = request.headers
  return hdrs.get("x-buildflow-embed") === "true"
}
