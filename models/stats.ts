import { prisma } from "@/lib/db"
import { calcTotalPerCurrency } from "@/lib/stats"
import { Prisma } from "@/prisma/client"
import { cache } from "react"
import { TransactionFilters } from "./transactions"

// ─── Types for new dashboard queries ───────────────────────────────

export type DashboardStats = {
  totalIncomePerCurrency: Record<string, number>
  totalExpensesPerCurrency: Record<string, number>
  profitPerCurrency: Record<string, number>
  invoicesProcessed: number
}

export const getDashboardStats = cache(
  async (userId: string, filters: TransactionFilters = {}): Promise<DashboardStats> => {
    const where: Prisma.TransactionWhereInput = {}

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    const transactions = await prisma.transaction.findMany({ where: { ...where, userId } })
    const totalIncomePerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "income"))
    const totalExpensesPerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "expense"))
    const profitPerCurrency = Object.fromEntries(
      Object.keys(totalIncomePerCurrency).map((currency) => [
        currency,
        totalIncomePerCurrency[currency] - totalExpensesPerCurrency[currency],
      ])
    )
    const invoicesProcessed = transactions.length

    return {
      totalIncomePerCurrency,
      totalExpensesPerCurrency,
      profitPerCurrency,
      invoicesProcessed,
    }
  }
)

export type ProjectStats = {
  totalIncomePerCurrency: Record<string, number>
  totalExpensesPerCurrency: Record<string, number>
  profitPerCurrency: Record<string, number>
  invoicesProcessed: number
}

export const getProjectStats = cache(async (userId: string, projectId: string, filters: TransactionFilters = {}) => {
  const where: Prisma.TransactionWhereInput = {
    projectCode: projectId,
  }

  if (filters.dateFrom || filters.dateTo) {
    where.issuedAt = {
      gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
    }
  }

  const transactions = await prisma.transaction.findMany({ where: { ...where, userId } })
  const totalIncomePerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "income"))
  const totalExpensesPerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "expense"))
  const profitPerCurrency = Object.fromEntries(
    Object.keys(totalIncomePerCurrency).map((currency) => [
      currency,
      totalIncomePerCurrency[currency] - totalExpensesPerCurrency[currency],
    ])
  )

  const invoicesProcessed = transactions.length
  return {
    totalIncomePerCurrency,
    totalExpensesPerCurrency,
    profitPerCurrency,
    invoicesProcessed,
  }
})

export type TimeSeriesData = {
  period: string
  income: number
  expenses: number
  date: Date
}

export type CategoryBreakdown = {
  code: string
  name: string
  color: string
  income: number
  expenses: number
  transactionCount: number
}

export type DetailedTimeSeriesData = {
  period: string
  income: number
  expenses: number
  date: Date
  categories: CategoryBreakdown[]
  totalTransactions: number
}

