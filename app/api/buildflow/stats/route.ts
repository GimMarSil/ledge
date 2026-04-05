import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticateBuildFlowRequest } from "../middleware"

export async function GET() {
  const authResult = await authenticateBuildFlowRequest()
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult
  const currentYear = new Date().getFullYear()
  const startDate = new Date(`${currentYear}-01-01`)
  const endDate = new Date(`${currentYear}-12-31`)

  const [totalTransactions, totalIncome, totalExpenses, documentsWithNif, totalDocuments] =
    await Promise.all([
      prisma.transaction.count({ where: { userId } }),
      prisma.transaction.aggregate({
        where: { userId, type: "income", issuedAt: { gte: startDate, lte: endDate } },
        _sum: { total: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "expense", issuedAt: { gte: startDate, lte: endDate } },
        _sum: { total: true },
      }),
      prisma.transaction.count({
        where: { userId, nif: { not: null }, issuedAt: { gte: startDate, lte: endDate } },
      }),
      prisma.transaction.count({
        where: { userId, issuedAt: { gte: startDate, lte: endDate } },
      }),
    ])

  return NextResponse.json({
    year: currentYear,
    totalTransactions,
    income: (totalIncome._sum.total || 0) / 100,
    expenses: (totalExpenses._sum.total || 0) / 100,
    profit: ((totalIncome._sum.total || 0) - (totalExpenses._sum.total || 0)) / 100,
    nifCoverage: totalDocuments > 0 ? Math.round((documentsWithNif / totalDocuments) * 100) : 0,
  })
}
