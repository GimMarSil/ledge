"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { CostCenterComparisonItem } from "@/models/stats"
import { BarChart3 } from "lucide-react"

export function CostCenterComparison({
  data,
  defaultCurrency,
}: {
  data: CostCenterComparisonItem[]
  defaultCurrency: string
}) {
  if (data.length < 2) return null

  const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expenses, d.budget || 0)))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          Comparacao de Centros de Custo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual bars */}
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.projectCode} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.projectColor }} />
                  <span className="text-sm font-medium">{item.projectName}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {item.transactionCount} docs
                </span>
              </div>
              <div className="space-y-1">
                {/* Income bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">Receitas</span>
                  <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full rounded bg-emerald-500/80 transition-all duration-500"
                      style={{ width: maxValue > 0 ? `${(item.income / maxValue) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-24 text-right">
                    {formatCurrency(item.income, defaultCurrency)}
                  </span>
                </div>
                {/* Expenses bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">Despesas</span>
                  <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full rounded bg-red-500/80 transition-all duration-500"
                      style={{ width: maxValue > 0 ? `${(item.expenses / maxValue) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-24 text-right">
                    {formatCurrency(item.expenses, defaultCurrency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Projeto</th>
                <th className="px-3 py-2 text-right font-medium">Receitas</th>
                <th className="px-3 py-2 text-right font-medium">Despesas</th>
                <th className="px-3 py-2 text-right font-medium">Lucro</th>
                <th className="px-3 py-2 text-right font-medium">Margem</th>
                {data.some((d) => d.budget) && (
                  <th className="px-3 py-2 text-right font-medium">Orcamento</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const margin = item.income > 0 ? Math.round((item.profit / item.income) * 100) : 0
                return (
                  <tr key={item.projectCode} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.projectColor }} />
                        {item.projectName}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.income, defaultCurrency)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-red-600 dark:text-red-400">
                      {formatCurrency(item.expenses, defaultCurrency)}
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums font-medium ${
                      item.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {formatCurrency(item.profit, defaultCurrency)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{margin}%</td>
                    {data.some((d) => d.budget) && (
                      <td className="px-3 py-2 text-right tabular-nums">
                        {item.budget ? (
                          <span className={item.budgetUtilization && item.budgetUtilization > 100 ? "text-red-500 font-medium" : ""}>
                            {item.budgetUtilization}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