export const getTimeSeriesStats = cache(
  async (
    userId: string,
    filters: TransactionFilters = {},
    defaultCurrency: string = "EUR"
  ): Promise<TimeSeriesData[]> => {
    const where: Prisma.TransactionWhereInput = { userId }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    if (filters.categoryCode) {
      where.categoryCode = filters.categoryCode
    }

    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }

    if (filters.type) {
      where.type = filters.type
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { issuedAt: "asc" },
    })

    if (transactions.length === 0) {
      return []
    }

    // Determine if we should group by day or month
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(transactions[0].issuedAt!)
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date(transactions[transactions.length - 1].issuedAt!)
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
    const groupByDay = daysDiff <= 50

    // Group transactions by time period
    const grouped = transactions.reduce(
      (acc, transaction) => {
        if (!transaction.issuedAt) return acc

        const date = new Date(transaction.issuedAt)
        const period = groupByDay
          ? date.toISOString().split("T")[0] // YYYY-MM-DD
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` // YYYY-MM

        if (!acc[period]) {
          acc[period] = { period, income: 0, expenses: 0, date }
        }

        // Get amount in default currency
        const amount =
          transaction.convertedCurrencyCode?.toUpperCase() === defaultCurrency.toUpperCase()
            ? transaction.convertedTotal || 0
            : transaction.currencyCode?.toUpperCase() === defaultCurrency.toUpperCase()
              ? transaction.total || 0
              : 0 // Skip transactions not in default currency for simplicity

        if (transaction.type === "income") {
          acc[period].income += amount
        } else if (transaction.type === "expense") {
          acc[period].expenses += amount
        }

        return acc
      },
      {} as Record<string, TimeSeriesData>
    )

    return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime())
  }
)

export const getDetailedTimeSeriesStats = cache(
  async (
    userId: string,
    filters: TransactionFilters = {},
    defaultCurrency: string = "EUR"
  ): Promise<DetailedTimeSeriesData[]> => {
    const where: Prisma.TransactionWhereInput = { userId }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    if (filters.categoryCode) {
      where.categoryCode = filters.categoryCode
    }

    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }

    if (filters.type) {
      where.type = filters.type
    }

    const [transactions, categories] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { issuedAt: "asc" },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
    ])

    if (transactions.length === 0) {
      return []
    }

    // Determine if we should group by day or month
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(transactions[0].issuedAt!)
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date(transactions[transactions.length - 1].issuedAt!)
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
    const groupByDay = daysDiff <= 50

    // Create category lookup
    const categoryLookup = new Map(categories.map((cat) => [cat.code, cat]))

    // Group transactions by time period
    const grouped = transactions.reduce(
      (acc, transaction) => {
        if (!transaction.issuedAt) return acc

        const date = new Date(transaction.issuedAt)
        const period = groupByDay
          ? date.toISOString().split("T")[0] // YYYY-MM-DD
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` // YYYY-MM

        if (!acc[period]) {
          acc[period] = {
            period,
            income: 0,
            expenses: 0,
            date,
            categories: new Map<string, CategoryBreakdown>(),
            totalTransactions: 0,
          }
        }

        // Get amount in default currency
        const amount =
          transaction.convertedCurrencyCode?.toUpperCase() === defaultCurrency.toUpperCase()
            ? transaction.convertedTotal || 0
            : transaction.currencyCode?.toUpperCase() === defaultCurrency.toUpperCase()
              ? transaction.total || 0
              : 0 // Skip transactions not in default currency for simplicity

        const categoryCode = transaction.categoryCode || "other"
        const category = categoryLookup.get(categoryCode) || {
          code: "other",
          name: "Other",
          color: "#6b7280",
        }

        // Initialize category if not exists
        if (!acc[period].categories.has(categoryCode)) {
          acc[period].categories.set(categoryCode, {
            code: category.code,
            name: category.name,
            color: category.color || "#6b7280",
            income: 0,
            expenses: 0,
            transactionCount: 0,
          })
        }

        const categoryData = acc[period].categories.get(categoryCode)!
        categoryData.transactionCount++
        acc[period].totalTransactions++

        if (transaction.type === "income") {
          acc[period].income += amount
          categoryData.income += amount
        } else if (transaction.type === "expense") {
          acc[period].expenses += amount
          categoryData.expenses += amount
        }

        return acc
      },
      {} as Record<
        string,
        {
          period: string
          income: number
          expenses: number
          date: Date
          categories: Map<string, CategoryBreakdown>
          totalTransactions: number
        }
      >
    )

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        categories: Array.from(item.categories.values()).filter((cat) => cat.income > 0 || cat.expenses > 0),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }
)

// ─── Completeness Stats ────────────────────────────────────────────

export type CompletenessStats = {
  totalTransactions: number
  withNif: number
  withDocumentType: number
  withCategory: number
  withProject: number
  withVatData: number
  score: number // 0–100
  monthlyStreak: number
}

