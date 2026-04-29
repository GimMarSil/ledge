"use client"

import { setReimbursementStatusAction } from "@/app/(app)/reimbursements/actions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { ReimbursementStatus } from "@/models/reimbursements"
import { Transaction } from "@/prisma/client"
import { Check, CheckCheck, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

const STATUS_LABELS: Record<ReimbursementStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Aprovado", className: "bg-blue-100 text-blue-800" },
  paid: { label: "Pago", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejeitado", className: "bg-rose-100 text-rose-800" },
}

export function ReimbursementsTable({ transactions }: { transactions: Transaction[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === transactions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(transactions.map((t) => t.id)))
    }
  }

  const apply = (status: ReimbursementStatus) => {
    if (!selected.size) return
    const ids = Array.from(selected)
    startTransition(async () => {
      const result = await setReimbursementStatusAction(ids, status)
      if (result.success) {
        setSelected(new Set())
      }
    })
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 border rounded-md">
        Sem despesas a reembolsar para este filtro.
      </div>
    )
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
            onClick={() => apply("approved")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Aprovar
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!selected.size || pending}
            onClick={() => apply("paid")}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar como pago
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!selected.size || pending}
            onClick={() => apply("rejected")}
          >
            <X className="h-4 w-4" />
            Rejeitar
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
                  checked={selected.size === transactions.length && transactions.length > 0}
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const status = (tx.reimbursementStatus as ReimbursementStatus) || "pending"
              const meta = STATUS_LABELS[status]
              return (
                <TableRow key={tx.id} data-selected={selected.has(tx.id)}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${tx.name ?? tx.id}`}
                      checked={selected.has(tx.id)}
                      onChange={() => toggle(tx.id)}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {tx.issuedAt ? new Date(tx.issuedAt).toLocaleDateString("pt-PT") : "—"}
                  </TableCell>
                  <TableCell>{tx.merchant ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    <Link href={`/transactions/${tx.id}`} className="hover:underline">
                      {tx.name ?? tx.description ?? "(sem descrição)"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(tx.total ?? 0, tx.currencyCode || "EUR")}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs ${meta.className}`}>{meta.label}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {tx.reimbursementPaidAt
                      ? new Date(tx.reimbursementPaidAt).toLocaleDateString("pt-PT")
                      : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
