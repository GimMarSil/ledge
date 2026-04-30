import { TrashTable } from "@/components/trash/table"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/models/settings"
import { getDeletedTransactions, purgeExpiredTrash } from "@/models/transactions"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Caixote do Lixo",
}

const DEFAULT_RETENTION_DAYS = 90

export default async function TrashPage() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)
  const retentionDays = parseInt(settings.trash_retention_days ?? "", 10) || DEFAULT_RETENTION_DAYS

  // Lazy purge — anything older than the retention window gets a real
  // delete on this visit. Cheap because we only touch the userId scope
  // and there's an index on deletedAt.
  await purgeExpiredTrash(user.id, retentionDays)

  const deleted = await getDeletedTransactions(user.id)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Caixote do Lixo</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-prose">
          As transações apagadas ficam aqui durante <strong>{retentionDays} dias</strong> antes
          de serem apagadas definitivamente. Pode restaurar ou apagar antes do tempo. Para
          ajustar o período de retenção, vai a{" "}
          <a href="/settings" className="underline">
            Definições
          </a>{" "}
          → "Retenção do caixote do lixo".
        </p>
      </header>

      {deleted.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Caixote do lixo vazio.
        </Card>
      ) : (
        <TrashTable transactions={deleted} />
      )}
    </div>
  )
}
