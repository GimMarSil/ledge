import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { CostCenterDetailedStats } from "@/models/stats"
import { Project } from "@/prisma/client"
import { ArrowDown, ArrowUp, FileText, Plus, Store } from "lucide-react"
import Link from "next/link"

function BudgetBar({ expenses, budget, currency }: { expenses: number; budget: number; currency: string }) {
  const percent = Math.min(Math.round((expenses / budget) * 100), 100)
  const isOver = expenses > budget
  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Orcamento</span>
        <span className={`font-medium tabular-nums ${isOver ? "text-red-500" : ""}`}>
          {percent}% de {formatCurrency(budget, currency)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : "bg-[hsl(172,100%,39%)]"}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

export function ProjectsWidget({
  projects,
  statsPerProject,
}: {
  projects: Project[]
  statsPerProject: Record<string, CostCenterDetailedStats>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => {
        const stats = statsPerProject[project.code]
        const topSupplier = stats?.topSuppliers?.[0]
        const totalExpensesEUR = Object.values(stats?.totalExpensesPerCurrency || {}).reduce((a, b) => a + b, 0)
        return (
          <Link key={project.code} href={`/transactions?projectCode=${project.code}`}>
            <Card className="hover:shadow-card-hover transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    <Badge className="text-sm shadow-sm" style={{ backgroundColor: project.color }}>
                      {project.name}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {stats?.trendPercent !== null && stats?.trendPercent !== undefined && (
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        stats.trendPercent <= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                      }`}>
                        {stats.trendPercent <= 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                        {Math.abs(stats.trendPercent)}%
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {stats?.invoicesProcessed || 0}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receitas</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {Object.entries(stats?.totalIncomePerCurrency || {}).map(([currency, total]) => (
                        <div key={currency} className="tabular-nums text-base first:text-xl">
                          {formatCurrency(total, currency)}
                        </div>
                      ))}
                      {!Object.entries(stats?.totalIncomePerCurrency || {}).length && (
                        <div className="tabular-nums text-xl">0.00</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesas</span>
                    <div className="font-bold text-red-600 dark:text-red-400">
                      {Object.entries(stats?.totalExpensesPerCurrency || {}).map(([currency, total]) => (
                        <div key={currency} className="tabular-nums text-base first:text-xl">
                          {formatCurrency(total, currency)}
                        </div>
                      ))}
                      {!Object.entries(stats?.totalExpensesPerCurrency || {}).length && (
                        <div className="tabular-nums text-xl">0.00</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lucro</span>
                    <div className="font-bold">
                      {Object.entries(stats?.profitPerCurrency || {}).map(([currency, total]) => (
                        <div
                          key={currency}
                          className={`tabular-nums text-base first:text-xl ${
                            total >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(total, currency)}
                        </div>
                      ))}
                      {!Object.entries(stats?.profitPerCurrency || {}).length && (
                        <div className="tabular-nums text-xl">0.00</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Budget bar */}
                {project.budget && project.budget > 0 && (
                  <BudgetBar
                    expenses={totalExpensesEUR}
                    budget={project.budget}
                    currency={project.budgetCurrency || "EUR"}
                  />
                )}

                {/* Top categories + supplier */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                  {stats?.categoryBreakdown?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {stats.categoryBreakdown.slice(0, 3).map((cat) => (
                        <span
                          key={cat.code}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ backgroundColor: cat.color + "20", color: cat.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {topSupplier && (
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <Store className="h-3 w-3 shrink-0" />
                      {topSupplier.merchant || topSupplier.nif || ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
      <Link
        href="/settings/projects"
        className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 group"
      >
        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        <span className="font-medium">Criar Novo Projeto</span>
      </Link>
    </div>
  )
}
