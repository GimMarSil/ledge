import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ProjectStats } from "@/models/stats"
import { Project } from "@/prisma/client"
import { Plus } from "lucide-react"
import Link from "next/link"

export function ProjectsWidget({
  projects,
  statsPerProject,
}: {
  projects: Project[]
  statsPerProject: Record<string, ProjectStats>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <Link key={project.code} href={`/transactions?projectCode=${project.code}`}>
          <Card className="hover:shadow-card-hover transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle>
                <Badge className="text-sm shadow-sm" style={{ backgroundColor: project.color }}>
                  {project.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receitas</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    {Object.entries(statsPerProject[project.code]?.totalIncomePerCurrency).map(([currency, total]) => (
                      <div key={currency} className="tabular-nums text-base first:text-xl">
                        {formatCurrency(total, currency)}
                      </div>
                    ))}
                    {!Object.entries(statsPerProject[project.code]?.totalIncomePerCurrency).length && (
                      <div className="tabular-nums text-xl">0.00</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesas</span>
                  <div className="font-bold text-red-600 dark:text-red-400">
                    {Object.entries(statsPerProject[project.code]?.totalExpensesPerCurrency).map(
                      ([currency, total]) => (
                        <div key={currency} className="tabular-nums text-base first:text-xl">
                          {formatCurrency(total, currency)}
                        </div>
                      )
                    )}
                    {!Object.entries(statsPerProject[project.code]?.totalExpensesPerCurrency).length && (
                      <div className="tabular-nums text-xl">0.00</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lucro</span>
                  <div className="font-bold">
                    {Object.entries(statsPerProject[project.code]?.profitPerCurrency).map(([currency, total]) => (
                      <div
                        key={currency}
                        className={`tabular-nums text-base first:text-xl ${
                          total >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(total, currency)}
                      </div>
                    ))}
                    {!Object.entries(statsPerProject[project.code]?.profitPerCurrency).length && (
                      <div className="tabular-nums text-xl">0.00</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
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
