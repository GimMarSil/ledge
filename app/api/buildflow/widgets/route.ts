import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticateBuildFlowRequest } from "../middleware"

/**
 * Dashboard widgets endpoint for ControlHub portal.
 * Returns standardized KPI cards with YTD stats.
 */
export async function GET() {
  const authResult = await authenticateBuildFlowRequest()
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult
  const currentYear = new Date().getFullYear()
  const startDate = new Date(`${currentYear}-01-01`)
  const endDate = new Date(`${currentYear}-12-31`)

  const [totalExpenses, pendingCount, invoiceCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "expense", issuedAt: { gte: startDate, lte: endDate } },
      _sum: { total: true },
    }),
    prisma.transaction.count({
      where: { userId, type: "expense", nif: null, issuedAt: { gte: startDate, lte: endDate } },
    }),
    prisma.transaction.count({
      where: { userId, documentType: { not: null }, issuedAt: { gte: startDate, lte: endDate } },
    }),
  ])

  const expensesValue = (totalExpenses._sum.total || 0) / 100

  const widgets = [
    {
      type: "kpi-card",
      title: "Despesas YTD",
      value: `${expensesValue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} EUR`,
    },
    {
      type: "kpi-card",
      title: "Pendentes NIF",
      value: String(pendingCount),
      severity: pendingCount > 5 ? "warning" : "info",
    },
    {
      type: "kpi-card",
      title: "Faturas Emitidas",
      value: String(invoiceCount),
    },
  ]

  return NextResponse.json(widgets)
}
