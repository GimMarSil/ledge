import { ExportTransactionsDialog } from "@/components/export/transactions"
import { UploadButton } from "@/components/files/upload-button"
import { TransactionSearchAndFilters } from "@/components/transactions/filters"
import { TransactionList } from "@/components/transactions/list"
import { NewTransactionDialog } from "@/components/transactions/new"
import { Pagination } from "@/components/transactions/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getCategories } from "@/models/categories"
import { getFields } from "@/models/fields"
import { getProjects } from "@/models/projects"
import { getTransactions, TransactionFilters } from "@/models/transactions"
import { Download, FileUp, Layers, Plus } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Transações",
  description: "Gerir as suas transações",
}

const TRANSACTIONS_PER_PAGE = 500

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<TransactionFilters> }) {
  const { page, ...filters } = await searchParams
  const user = await getCurrentUser()
  const { transactions, total } = await getTransactions(user.id, filters, {
    limit: TRANSACTIONS_PER_PAGE,
    offset: ((page ?? 1) - 1) * TRANSACTIONS_PER_PAGE,
  })
  const categories = await getCategories(user.id)
  const projects = await getProjects(user.id)
  const fields = await getFields(user.id)
  // Surface recent import batches so the user can jump back to the
  // bulk-edit toolbar instead of trying to find it on this page.
  const recentBatches = await prisma.importBatch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

  if (page && page > 1 && transactions.length === 0) {
    const params = new URLSearchParams(filters as Record<string, string>)
    redirect(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-[1400px] mx-auto animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Transações</h2>
          <Badge variant="secondary" className="text-sm tabular-nums">{total}</Badge>
        </div>
        <div className="flex gap-2">
          <ExportTransactionsDialog fields={fields} categories={categories} projects={projects} total={total}>
            <Download className="h-4 w-4" /> <span className="hidden md:block">Exportar</span>
          </ExportTransactionsDialog>
          <NewTransactionDialog>
            <Button>
              <Plus className="h-4 w-4" /> <span className="hidden md:block">Nova Transação</span>
            </Button>
          </NewTransactionDialog>
        </div>
      </header>

      {recentBatches.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-md border border-blue-200 bg-blue-50/50 text-sm">
          <Layers className="h-4 w-4 text-blue-700 shrink-0" />
          <span className="text-blue-900 mr-auto">
            Tem {recentBatches.length} lote(s) de importação recentes. Use a página
            do lote para classificação em massa.
          </span>
          <div className="flex gap-2 flex-wrap">
            {recentBatches.map((b) => (
              <Link
                key={b.id}
                href={`/import/e-fatura/${b.id}`}
                className="text-xs px-2 py-1 rounded-md border bg-background hover:bg-muted whitespace-nowrap"
              >
                {b.filename ?? "lote"} ({b.importedCount})
              </Link>
            ))}
          </div>
        </div>
      )}

      <TransactionSearchAndFilters categories={categories} projects={projects} fields={fields} />

      <main>
        <TransactionList transactions={transactions} fields={fields} />

        {total > TRANSACTIONS_PER_PAGE && <Pagination totalItems={total} itemsPerPage={TRANSACTIONS_PER_PAGE} />}

        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 h-full min-h-[400px] rounded-xl border border-dashed bg-muted/30">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
              <FileUp className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">Sem transações</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comece por carregar uma fatura ou criar manualmente
              </p>
            </div>
            <div className="flex flex-row gap-3 mt-2">
              <UploadButton>
                <FileUp className="h-4 w-4" /> Analisar Fatura
              </UploadButton>
              <NewTransactionDialog>
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                  Adicionar Manualmente
                </Button>
              </NewTransactionDialog>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
