import { formatCurrency, formatPeriodLabel } from "@/lib/utils"
import { DetailedTimeSeriesData } from "@/models/stats"

interface ChartTooltipProps {
  data: DetailedTimeSeriesData | null
  defaultCurrency: string
  position: { x: number; y: number }
  visible: boolean
  containerWidth?: number
}

export function IncomeExpenceGraphTooltip({ data, defaultCurrency, position, visible }: ChartTooltipProps) {
  if (!visible || !data) {
    return null
  }

  const incomeCategories = data.categories.filter((cat) => cat.income > 0)
  const expenseCategories = data.categories.filter((cat) => cat.expenses > 0)

  const tooltipWidth = 320
  const spaceToRight = window.innerWidth - position.x
  const showToRight = spaceToRight >= tooltipWidth + 20

  const horizontalOffset = showToRight ? 15 : -15
  const horizontalTransform = showToRight ? "0%" : "-100%"

  return (
    <div
      className="fixed z-50 bg-card border rounded-xl shadow-2xl p-4 max-w-xs pointer-events-none"
      style={{
        left: `${position.x + horizontalOffset}px`,
        top: `${position.y}px`,
        transform: `translate(${horizontalTransform}, -50%)`,
        width: "320px",
      }}
    >
      <div className="mb-3 pb-2 border-b">
        <h3 className="font-bold text-foreground text-sm">{formatPeriodLabel(data.period, data.date)}</h3>
        <p className="text-xs text-muted-foreground">
          {data.totalTransactions} transaç{data.totalTransactions !== 1 ? "ões" : "ão"}
        </p>
      </div>

      <div className="mb-3 space-y-1">
        {data.income > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Receitas:</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(data.income, defaultCurrency)}
            </span>
          </div>
        )}
        {data.expenses > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-red-600 dark:text-red-400">Despesas:</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
              {formatCurrency(data.expenses, defaultCurrency)}
            </span>
          </div>
        )}
      </div>

      {incomeCategories.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">
            Receitas por Categoria
          </h4>
          <div className="space-y-1">
            {incomeCategories.map((category) => (
              <div key={`income-${category.code}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="text-xs text-muted-foreground truncate">{category.name}</span>
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 ml-2 tabular-nums">
                  {formatCurrency(category.income, defaultCurrency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenseCategories.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wider">
            Despesas por Categoria
          </h4>
          <div className="space-y-1">
            {expenseCategories.map((category) => (
              <div key={`expense-${category.code}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="text-xs text-muted-foreground truncate">{category.name}</span>
                </div>
                <span className="text-xs font-medium text-red-600 dark:text-red-400 ml-2 tabular-nums">
                  {formatCurrency(category.expenses, defaultCurrency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
