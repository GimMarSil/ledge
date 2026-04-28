import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { checkEntitlement } from "@/lib/buildflow/entitlement"
import { emitUsage } from "@/lib/buildflow/usage"
import { authenticateBuildFlowRequest } from "../middleware"
import { generateSAFTData, saftToXML } from "@/lib/fiscal/saft/saft-generator"

export async function GET(request: Request) {
  const authResult = await authenticateBuildFlowRequest()
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult

  const entitlement = await checkEntitlement(userId, "tax-export")
  if (!entitlement.allowed) {
    return NextResponse.json(
      { error: "tax_export_not_entitled", reason: entitlement.reason },
      { status: 402 }
    )
  }

  const { searchParams } = new URL(request.url)

  const fiscalYear = searchParams.get("year") || String(new Date().getFullYear())
  const startDate = searchParams.get("startDate") || `${fiscalYear}-01-01`
  const endDate = searchParams.get("endDate") || `${fiscalYear}-12-31`

  const [user, transactions, fiscalEntities, taxTables] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.transaction.findMany({
      where: {
        userId,
        issuedAt: { gte: new Date(startDate), lte: new Date(endDate) },
        documentType: { not: null },
      },
      orderBy: { issuedAt: "asc" },
    }),
    prisma.fiscalEntity.findMany({ where: { userId } }),
    prisma.taxTable.findMany({ where: { userId } }),
  ])

  if (!user) {
    return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 })
  }

  const saftData = generateSAFTData({
    user,
    fiscalYear,
    startDate,
    endDate,
    transactions,
    fiscalEntities,
    taxTables,
  })

  const xml = saftToXML(saftData)

  emitUsage({
    userId,
    metric: "saft.exports",
    value: 1,
    metadata: { fiscalYear, transactionCount: transactions.length },
  })

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="SAF-T_${fiscalYear}.xml"`,
    },
  })
}
