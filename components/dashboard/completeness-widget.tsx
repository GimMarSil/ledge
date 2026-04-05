import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getCompletenessStats } from "@/models/stats"
import { TransactionFilters } from "@/models/transactions"
import { CheckCircle2, Flame, ShieldCheck, TrendingUp } from "lucide-react"

function ProgressBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[hsl(172,100%,39%)] transition-all duration-500"
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

export async function CompletenessWidget({ filters }: { filters: TransactionFilters }) {
  const user = await getCurrentUser()
  const stats = await getCompletenessStats(user.id, filters)

  if (stats.totalTransactions === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Carregue o primeiro documento para comecar a acompanhar a qualidade dos seus dados fiscais.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Qualidade dos Dados</CardTitle>
          <div className="flex items-center gap-2">
            {stats.monthlyStreak >= 3 && (
              <div className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                <Flame className="h-3.5 w-3.5" />
                {stats.monthlyStreak} meses
              </div>
            )}
            {stats.score === 100 && (
              <div className="flex items-center gap-1 text-xs font-medium text-[hsl(172,100%,39%)] bg-[hsl(172,100%,39%)]/10 px-2 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completo!
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score global</span>
            <span className="text-2xl font-bold tabular-nums text-[hsl(172,100%,39%)]">{stats.score}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(172,100%,39%)] to-[hsl(172,80%,28%)] transition-all duration-700"
              style={{ width: `${stats.score}%` }}
              role="progressbar"
              aria-valuenow={stats.score}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Individual metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProgressBar label="Com NIF" value={stats.withNif} max={stats.totalTransactions} />
          <ProgressBar label="Tipo documento" value={stats.withDocumentType} max={stats.totalTransactions} />
          <ProgressBar label="Com categoria" value={stats.withCategory} max={stats.totalTransactions} />
          <ProgressBar label="Com projeto" value={stats.withProject} max={stats.totalTransactions} />
          <ProgressBar label="Dados IVA" value={stats.withVatData} max={stats.totalTransactions} />
        </div>

        {stats.score < 80 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Carregue mais documentos com dados completos para melhorar o seu score fiscal.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
