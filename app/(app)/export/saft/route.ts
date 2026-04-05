import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateSAFTData, saftToXML } from "@/lib/fiscal/saft/saft-generator"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fiscalYear = searchParams.get("year") || String(new Date().getFullYear())
  const startDate = searchParams.get("startDate") || `${fiscalYear}-01-01`
  const endDate = searchParams.get("endDate") || `${fiscalYear}-12-31`

  const userId = session.user.id

  const [user, transactions, fiscalEntities, taxTables] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.transaction.findMany({
      where: {
        userId,
        issuedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
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

  const filename = `SAF-T_${user.businessNif || "000000000"}_${fiscalYear}.xml`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
