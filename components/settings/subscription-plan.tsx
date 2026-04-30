import { User } from "@/prisma/client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import config from "@/lib/config"
import { PLANS } from "@/lib/stripe"
import { formatBytes, formatNumber } from "@/lib/utils"
import { formatDate } from "date-fns"
import { BrainCog, CalendarSync, ExternalLink, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

function UsageBar({
  icon: Icon,
  label,
  used,
  total,
  formatUsed,
  formatTotal,
  note,
}: {
  icon: React.ElementType
  label: string
  used: number
  total: number
  formatUsed: string
  formatTotal: string
  note?: string
}) {
  const isUnlimited = total < 0
  const percentage = isUnlimited ? 0 : total > 0 ? Math.min((used / total) * 100, 100) : 0
  const isHigh = percentage >= 80
  const isCritical = percentage >= 95

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatUsed} / {isUnlimited ? "Ilimitado" : formatTotal}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn(
            "h-2",
            isCritical && "[&>div]:bg-red-500",
            isHigh && !isCritical && "[&>div]:bg-amber-500"
          )}
        />
      )}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

export function SubscriptionPlan({ user }: { user: User }) {
  const plan = PLANS[user.membershipPlan as keyof typeof PLANS] || PLANS.unlimited
  // Land on the ControlHub home so the existing session/SSO flow can
  // forward to the right tenant page. /app/contracts on a fresh browser
  // bounces through /login which currently throws an unhandled error.
  const contractsUrl = `${config.buildflow.controlHubUrl}/`

  const storageUsed = user.storageUsed
  const storageTotal = user.storageLimit
  const aiUsed = plan.limits.ai > 0 ? plan.limits.ai - user.aiBalance : 0
  const aiTotal = plan.limits.ai

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Plano Actual</CardTitle>
            <CardDescription>Plano contratado pela sua empresa</CardDescription>
          </div>
          <Badge variant="outline">{plan.name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {plan.price && (
          <div>
            <p className="text-sm text-muted-foreground">Preço</p>
            <p className="text-lg font-semibold">{plan.price}</p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Utilização</p>

          <UsageBar
            icon={HardDrive}
            label="Armazenamento"
            used={storageUsed}
            total={storageTotal}
            formatUsed={formatBytes(storageUsed)}
            formatTotal={formatBytes(storageTotal)}
            note="Acumulado (total de ficheiros armazenados)"
          />

          <UsageBar
            icon={BrainCog}
            label="Análises IA"
            used={aiUsed}
            total={aiTotal}
            formatUsed={formatNumber(aiUsed)}
            formatTotal={formatNumber(aiTotal)}
            note="Reinicia mensalmente com a renovação do plano"
          />

          <div className="flex items-center gap-2 pt-1">
            <CalendarSync className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">Expira a:</span>{" "}
              {user.membershipExpiresAt ? formatDate(user.membershipExpiresAt, "dd/MM/yyyy") : "Sem expiração"}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" asChild className="w-full">
            <a href={contractsUrl} target="_blank" rel="noopener noreferrer">
              Gerir Plano no ControlHub
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
