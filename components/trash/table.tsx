"use client"

import {
  bulkHardDeleteAction,
  bulkRestoreAction,
  hardDeleteTransactionAction,
  restoreTransactionAction,
} from "@/app/(app)/trash/actions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Transaction } from "@/prisma/client"
import { Loader2, RotateCcw, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

export function TrashTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
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

  const restore = (ids: string[]) => {
    startTransition(async () => {
      if (ids.length === 1) await restoreTransactionAction(ids[0])
      else await bulkRestoreAction(ids)
      setSelected(new Set())
      router.refresh()
    })
  }

  const hardDelete = (ids: string[]) => {
    if (
      !confirm(
        `Apagar definitivamente ${ids.length} transação(ões)? Esta acção é irreversível e remove também os ficheiros anexados que não estejam noutras transações.`
      )
    ) {
      return
    }
    startTransition(async () => {
      if (ids.length === 1) await hardDeleteTransactionAction(ids[0])
      else await bulkHardDeleteAction(ids)
      setSelected(new Set())
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{selected.size} selecionada(s)</span>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!selected.size || pending}
            onClick={() => restore(Array.from(selected))}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Restaurar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!selected.size || pending}
            onClick={() => hardDelete(Array.from(selected))}
          >
            <Trash2 className="h-4 w-4" />
            Apagar definitivamente
          </Button>
        </div>
      </div>

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
              <TableHead>Apagada em</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right w-32">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} data-selected={selected.has(tx.id)}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${tx.merchant ?? tx.id}`}
                    checked={selected.has(tx.id)}
                    onChange={() => toggleOne(tx.id)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {tx.deletedAt ? new Date(tx.deletedAt).toLocaleString("pt-PT") : "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {tx.issuedAt ? new Date(tx.issuedAt).toLocaleDateString("pt-PT") : "—"}
                </TableCell>
                <TableCell className="max-w-xs truncate">{tx.merchant ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  {[tx.documentType, tx.documentNumber].filter(Boolean).join(" ")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(tx.total ?? 0, tx.currencyCode || "EUR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Restaurar"
                      disabled={pending}
                      onClick={() => restore([tx.id])}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Apagar definitivamente"
                      disabled={pending}
                      onClick={() => hardDelete([tx.id])}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
