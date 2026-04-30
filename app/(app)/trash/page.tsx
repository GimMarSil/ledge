import { ReclaimStorageButton } from "@/components/trash/reclaim-button"
import { TrashTable } from "@/components/trash/table"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { formatBytes } from "@/lib/utils"
import { getSettings } from "@/models/settings"
import { reclaimStorage } from "@/models/storage"
import { getUserById } from "@/models/users"
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
  // delete on this visit. After the DB delete we walk the files
  // directory and drop any rows/disk files no live transaction
  // references, then refresh the storage counter so the profile gauge
  // reflects what just freed up.
  await purgeExpiredTrash(user.id, retentionDays)
  await reclaimStorage(user.id)

  const [deleted, refreshedUser] = await Promise.all([
    getDeletedTransactions(user.id),
    getUserById(user.id),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
        </div>
        <div className="text-xs text-muted-foreground text-right shrink-0">
          <div>Armazenamento usado</div>
          <div className="font-semibold">{formatBytes(refreshedUser?.storageUsed ?? 0)}</div>
          <ReclaimStorageButton />
        </div>
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
