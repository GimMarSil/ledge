import { PrintControls } from "@/components/reimbursements/print-controls"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { getReimbursableTransactions, ReimbursementStatus } from "@/models/reimbursements"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mapa de Reembolsos",
}

type SearchParams = {
  dateFrom?: string
  dateTo?: string
  status?: ReimbursementStatus | "all"
}

/**
 * Print-optimised summary of a reimbursement run. The intended workflow
 * is "open in browser → Ctrl+P → save as PDF" so we don't pull in a PDF
 * generator. @media print rules hide the back/print controls when
 * actually printed.
 */
export default async function ReimbursementsPrintPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await getCurrentUser()
  const { dateFrom, dateTo, status } = await searchParams
  const summary = await getReimbursableTransactions(user.id, { dateFrom, dateTo, status })

  const today = new Date().toLocaleDateString("pt-PT")
  const period =
    dateFrom || dateTo
      ? `${dateFrom ? new Date(dateFrom).toLocaleDateString("pt-PT") : "—"} a ${dateTo ? new Date(dateTo).toLocaleDateString("pt-PT") : "—"}`
      : "Todos"

  return (
    <div className="print:p-0 print:bg-white p-8 max-w-[210mm] mx-auto bg-white text-sm text-gray-900">
      <PrintControls />

      <header className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">Mapa de Reembolsos</h1>
        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
          <div>
            <div className="text-gray-500">Empresa</div>
            <div>{user.businessName || "—"}</div>
            {user.businessNif && <div>NIF: {user.businessNif}</div>}
          </div>
          <div className="text-right">
            <div className="text-gray-500">Emitido em</div>
            <div>{today}</div>
            <div className="text-gray-500 mt-2">Período</div>
            <div>{period}</div>
            <div className="text-gray-500 mt-2">Estado</div>
            <div>{status ?? "Todos"}</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-gray-500 text-xs">Funcionário</div>
          <div>{user.name}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </header>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Data</th>
            <th className="text-left py-2">Fornecedor</th>
            <th className="text-left py-2">Descrição</th>
            <th className="text-left py-2">Documento</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {summary.transactions.map((tx) => (
            <tr key={tx.id} className="border-b align-top">
              <td className="py-1.5">
                {tx.issuedAt ? new Date(tx.issuedAt).toLocaleDateString("pt-PT") : "—"}
              </td>
              <td className="py-1.5">{tx.merchant ?? "—"}</td>
              <td className="py-1.5">{tx.name ?? tx.description ?? ""}</td>
              <td className="py-1.5">
                {[tx.documentType, tx.documentSeries, tx.documentNumber].filter(Boolean).join(" ")}
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {formatCurrency(tx.total ?? 0, tx.currencyCode || "EUR")}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="pt-3 text-right font-medium">
              Total
            </td>
            <td className="pt-3 text-right font-bold tabular-nums">
              {formatCurrency(summary.totalAmount, "EUR")}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-2 gap-12 mt-16 text-xs">
        <div>
          <div className="border-t pt-2">Assinatura do Funcionário</div>
        </div>
        <div>
          <div className="border-t pt-2">Aprovado por (Tesouraria)</div>
        </div>
      </div>
    </div>
  )
}
