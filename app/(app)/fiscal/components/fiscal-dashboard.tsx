"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { getDeductibilityRate } from "@/lib/fiscal/deductibility"
import { SAFTExportDialog } from "@/components/export/saft-export"
import {
  BusinessRegime,
  FiscalDeadlineInstance,
  getUpcomingDeadlines,
  getOverdueDeadlines,
} from "@/lib/fiscal/calendar"
import { ATNewsItem, ATServiceLink } from "@/lib/fiscal/at-portal"
import { FiscalHeader } from "./fiscal-header"
import { FiscalCalendarWidget } from "./fiscal-calendar-widget"
import { ATNewsWidget, ATServiceLinksWidget, RegimeConfigBanner } from "./at-integration-widget"
import { AlertTriangle } from "lucide-react"

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
  withholdingAmount: number | null
  category: { code: string; name: string } | null
}

interface FiscalDashboardProps {
  transactions: TransactionWithCategory[]
  year: number
  regime: BusinessRegime
  isRegimeConfigured: boolean
  upcomingDeadlines: FiscalDeadlineInstance[]
  overdueDeadlines: FiscalDeadlineInstance[]
  atNews: ATNewsItem[]
  atServiceLinks: ATServiceLink[]
}

interface VATSummary {
  rate: number
  baseTotal: number
  vatCollected: number
  vatDeductible: number
}

export function FiscalDashboard({
  transactions,
  year: initialYear,
  regime: initialRegime,
  isRegimeConfigured,
  upcomingDeadlines: initialUpcoming,
  overdueDeadlines: initialOverdue,
  atNews,
  atServiceLinks,
}: FiscalDashboardProps) {
  const [regime, setRegime] = useState<BusinessRegime>(initialRegime)
  const [year, setYear] = useState(initialYear)

  // Recalculate deadlines when regime/year changes (client-side)
  const isOriginal = regime === initialRegime && year === initialYear
  const upcomingDeadlines = isOriginal
    ? initialUpcoming
    : getUpcomingDeadlines(regime, year, new Date(), 15)
  const overdueDeadlines = isOriginal
    ? initialOverdue
    : getOverdueDeadlines(regime, year, new Date())

  // Separar faturas emitidas (income) vs despesas (expense)
  const incomeTransactions = transactions.filter((t) => t.type === "income")
  const expenseTransactions = transactions.filter((t) => t.type === "expense")

  // Calcular IVA liquidado (das faturas emitidas)
  const vatCollectedByRate = aggregateVAT(incomeTransactions)

  // Calcular IVA dedutivel (das despesas)
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

  // Retenções na fonte
  const totalWithholding = incomeTransactions.reduce((sum, t) => sum + (t.withholdingAmount || 0), 0)

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
      {/* Header com regime e ano */}
      <FiscalHeader
        regime={regime}
        year={year}
        onRegimeChange={setRegime}
        onYearChange={setYear}
      />

      {/* Banner de configuração (se regime não definido) */}
      <RegimeConfigBanner isConfigured={isRegimeConfigured} />

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Receitas"
          value={formatCurrency(totalIncome, "EUR")}
          subtitle={`${incomeTransactions.length} documentos`}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Despesas"
          value={formatCurrency(totalExpenses, "EUR")}
          subtitle={`${expenseTransactions.length} documentos`}
          color="text-red-600 dark:text-red-400"
        />
        <MetricCard
          title="IVA Liquidado"
          value={formatCurrency(totalVatCollected, "EUR")}
          subtitle="Faturas emitidas"
          color="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="IVA Dedutível"
          value={formatCurrency(totalVatDeductible, "EUR")}
          subtitle="Despesas dedutiveis"
          color="text-violet-600 dark:text-violet-400"
        />
        <MetricCard
          title="Retenções na Fonte"
          value={formatCurrency(totalWithholding, "EUR")}
          subtitle="Retidas sobre receitas"
          color="text-orange-600 dark:text-orange-400"
        />
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Saldo IVA — {year}</div>
          <div className={`text-2xl font-bold mt-1 ${vatBalance >= 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {formatCurrency(Math.abs(vatBalance), "EUR")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {vatBalance >= 0 ? "A pagar ao Estado" : "A recuperar do Estado"}
          </div>
        </div>
      </div>

      {/* Calendário Fiscal */}
      <FiscalCalendarWidget
        upcomingDeadlines={upcomingDeadlines}
        overdueDeadlines={overdueDeadlines}
        regime={regime}
        year={year}
      />

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
                  <td className="px-6 py-3 text-right tabular-nums">{formatCurrency(row.vatCollected, "EUR")}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{formatCurrency(row.vatDeductible, "EUR")}</td>
                  <td className="px-6 py-3 text-right font-medium tabular-nums">
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
                <td className="px-6 py-3 text-right tabular-nums">{formatCurrency(totalVatCollected, "EUR")}</td>
                <td className="px-6 py-3 text-right tabular-nums">{formatCurrency(totalVatDeductible, "EUR")}</td>
                <td className="px-6 py-3 text-right tabular-nums">{formatCurrency(vatBalance, "EUR")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Alertas */}
      {(missingNifCount > 0 || missingDocTypeCount > 0 || overdueDeadlines.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Fiscais
          </h2>
          <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
            {overdueDeadlines.length > 0 && (
              <li className="font-medium">
                {overdueDeadlines.length} obrigação{overdueDeadlines.length > 1 ? "ões" : ""} fiscal{overdueDeadlines.length > 1 ? "is" : ""} em atraso
              </li>
            )}
            {missingNifCount > 0 && (
              <li>
                {missingNifCount} despesa{missingNifCount > 1 ? "s" : ""} sem NIF do fornecedor
              </li>
            )}
            {missingDocTypeCount > 0 && (
              <li>
                {missingDocTypeCount} transação{missingDocTypeCount > 1 ? "ões" : ""} sem tipo de documento fiscal
              </li>
            )}
          </ul>
        </div>
      )}

      {/* AT: Notícias + Links de Serviços */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ATNewsWidget news={atNews} />
        <ATServiceLinksWidget links={atServiceLinks} regime={regime} />
      </div>

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
