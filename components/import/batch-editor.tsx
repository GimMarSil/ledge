"use client"

import { bulkEditBatchAction, deleteBatchAction } from "@/app/(app)/import/e-fatura/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Category, Project, Transaction, TreasuryAccount } from "@/prisma/client"
import { Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type BatchSummary = {
  id: string
  filename: string | null
  createdAt: Date
  importedCount: number
  skippedCount: number
}

export function BatchEditor({
  batch,
  transactions,
  categories,
  projects,
  treasuryAccounts,
}: {
  batch: BatchSummary
  transactions: Transaction[]
  categories: Category[]
  projects: Project[]
  treasuryAccounts: TreasuryAccount[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const [patch, setPatch] = useState({
    categoryCode: "",
    projectCode: "",
    treasuryAccountCode: "",
    description: "",
    note: "",
  })
  const [feedback, setFeedback] = useState<string>("")

  const allSelected = selected.size === transactions.length && transactions.length > 0

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(transactions.map((t) => t.id)))
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const apply = () => {
    setFeedback("")
    startTransition(async () => {
      const ids = selected.size > 0 ? Array.from(selected) : undefined
      const cleanPatch = Object.fromEntries(
        Object.entries(patch).filter(([, v]) => v !== "")
      )
      if (Object.keys(cleanPatch).length === 0) {
        setFeedback("Nada para atualizar — preencha pelo menos um campo.")
        return
      }
      const result = await bulkEditBatchAction(batch.id, cleanPatch, ids)
      if (result.success) {
        setFeedback(`${result.count} transação(ões) atualizada(s).`)
        setSelected(new Set())
        router.refresh()
      } else {
        setFeedback(result.error ?? "Falhou")
      }
    })
  }

  const removeBatch = () => {
    if (
      !confirm(
        `Apagar o lote "${batch.filename}" e todas as ${batch.importedCount} transações criadas? Esta acção é irreversível.`
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await deleteBatchAction(batch.id)
      if (result.success) {
        router.push("/import/e-fatura")
      } else {
        setFeedback(result.error ?? "Falhou ao apagar")
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 w-full">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{batch.filename ?? "Lote sem nome"}</h2>
          <p className="text-xs text-muted-foreground">
            Importado em {new Date(batch.createdAt).toLocaleString("pt-PT")} ·{" "}
            {batch.importedCount} criadas · {batch.skippedCount} ignoradas
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/import/e-fatura">← Voltar</Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={removeBatch}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Apagar lote
          </Button>
        </div>
      </header>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Atribuir em massa</h3>
        <p className="text-xs text-muted-foreground">
          {selected.size > 0
            ? `Aplica às ${selected.size} transações selecionadas.`
            : "Sem seleção: aplica a TODAS as transações deste lote."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex flex-col text-xs">
            <span className="text-muted-foreground mb-1">Categoria</span>
            <select
              value={patch.categoryCode}
              onChange={(e) => setPatch((p) => ({ ...p, categoryCode: e.target.value }))}
              className="px-2 py-1.5 rounded-md border bg-background"
            >
              <option value="">— Sem alteração —</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs">
            <span className="text-muted-foreground mb-1">Projeto</span>
            <select
              value={patch.projectCode}
              onChange={(e) => setPatch((p) => ({ ...p, projectCode: e.target.value }))}
              className="px-2 py-1.5 rounded-md border bg-background"
            >
              <option value="">— Sem alteração —</option>
              {projects.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs">
            <span className="text-muted-foreground mb-1">Conta de Tesouraria</span>
            <select
              value={patch.treasuryAccountCode}
              onChange={(e) =>
                setPatch((p) => ({ ...p, treasuryAccountCode: e.target.value }))
              }
              className="px-2 py-1.5 rounded-md border bg-background"
            >
              <option value="">— Sem alteração —</option>
              {treasuryAccounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs md:col-span-2">
            <span className="text-muted-foreground mb-1">Descrição (substitui)</span>
            <input
              value={patch.description}
              onChange={(e) => setPatch((p) => ({ ...p, description: e.target.value }))}
              className="px-2 py-1.5 rounded-md border bg-background"
              placeholder="— Sem alteração —"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="text-muted-foreground mb-1">Notas (substitui)</span>
            <input
              value={patch.note}
              onChange={(e) => setPatch((p) => ({ ...p, note: e.target.value }))}
              className="px-2 py-1.5 rounded-md border bg-background"
              placeholder="— Sem alteração —"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" disabled={pending} onClick={apply}>
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Aplicar
          </Button>
          {feedback && <span className="text-xs text-muted-foreground">{feedback}</span>}
        </div>
      </Card>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Selecionar tudo"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Base</TableHead>
              <TableHead className="text-right">IVA</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} data-selected={selected.has(tx.id)}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${tx.merchant}`}
                    checked={selected.has(tx.id)}
                    onChange={() => toggleOne(tx.id)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {tx.issuedAt ? new Date(tx.issuedAt).toLocaleDateString("pt-PT") : "—"}
                </TableCell>
                <TableCell className="max-w-[18rem] truncate">
                  <Link href={`/transactions/${tx.id}`} className="hover:underline">
                    {tx.merchant ?? "—"}
                  </Link>
                  <div className="text-xs text-muted-foreground">NIF {tx.nif ?? "—"}</div>
                </TableCell>
                <TableCell className="text-xs">
                  {[tx.documentType, tx.documentNumber].filter(Boolean).join(" ")}
                </TableCell>
                <TableCell className="text-xs">{tx.categoryCode ?? "—"}</TableCell>
                <TableCell className="text-xs">{tx.projectCode ?? "—"}</TableCell>
                <TableCell className="text-xs">{tx.treasuryAccountCode ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums text-xs">
                  {tx.subtotal != null ? formatCurrency(tx.subtotal, tx.currencyCode || "EUR") : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-xs">
                  {tx.vatAmount != null ? formatCurrency(tx.vatAmount, tx.currencyCode || "EUR") : "—"}
                  {tx.vatRate != null && (
                    <span className="block text-[10px] text-muted-foreground">{Number(tx.vatRate)}%</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(tx.total ?? 0, tx.currencyCode || "EUR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
