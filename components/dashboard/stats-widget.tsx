import { FiltersWidget } from "@/components/dashboard/filters-widget"
import { IncomeExpenseGraph } from "@/components/dashboard/income-expense-graph"
import { ProjectsWidget } from "@/components/dashboard/projects-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { getProjects } from "@/models/projects"
import { getSettings } from "@/models/settings"
import { getDashboardStats, getDetailedTimeSeriesStats, getProjectStats } from "@/models/stats"
import { TransactionFilters } from "@/models/transactions"
import { ArrowDown, ArrowUp, BarChart3, TrendingUp } from "lucide-react"
import Link from "next/link"

export async function StatsWidget({ filters }: { filters: TransactionFilters }) {
  const user = await getCurrentUser()
  const projects = await getProjects(user.id)
  const settings = await getSettings(user.id)
  const defaultCurrency = settings.default_currency || "EUR"

  const stats = await getDashboardStats(user.id, filters)
  const statsTimeSeries = await getDetailedTimeSeriesStats(user.id, filters, defaultCurrency)
  const statsPerProject = Object.fromEntries(
    await Promise.all(
      projects.map((project) => getProjectStats(user.id, project.code, filters).then((stats) => [project.code, stats]))
    )
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Resumo</h2>
        <FiltersWidget defaultFilters={filters} defaultRange="last-12-months" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/transactions?type=income">
          <Card className="hover:shadow-card-hover transition-all duration-300 cursor-pointer border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                <ArrowUp className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              {Object.entries(stats.totalIncomePerCurrency).map(([currency, total]) => (
                <div key={currency} className="tabular-nums font-bold text-base first:text-2xl text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(total, currency)}
                </div>
              ))}
              {!Object.entries(stats.totalIncomePerCurrency).length && (
                <div className="text-2xl font-bold tabular-nums">0.00</div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/transactions?type=expense">
          <Card className="hover:shadow-card-hover transition-all duration-300 cursor-pointer border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10">
                <ArrowDown className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              {Object.entries(stats.totalExpensesPerCurrency).map(([currency, total]) => (
                <div key={currency} className="tabular-nums font-bold text-base first:text-2xl text-red-600 dark:text-red-400">
                  {formatCurrency(total, currency)}
                </div>
              ))}
              {!Object.entries(stats.totalExpensesPerCurrency).length && (
                <div className="text-2xl font-bold tabular-nums">0.00</div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/transactions">
          <Card className="hover:shadow-card-hover transition-all duration-300 cursor-pointer border-l-4 border-l-violet-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10">
                <TrendingUp className="h-4 w-4 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent>
              {Object.entries(stats.profitPerCurrency).map(([currency, total]) => (
                <div
                  key={currency}
                  className={`tabular-nums font-bold text-base first:text-2xl ${
                    total >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(total, currency)}
                </div>
              ))}
              {!Object.entries(stats.profitPerCurrency).length && (
                <div className="text-2xl font-bold tabular-nums">0.00</div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/transactions">
          <Card className="hover:shadow-card-hover transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transações</CardTitle>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{stats.invoicesProcessed}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {statsTimeSeries.length > 0 && <IncomeExpenseGraph data={statsTimeSeries} defaultCurrency={defaultCurrency} />}

      {projects.length > 0 && (
        <>
          <h2 className="text-2xl font-bold tracking-tight">Projetos</h2>
          <ProjectsWidget projects={projects} statsPerProject={statsPerProject} />
        </>
      )}
    </div>
  )
}