export const getCompletenessStats = cache(
  async (userId: string, filters: TransactionFilters = {}): Promise<CompletenessStats> => {
    const where: Prisma.TransactionWhereInput = { userId }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    const transactions = await prisma.transaction.findMany({ where })
    const total = transactions.length

    if (total === 0) {
      return { totalTransactions: 0, withNif: 0, withDocumentType: 0, withCategory: 0, withProject: 0, withVatData: 0, score: 0, monthlyStreak: 0 }
    }

    const withNif = transactions.filter((t) => t.nif && t.nif.length > 0).length
    const withDocumentType = transactions.filter((t) => t.documentType && t.documentType.length > 0).length
    const withCategory = transactions.filter((t) => t.categoryCode && t.categoryCode.length > 0).length
    const withProject = transactions.filter((t) => t.projectCode && t.projectCode.length > 0).length
    const withVatData = transactions.filter((t) => (t.vatAmount !== null && t.vatAmount !== 0) || (t.vatBreakdown !== null)).length

    // Weighted score: NIF(30) + docType(20) + category(20) + project(15) + vat(15)
    const score = Math.round(
      (withNif / total) * 30 +
      (withDocumentType / total) * 20 +
      (withCategory / total) * 20 +
      (withProject / total) * 15 +
      (withVatData / total) * 15
    )

    // Monthly streak: count consecutive months (going backwards) with at least 1 transaction
    const now = new Date()
    let streak = 0
    for (let i = 0; i < 24; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const hasTransactions = transactions.some(
        (t) => t.issuedAt && t.issuedAt >= monthStart && t.issuedAt <= monthEnd
      )
      if (hasTransactions) streak++
      else break
    }

    return { totalTransactions: total, withNif, withDocumentType, withCategory, withProject, withVatData, score, monthlyStreak: streak }
  }
)

// ─── Cost Center Detailed Stats ────────────────────────────────────

export type CostCenterDetailedStats = {
  totalIncomePerCurrency: Record<string, number>
  totalExpensesPerCurrency: Record<string, number>
  profitPerCurrency: Record<string, number>
  invoicesProcessed: number
  categoryBreakdown: { code: string; name: string; color: string; total: number; count: number }[]
  topSuppliers: { nif: string | null; merchant: string | null; total: number; count: number }[]
  trendPercent: number | null // % change vs previous period
}

export const getCostCenterDetailedStats = cache(
  async (userId: string, projectCode: string, filters: TransactionFilters = {}, defaultCurrency: string = "EUR"): Promise<CostCenterDetailedStats> => {
    const where: Prisma.TransactionWhereInput = { userId, projectCode }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
    })

    const totalIncomePerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "income"))
    const totalExpensesPerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "expense"))
    const profitPerCurrency = Object.fromEntries(
      Object.keys({ ...totalIncomePerCurrency, ...totalExpensesPerCurrency }).map((currency) => [
        currency,
        (totalIncomePerCurrency[currency] || 0) - (totalExpensesPerCurrency[currency] || 0),
      ])
    )

    // Category breakdown (expenses only)
    const categoryMap = new Map<string, { code: string; name: string; color: string; total: number; count: number }>()
    for (const t of transactions.filter((t) => t.type === "expense")) {
      const code = t.categoryCode || "outros"
      const existing = categoryMap.get(code) || {
        code,
        name: t.category?.name || "Outros",
        color: t.category?.color || "#6b7280",
        total: 0,
        count: 0,
      }
      existing.total += t.total || 0
      existing.count++
      categoryMap.set(code, existing)
    }
    const categoryBreakdown = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)

    // Top suppliers (expenses only)
    const supplierMap = new Map<string, { nif: string | null; merchant: string | null; total: number; count: number }>()
    for (const t of transactions.filter((t) => t.type === "expense")) {
      const key = t.nif || t.merchant || "desconhecido"
      const existing = supplierMap.get(key) || { nif: t.nif, merchant: t.merchant, total: 0, count: 0 }
      existing.total += t.total || 0
      existing.count++
      if (!existing.nif && t.nif) existing.nif = t.nif
      if (!existing.merchant && t.merchant) existing.merchant = t.merchant
      supplierMap.set(key, existing)
    }
    const topSuppliers = Array.from(supplierMap.values()).sort((a, b) => b.total - a.total).slice(0, 5)

    // Trend: compare current period total expenses vs previous equivalent period
    let trendPercent: number | null = null
    if (filters.dateFrom && filters.dateTo) {
      const from = new Date(filters.dateFrom)
      const to = new Date(filters.dateTo)
      const periodMs = to.getTime() - from.getTime()
      const prevFrom = new Date(from.getTime() - periodMs)
      const prevTo = new Date(from.getTime() - 1)

      const prevTransactions = await prisma.transaction.findMany({
        where: { userId, projectCode, type: "expense", issuedAt: { gte: prevFrom, lte: prevTo } },
      })
      const currentExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.total || 0), 0)
      const prevExpenses = prevTransactions.reduce((sum, t) => sum + (t.total || 0), 0)
      if (prevExpenses > 0) {
        trendPercent = Math.round(((currentExpenses - prevExpenses) / prevExpenses) * 100)
      }
    }

    return {
      totalIncomePerCurrency,
      totalExpensesPerCurrency,
      profitPerCurrency,
      invoicesProcessed: transactions.length,
      categoryBreakdown,
      topSuppliers,
      trendPercent,
    }
  }
)

