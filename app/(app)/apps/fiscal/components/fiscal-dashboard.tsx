"use client"

import { formatCurrency } from "@/lib/utils"
import { getDeductibilityRate } from "@/lib/fiscal/deductibility"
import { SAFTExportDialog } from "@/components/export/saft-export"

interface TransactionWithCategory {
  id: string
  type: string | null
  total: number | null
  subtotal: number | null
  vatAmount: number | null
  vatRate: number | null
  vatBreakdown: any
  documentType: string | null
  nif: string | null
  fiscalStatus: string | null
  issuedAt: Date | null
  category: { code: string; name: string } | null
}

interface FiscalDashboardProps {
  transactions: TransactionWithCategory[]
  year: number
}

interface VATSummary {
  rate: number
  baseTotal: number // cêntimos
  vatCollected: number // cêntimos (faturas emitidas)
  vatDeductible: number // cêntimos (despesas)
}

export function FiscalDashboard({ transactions, year }: FiscalDashboardProps) {
  // Separar faturas emitidas (income) vs despesas (expense)
  const incomeTransactions = transactions.filter((t) => t.type === "income")
  const expenseTransactions = transactions.filter((t) => t.type === "expense")

  // Calcular IVA liquidado (das faturas emitidas)
  const vatCollectedByRate = aggregateVAT(incomeTransactions)

  // Calcular IVA dedutível (das despesas)
  const vatDeductibleByRate = aggregateVATDeductible(expenseTransactions)

  // Combinar em resumo
  const allRates = new Set([...vatCollectedByRate.keys(), ...vatDeductibleByRate.keys()])
  const vatSummary: VATSummary[] = Array.from(allRates)
    .sort((a, b) => b - a)
    .map((rate) => ({
      rate,
      baseTotal:
        (vatCollectedByRate.get(rate)?.base || 0) + (vatDeductibleByRate.get(rate)?.base || 0),
      vatCollected: vatCollectedByRate.get(rate)?.vat || 0,
      vatDeductible: vatDeductibleByRate.get(rate)?.vat || 0,
    }))

  const totalVatCollected = vatSummary.reduce((sum, v) => sum + v.vatCollected, 0)
  const totalVatDeductible = vatSummary.reduce((sum, v) => sum + v.vatDeductible, 0)
  const vatBalance = totalVatCollected - totalVatDeductible

  // Documentos sem NIF
  const missingNifCount = transactions.filter(
    (t) => t.type === "expense" && !t.nif && (t.total || 0) > 0
  ).length

  // Documentos sem tipo fiscal
  const missingDocTypeCount = transactions.filter((t) => !t.documentType).length

  // Total receitas e despesas
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.total || 0), 0)
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (t.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Receitas"
          value={formatCurrency(totalIncome, "EUR")}
          subtitle={`${incomeTransactions.length} documentos`}
          color="text-green-600"
        />
        <MetricCard
          title="Despesas"
          value={formatCurrency(totalExpenses, "EUR")}
          subtitle={`${expenseTransactions.length} documentos`}
          color="text-red-600"
        />
        <MetricCard
          title="IVA Liquidado"
          value={formatCurrency(totalVatCollected, "EUR")}
          subtitle="Faturas emitidas"
          color="text-blue-600"
        />
        <MetricCard
          title="IVA Dedutível"
          value={formatCurrency(totalVatDeductible, "EUR")}
          subtitle="Despesas dedutíveis"
          color="text-purple-600"
        />
      </div>

      {/* Saldo IVA */}
      <div className="rounded-lg border p-6 bg-card">
        <h2 className="text-xl font-bold mb-4">Saldo IVA — {year}</h2>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">
            <span className={vatBalance >= 0 ? "text-red-600" : "text-green-600"}>
              {formatCurrency(Math.abs(vatBalance), "EUR")}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {vatBalance >= 0 ? "A pagar ao Estado" : "A recuperar do Estado"}
          </div>
        </div>
      </div>

      {/* Tabela IVA por taxa */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Desdobramento IVA por Taxa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium">Taxa</th>
                <th className="px-6 py-3 text-right font-medium">IVA Liquidado</th>
                <th className="px-6 py-3 text-right font-medium">IVA Dedutível</th>
                <th className="px-6 py-3 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {vatSummary.map((row) => (
                <tr key={row.rate} className="border-b">
                  <td className="px-6 py-3 font-medium">{row.rate}%</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(row.vatCollected, "EUR")}</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(row.vatDeductible, "EUR")}</td>
                  <td className="px-6 py-3 text-right font-medium">
                    {formatCurrency(row.vatCollected - row.vatDeductible, "EUR")}
                  </td>
                </tr>
              ))}
              {vatSummary.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Sem dados de IVA para este período
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="px-6 py-3">Total</td>
                <td className="px-6 py-3 text-right">{formatCurrency(totalVatCollected, "EUR")}</td>
                <td className="px-6 py-3 text-right">{formatCurrency(totalVatDeductible, "EUR")}</td>
                <td className="px-6 py-3 text-right">{formatCurrency(vatBalance, "EUR")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Alertas */}
      {(missingNifCount > 0 || missingDocTypeCount > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-3">Alertas Fiscais</h2>
          <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
            {missingNifCount > 0 && (
              <li>
                {missingNifCount} despesa{missingNifCount > 1 ? "s" : ""} sem NIF do fornecedor
              </li>
            )}
            {missingDocTypeCount > 0 && (
              <li>
                {missingDocTypeCount} transaç{missingDocTypeCount > 1 ? "ões" : "ão"} sem tipo de documento fiscal
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <SAFTExportDialog />
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string
  value: string
  subtitle: string
  color: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </div>
  )
}

function aggregateVAT(transactions: TransactionWithCategory[]): Map<number, { base: number; vat: number }> {
  const map = new Map<number, { base: number; vat: number }>()

  for (const tx of transactions) {
    if (tx.vatBreakdown && Array.isArray(tx.vatBreakdown)) {
      for (const entry of tx.vatBreakdown as { rate: number; base: number; vat: number }[]) {
        const existing = map.get(entry.rate) || { base: 0, vat: 0 }
        existing.base += Math.round(entry.base * 100)
        existing.vat += Math.round(entry.vat * 100)
        map.set(entry.rate, existing)
      }
    } else if (tx.vatAmount && tx.vatRate) {
      const rate = Number(tx.vatRate)
      const existing = map.get(rate) || { base: 0, vat: 0 }
      existing.base += (tx.subtotal || 0)
      existing.vat += tx.vatAmount
      map.set(rate, existing)
    }
  }

  return map
}

function aggregateVATDeductible(
  transactions: TransactionWithCategory[]
): Map<number, { base: number; vat: number }> {
  const map = new Map<number, { base: number; vat: number }>()

  for (const tx of transactions) {
    const categoryCode = tx.category?.code || "outros"
    const deductRate = getDeductibilityRate(categoryCode)

    if (tx.vatBreakdown && Array.isArray(tx.vatBreakdown)) {
      for (const entry of tx.vatBreakdown as { rate: number; base: number; vat: number }[]) {
        const existing = map.get(entry.rate) || { base: 0, vat: 0 }
        existing.base += Math.round(entry.base * 100)
        existing.vat += Math.round(entry.vat * 100 * deductRate)
        map.set(entry.rate, existing)
      }
    } else if (tx.vatAmount && tx.vatRate) {
      const rate = Number(tx.vatRate)
      const existing = map.get(rate) || { base: 0, vat: 0 }
      existing.base += (tx.subtotal || 0)
      existing.vat += Math.round(tx.vatAmount * deductRate)
      map.set(rate, existing)
    }
  }

  return map
}
