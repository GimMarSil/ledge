import { EFaturaImportForm } from "@/components/import/e-fatura-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ArrowRight, ExternalLink } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Importar e-Fatura",
}

export default async function EFaturaImportPage() {
  const user = await getCurrentUser()
  const batches = await prisma.importBatch.findMany({
    where: { userId: user.id, source: "e-fatura" },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full max-w-5xl">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Importar e-Fatura</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-prose">
          Cada linha do CSV exportado pelo Portal das Finanças torna-se uma transação
          com NIF, número de documento, ATCUD, total, IVA e base tributável já
          preenchidos. Reimportar o mesmo período é seguro — linhas já em sistema
          são ignoradas (deduplicação por NIF + Nº documento).
        </p>
      </header>

      <Card className="p-5 space-y-3 bg-muted/30">
        <h3 className="font-semibold">Como obter o ficheiro</h3>
        <ol className="list-decimal list-inside text-sm space-y-1.5 max-w-prose">
          <li>
            Aceda a{" "}
            <a
              href="https://faturas.portaldasfinancas.gov.pt"
              target="_blank"
              rel="noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              faturas.portaldasfinancas.gov.pt <ExternalLink className="h-3 w-3" />
            </a>{" "}
            e clique em <strong>Entrar</strong>.
          </li>
          <li>Autentique-se com NIF + senha das Finanças ou Chave Móvel Digital.</li>
          <li>
            Na secção <strong>Faturação</strong>, clique na caixa{" "}
            <strong>Adquirente</strong> (faturas onde aparece como cliente).
          </li>
          <li>Selecione o ano e o trimestre/mês a importar.</li>
          <li>
            No final da página, escolha <strong>Exportar → CSV</strong>. Carregue
            esse ficheiro abaixo.
          </li>
        </ol>
      </Card>

      <EFaturaImportForm />

      {batches.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold">Importações anteriores</h3>
          <div className="rounded-md border divide-y">
            {batches.map((b) => (
              <Link
                key={b.id}
                href={`/import/e-fatura/${b.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{b.filename ?? "(sem nome)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(b.createdAt).toLocaleString("pt-PT")} · {b.importedCount} importadas ·{" "}
                    {b.skippedCount} ignoradas
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <span>
                    Abrir <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </Button>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
