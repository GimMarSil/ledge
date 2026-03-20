"use client"

import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useDownload } from "@/hooks/use-download"
import { useProgress } from "@/hooks/use-progress"
import { Download, Loader2 } from "lucide-react"
import { useActionState } from "react"
import { restoreBackupAction } from "./actions"

export default function BackupSettingsPage() {
  const [restoreState, restoreBackup, restorePending] = useActionState(restoreBackupAction, null)

  const { isLoading, startProgress, progress } = useProgress({
    onError: (error) => {
    },
  })

  const { download, isDownloading } = useDownload({
    onError: (error) => {
    },
  })

  const handleDownload = async () => {
    try {
      const progressId = await startProgress("backup")
      const downloadUrl = `/settings/backups/data?progressId=${progressId || ""}`
      await download(downloadUrl, "ledge-backup.zip")
    } catch (error) {
    }
  }

  return (
    <div className="container flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Transferir cópia de segurança</h1>
        <div className="flex flex-row gap-4">
          <Button onClick={handleDownload} disabled={isLoading || isDownloading}>
            {isLoading ? (
              progress?.current ? (
                `A arquivar ${progress.current}/${progress.total} ficheiros`
              ) : (
                "A preparar cópia de segurança. Não feche a página..."
              )
            ) : isDownloading ? (
              "Arquivo criado. A transferir..."
            ) : (
              <>
                <Download className="mr-2" /> Transferir Arquivo de Dados
              </>
            )}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground max-w-xl">
          Dentro do arquivo encontrará todos os ficheiros carregados, bem como ficheiros JSON para transações, categorias,
          projetos, campos, moedas e definições. Pode visualizar, editar ou migrar os seus dados para outro serviço.
        </div>
      </div>

      <Card className="flex flex-col gap-2 mt-16 p-5 bg-red-100 max-w-xl">
        <h2 className="text-xl font-semibold">Restaurar de uma cópia de segurança</h2>
        <p className="text-sm text-muted-foreground">
          ⚠️ Esta ação é irreversível. Restaurar de uma cópia de segurança irá eliminar todos os dados existentes da sua
          base de dados atual e remover todos os ficheiros carregados. Tenha cuidado e faça uma cópia de segurança primeiro!
        </p>
        <form action={restoreBackup}>
          <div className="flex flex-col gap-4 pt-4">
            <label>
              <input type="file" name="file" required />
            </label>
            <label className="flex flex-row gap-2 items-center">
              <input type="checkbox" name="removeExistingData" required />
              <span className="text-red-500">Compreendo que isto irá eliminar permanentemente todos os dados existentes</span>
            </label>
            <Button type="submit" variant="destructive" disabled={restorePending}>
              {restorePending ? (
                <>
                  <Loader2 className="animate-spin" /> A restaurar cópia de segurança... (pode demorar)
                </>
              ) : (
                "Restaurar cópia de segurança"
              )}
            </Button>
          </div>
        </form>
        {restoreState?.error && <FormError>{restoreState.error}</FormError>}
      </Card>

      {restoreState?.success && (
        <Card className="flex flex-col gap-2 p-5 bg-green-100 max-w-xl">
          <h2 className="text-xl font-semibold">Cópia de segurança restaurada com sucesso</h2>
          <p className="text-sm text-muted-foreground">Pode continuar a usar a aplicação. Estatísticas da importação:</p>
          <ul className="list-disc list-inside">
            {Object.entries(restoreState.data?.counters || {}).map(([key, value]) => (
              <li key={key}>
                <span className="font-bold">{key}</span>: {value} itens
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