// ─── Cost Center Comparison ────────────────────────────────────────

export type CostCenterComparisonItem = {
  projectCode: string
  projectName: string
  projectColor: string
  income: number
  expenses: number
  profit: number
  budget: number | null
  budgetUtilization: number | null // 0–100
  transactionCount: number
}

export const getCostCenterComparison = cache(
  async (userId: string, filters: TransactionFilters = {}, defaultCurrency: string = "EUR"): Promise<CostCenterComparisonItem[]> => {
    const projects = await prisma.project.findMany({ where: { userId }, orderBy: { name: "asc" } })

    const where: Prisma.TransactionWhereInput = { userId }
    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    const transactions = await prisma.transaction.findMany({ where })

    return projects.map((project) => {
      const projectTxs = transactions.filter((t) => t.projectCode === project.code)
      const income = projectTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => {
          if (t.convertedCurrencyCode?.toUpperCase() === defaultCurrency.toUpperCase()) return sum + (t.convertedTotal || 0)
          if (t.currencyCode?.toUpperCase() === defaultCurrency.toUpperCase()) return sum + (t.total || 0)
          return sum
        }, 0)
      const expenses = projectTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => {
          if (t.convertedCurrencyCode?.toUpperCase() === defaultCurrency.toUpperCase()) return sum + (t.convertedTotal || 0)
          if (t.currencyCode?.toUpperCase() === defaultCurrency.toUpperCase()) return sum + (t.total || 0)
          return sum
        }, 0)

      return {
        projectCode: project.code,
        projectName: project.name,
        projectColor: project.color,
        income,
        expenses,
        profit: income - expenses,
        budget: project.budget,
        budgetUtilization: project.budget && project.budget > 0 ? Math.round((expenses / project.budget) * 100) : null,
        transactionCount: projectTxs.length,
      }
    })
  }
)

// ─── Insights (anomalies, streaks, milestones) ─────────────────────

export type Insight = {
  type: "spike" | "drop" | "streak" | "missing" | "milestone"
  message: string
  severity: "info" | "warning"
}

