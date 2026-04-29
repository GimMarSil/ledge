import { ReimbursementsTable } from "@/components/reimbursements/table"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { getReimbursableTransactions, ReimbursementStatus } from "@/models/reimbursements"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reembolsos",
  description: "Despesas pagas por colaboradores à espera de reembolso",
}

type SearchParams = {
  dateFrom?: string
  dateTo?: string
  status?: ReimbursementStatus | "all"
}

export default async function ReimbursementsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await getCurrentUser()
  const { dateFrom, dateTo, status } = await searchParams
  const summary = await getReimbursableTransactions(user.id, { dateFrom, dateTo, status })

  const fmt = (cents: number) => formatCurrency(cents, "EUR")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-3xl font-bold tracking-tight">Reembolsos</h2>
        <a
          href={`/reimbursements/export?status=${status ?? "approved"}${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}`}
          className="text-sm px-3 py-1.5 rounded-md border bg-background hover:bg-muted"
        >
          Exportar CSV
        </a>
      </header>

      <p className="text-sm text-muted-foreground max-w-prose">
        Despesas pagas por contas de tesouraria do tipo <strong>pessoal</strong> (do bolso do
        colaborador) que aguardam aprovação e pagamento. Filtre por período e estado, depois
        aprove ou marque como pagas em lote.
      </p>

      <form className="flex flex-wrap items-end gap-3 p-4 rounded-md border bg-muted/30">
        <label className="flex flex-col text-xs">
          <span className="text-muted-foreground mb-1">De</span>
          <input
            type="date"
            name="dateFrom"
            defaultValue={dateFrom}
            className="px-3 py-1.5 rounded-md border bg-background"
          />
        </label>
        <label className="flex flex-col text-xs">
          <span className="text-muted-foreground mb-1">Até</span>
          <input
            type="date"
            name="dateTo"
            defaultValue={dateTo}
            className="px-3 py-1.5 rounded-md border bg-background"
          />
        </label>
        <label className="flex flex-col text-xs">
          <span className="text-muted-foreground mb-1">Estado</span>
          <select name="status" defaultValue={status ?? "all"} className="px-3 py-1.5 rounded-md border bg-background">
            <option value="all">Todos</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="paid">Pago</option>
            <option value="rejected">Rejeitado</option>
          </select>
        </label>
        <button type="submit" className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm">
          Filtrar
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-xl font-semibold">{fmt(summary.totalAmount)}</div>
          <div className="text-xs text-muted-foreground">{summary.totalCount} despesas</div>
        </Card>
        <Card className="p-4 border-amber-200 bg-amber-50/40">
          <div className="text-xs text-muted-foreground">Pendentes</div>
          <div className="text-xl font-semibold">{fmt(summary.byStatus.pending.amount)}</div>
          <div className="text-xs text-muted-foreground">{summary.byStatus.pending.count}</div>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50/40">
          <div className="text-xs text-muted-foreground">Aprovadas</div>
          <div className="text-xl font-semibold">{fmt(summary.byStatus.approved.amount)}</div>
          <div className="text-xs text-muted-foreground">{summary.byStatus.approved.count}</div>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/40">
          <div className="text-xs text-muted-foreground">Pagas</div>
          <div className="text-xl font-semibold">{fmt(summary.byStatus.paid.amount)}</div>
          <div className="text-xs text-muted-foreground">{summary.byStatus.paid.count}</div>
        </Card>
        <Card className="p-4 border-rose-200 bg-rose-50/40">
          <div className="text-xs text-muted-foreground">Rejeitadas</div>
          <div className="text-xl font-semibold">{fmt(summary.byStatus.rejected.amount)}</div>
          <div className="text-xs text-muted-foreground">{summary.byStatus.rejected.count}</div>
        </Card>
      </div>

      <ReimbursementsTable transactions={summary.transactions} />
    </div>
  )
}
