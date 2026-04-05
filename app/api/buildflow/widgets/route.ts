import { NextResponse } from "next/server"
import { authenticateBuildFlowRequest } from "../middleware"
import { getDashboardStatsWithTrend, getCompletenessStats, getInsights } from "@/models/stats"

/**
 * Dashboard widgets endpoint for ControlHub portal.
 * Returns rich KPI cards with trends, data quality score, and insights.
 */
export async function GET() {
  const authResult = await authenticateBuildFlowRequest()
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult

  const currentYear = new Date().getFullYear()
  const filters = {
    dateFrom: `${currentYear}-01-01`,
    dateTo: `${currentYear}-12-31`,
  }

  const [stats, completeness, insights] = await Promise.all([
    getDashboardStatsWithTrend(userId, filters),
    getCompletenessStats(userId, filters),
    getInsights(userId, filters),
  ])

  // Sum all currencies into EUR equivalent (simplified — uses raw cents)
  const totalIncome = Object.values(stats.totalIncomePerCurrency).reduce((a, b) => a + b, 0)
  const totalExpenses = Object.values(stats.totalExpensesPerCurrency).reduce((a, b) => a + b, 0)
  const profit = totalIncome - totalExpenses

  const fmt = (v: number) =>
    v.toLocaleString("pt-PT", { minimumFractionDigits: 2 })
  const trendLabel = (pct: number | null) =>
    pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs período anterior` : undefined

  const insightTitle: Record<string, string> = {
    spike: "Pico de Despesa",
    drop: "Queda de Despesa",
    streak: "Sequência Ativa",
    missing: "Dados em Falta",
    milestone: "Marco Atingido",
  }

  const widgets = [
    // KPI cards with trends
    {
      type: "kpi-card",
      title: "Receitas YTD",
      value: `${fmt(totalIncome / 100)} EUR`,
      trend: trendLabel(stats.incomeTrendPercent),
    },
    {
      type: "kpi-card",
      title: "Despesas YTD",
      value: `${fmt(totalExpenses / 100)} EUR`,
      trend: trendLabel(stats.expensesTrendPercent),
    },
    {
      type: "kpi-card",
      title: "Lucro Líquido",
      value: `${fmt(profit / 100)} EUR`,
      trend: trendLabel(stats.profitTrendPercent),
      severity: profit < 0 ? "warning" : "info",
    },
    {
      type: "kpi-card",
      title: "Transações",
      value: String(stats.invoicesProcessed),
      trend: trendLabel(stats.transactionsTrendPercent),
    },
    // Data quality score
    {
      type: "kpi-card",
      title: "Qualidade Dados",
      value: `${completeness.score}%`,
      trend: completeness.monthlyStreak > 0
        ? `${completeness.monthlyStreak} meses consecutivos`
        : undefined,
      severity: completeness.score < 50 ? "warning" : "info",
    },
    // Insights/alerts (max 3 for the portal)
    ...insights.slice(0, 3).map((insight) => ({
      type: "alert" as const,
      title: insightTitle[insight.type] || insight.type,
      value: insight.message,
      severity: insight.severity,
    })),
  ]

  return NextResponse.json(widgets)
}
