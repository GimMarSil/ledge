import { getCurrentUser } from "@/lib/auth"
import { getInsights, Insight } from "@/models/stats"
import { TransactionFilters } from "@/models/transactions"
import { AlertTriangle, Flame, Lightbulb, TrendingDown, TrendingUp, Trophy } from "lucide-react"

const INSIGHT_CONFIG: Record<Insight["type"], { icon: typeof TrendingUp; className: string }> = {
  spike: { icon: TrendingUp, className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  drop: { icon: TrendingDown, className: "border-[hsl(172,100%,39%)]/30 bg-[hsl(172,100%,39%)]/5 text-[hsl(172,80%,28%)] dark:border-[hsl(172,100%,39%)]/20 dark:bg-[hsl(172,100%,39%)]/10 dark:text-[hsl(172,100%,60%)]" },
  streak: { icon: Flame, className: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200" },
  missing: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  milestone: { icon: Trophy, className: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200" },
}

export async function InsightsWidget({ filters }: { filters: TransactionFilters }) {
  const user = await getCurrentUser()
  const insights = await getInsights(user.id, filters)

  if (insights.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Insights</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {insights.map((insight, i) => {
          const config = INSIGHT_CONFIG[insight.type]
          const Icon = config.icon
          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap shrink-0 ${config.className}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{insight.message}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
