"use client"

import { formatCurrency, formatPeriodLabel } from "@/lib/utils"
import { DetailedTimeSeriesData } from "@/models/stats"
import { addDays, endOfMonth, format, startOfMonth } from "date-fns"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface IncomeExpenseGraphProps {
  data: DetailedTimeSeriesData[]
  defaultCurrency: string
}

export function IncomeExpenseGraph({ data, defaultCurrency }: IncomeExpenseGraphProps) {
  const router = useRouter()

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        label: formatPeriodLabel(item.period, item.date),
        negExpenses: -item.expenses,
      })),
    [data]
  )

  const handleBarClick = useCallback(
    (item: DetailedTimeSeriesData, type: "income" | "expense") => {
      const isDailyPeriod = item.period.includes("-") && item.period.split("-").length === 3
      let dateFrom: string
      let dateTo: string

      if (isDailyPeriod) {
        const date = new Date(item.period)
        dateFrom = item.period
        dateTo = format(addDays(date, 1), "yyyy-MM-dd")
      } else {
        const [year, month] = item.period.split("-")
        const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        dateFrom = format(startOfMonth(monthDate), "yyyy-MM-dd")
        dateTo = format(addDays(endOfMonth(monthDate), 1), "yyyy-MM-dd")
      }

      router.push(`/transactions?${new URLSearchParams({ type, dateFrom, dateTo }).toString()}`)
    },
    [router]
  )

  if (!data.length) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-muted-foreground rounded-xl border bg-card">
        Sem dados para o período selecionado
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expenses)))
  if (maxValue === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-muted-foreground rounded-xl border bg-card">
        Sem transações para o período selecionado
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incomeVal = payload.find((p: any) => p.dataKey === "income")?.value || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expenseVal = Math.abs(payload.find((p: any) => p.dataKey === "negExpenses")?.value || 0)

    return (
      <div className="bg-card border rounded-xl shadow-lg p-4 min-w-[200px]">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {incomeVal > 0 && (
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-muted-foreground">Receitas</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(incomeVal, defaultCurrency)}
            </span>
          </div>
        )}
        {expenseVal > 0 && (
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-muted-foreground">Despesas</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
              {formatCurrency(expenseVal, defaultCurrency)}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl border bg-card p-4">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => {
              const abs = Math.abs(value)
              if (abs >= 1000) return `${(abs / 1000).toFixed(0)}k`
              return `${abs}`
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
          <Bar
            dataKey="income"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(data: any) => data.income > 0 && handleBarClick(data, "income")}
            cursor="pointer"
          >
            {chartData.map((_, index) => (
              <Cell key={`income-${index}`} fill="hsl(160, 84%, 39%)" />
            ))}
          </Bar>
          <Bar
            dataKey="negExpenses"
            radius={[0, 0, 6, 6]}
            maxBarSize={48}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(data: any) => data.expenses > 0 && handleBarClick(data, "expense")}
            cursor="pointer"
          >
            {chartData.map((_, index) => (
              <Cell key={`expense-${index}`} fill="hsl(0, 72%, 51%)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