export const getInsights = cache(
  async (userId: string, filters: TransactionFilters = {}, defaultCurrency: string = "EUR"): Promise<Insight[]> => {
    const insights: Insight[] = []
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [currentTxs, prevTxs, allTxs] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, issuedAt: { gte: currentMonthStart, lte: currentMonthEnd } },
        include: { category: true },
      }),
      prisma.transaction.findMany({
        where: { userId, issuedAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        include: { category: true },
      }),
      prisma.transaction.findMany({ where: { userId } }),
    ])

    // Category spikes/drops (>30% change)
    const currentByCat = new Map<string, { name: string; total: number }>()
    const prevByCat = new Map<string, { name: string; total: number }>()

    for (const t of currentTxs.filter((t) => t.type === "expense")) {
      const code = t.categoryCode || "outros"
      const existing = currentByCat.get(code) || { name: t.category?.name || "Outros", total: 0 }
      existing.total += t.total || 0
      currentByCat.set(code, existing)
    }
    for (const t of prevTxs.filter((t) => t.type === "expense")) {
      const code = t.categoryCode || "outros"
      const existing = prevByCat.get(code) || { name: t.category?.name || "Outros", total: 0 }
      existing.total += t.total || 0
      prevByCat.set(code, existing)
    }

    for (const [code, current] of currentByCat) {
      const prev = prevByCat.get(code)
      if (prev && prev.total > 0) {
        const changePercent = Math.round(((current.total - prev.total) / prev.total) * 100)
        if (changePercent > 30) {
          insights.push({
            type: "spike",
            message: `${current.name} +${changePercent}% este mes`,
            severity: "warning",
          })
        } else if (changePercent < -30) {
          insights.push({
            type: "drop",
            message: `${current.name} ${changePercent}% este mes`,
            severity: "info",
          })
        }
      }
    }

    // Missing NIF this month
    const missingNif = currentTxs.filter((t) => t.type === "expense" && !t.nif && (t.total || 0) > 0).length
    if (missingNif > 0) {
      insights.push({
        type: "missing",
        message: `${missingNif} despesa${missingNif > 1 ? "s" : ""} sem NIF este mes`,
        severity: "warning",
      })
    }

    // Monthly streak
    let streak = 0
    for (let i = 0; i < 24; i++) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      if (allTxs.some((t) => t.issuedAt && t.issuedAt >= mStart && t.issuedAt <= mEnd)) streak++
      else break
    }
    if (streak >= 3) {
      insights.push({
        type: "streak",
        message: `${streak} meses consecutivos com dados!`,
        severity: "info",
      })
    }

    // Milestones
    const totalCount = allTxs.length
    const milestones = [1000, 500, 250, 100, 50]
    for (const milestone of milestones) {
      if (totalCount >= milestone) {
        insights.push({
          type: "milestone",
          message: `${milestone}+ documentos processados`,
          severity: "info",
        })
        break // Only show the highest milestone
      }
    }

    return insights.slice(0, 5) // Max 5 insights
  }
)

// ─── Dashboard Stats with Trend ────────────────────────────────────

export type DashboardStatsWithTrend = DashboardStats & {
  incomeTrendPercent: number | null
  expensesTrendPercent: number | null
  profitTrendPercent: number | null
  transactionsTrendPercent: number | null
}

export const getDashboardStatsWithTrend = cache(
  async (userId: string, filters: TransactionFilters = {}): Promise<DashboardStatsWithTrend> => {
    const currentStats = await getDashboardStats(userId, filters)

    let incomeTrendPercent: number | null = null
    let expensesTrendPercent: number | null = null
    let profitTrendPercent: number | null = null
    let transactionsTrendPercent: number | null = null

    if (filters.dateFrom && filters.dateTo) {
      const from = new Date(filters.dateFrom)
      const to = new Date(filters.dateTo)
      const periodMs = to.getTime() - from.getTime()
      const prevFrom = new Date(from.getTime() - periodMs)
      const prevTo = new Date(from.getTime() - 1)

      const prevStats = await getDashboardStats(userId, {
        dateFrom: prevFrom.toISOString().split("T")[0],
        dateTo: prevTo.toISOString().split("T")[0],
      })

      const calcTrend = (current: Record<string, number>, previous: Record<string, number>): number | null => {
        const currTotal = Object.values(current).reduce((sum, v) => sum + v, 0)
        const prevTotal = Object.values(previous).reduce((sum, v) => sum + v, 0)
        if (prevTotal === 0) return null
        return Math.round(((currTotal - prevTotal) / prevTotal) * 100)
      }

      incomeTrendPercent = calcTrend(currentStats.totalIncomePerCurrency, prevStats.totalIncomePerCurrency)
      expensesTrendPercent = calcTrend(currentStats.totalExpensesPerCurrency, prevStats.totalExpensesPerCurrency)
      profitTrendPercent = calcTrend(currentStats.profitPerCurrency, prevStats.profitPerCurrency)
      if (prevStats.invoicesProcessed > 0) {
        transactionsTrendPercent = Math.round(
          ((currentStats.invoicesProcessed - prevStats.invoicesProcessed) / prevStats.invoicesProcessed) * 100
        )
      }
    }

    return {
      ...currentStats,
      incomeTrendPercent,
      expensesTrendPercent,
      profitTrendPercent,
      transactionsTrendPercent,
    }
  }
)
