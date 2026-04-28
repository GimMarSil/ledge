"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2, AlertTriangle, RefreshCw } from "lucide-react"

export type EditableItem = {
  name?: string
  description?: string
  total?: number
  currencyCode?: string
  vat_rate?: number | string
  vat_amount?: number | string
  // The shape from the LLM is loose; we keep extras around so a save
  // doesn't accidentally drop fields the model emitted.
  [key: string]: unknown
}

const PT_VAT_RATES = [0, 6, 13, 23]

export function EditableItemsTable({
  items,
  currencyCode = "EUR",
  headerTotal,
  onChange,
  onApplyToHeader,
}: {
  items: EditableItem[]
  currencyCode?: string
  /** header total in cents; null/0 = unset */
  headerTotal?: number | null
  onChange: (items: EditableItem[]) => void
  /**
   * Called when the user clicks "Aplicar ao cabeçalho" — receives the
   * recomputed totals so the parent form can sync header fields.
   */
  onApplyToHeader: (totals: {
    total: number // cents
    subtotal: number // cents
    vatAmount: number // cents
    vatBreakdown: Array<{ rate: number; base: number; vat: number }>
  }) => void
}) {
  const updateItem = (index: number, patch: Partial<EditableItem>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it))
    onChange(next)
  }

  const addItem = () => {
    onChange([
      ...items,
      { name: "", description: "", total: 0, currencyCode, vat_rate: 23, vat_amount: 0 },
    ])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  // ── Aggregations ────────────────────────────────────────────────────────
  const itemsTotalEur = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0)
  const itemsTotalCents = Math.round(itemsTotalEur * 100)
  const headerTotalCents = headerTotal ?? 0
  const delta = itemsTotalCents - headerTotalCents
  const hasMismatch = headerTotalCents > 0 && Math.abs(delta) > 1

  const vatGroups = aggregateByRate(items)

  const totals = {
    total: itemsTotalCents,
    subtotal: vatGroups.reduce((s, g) => s + g.baseCents, 0),
    vatAmount: vatGroups.reduce((s, g) => s + g.vatCents, 0),
    vatBreakdown: vatGroups.map((g) => ({
      rate: g.rate,
      base: g.baseCents / 100,
      vat: g.vatCents / 100,
    })),
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Editable rows ────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="text-left py-1.5 font-medium">Descrição</th>
              <th className="text-right py-1.5 font-medium w-24">Total</th>
              <th className="text-right py-1.5 font-medium w-20">IVA %</th>
              <th className="text-right py-1.5 font-medium w-24">IVA</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const total = Number(item.total) || 0
              const rate = Number(item.vat_rate)
              const computedVat =
                Number.isFinite(rate) && rate > 0 ? round2((total * rate) / (100 + rate)) : 0
              const vatAmount =
                item.vat_amount === undefined || item.vat_amount === ""
                  ? computedVat
                  : Number(item.vat_amount)

              return (
                <tr key={i} className="border-b last:border-b-0 align-top">
                  <td className="py-1.5 pr-2">
                    <Input
                      value={String(item.name ?? "")}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder="Designação"
                      className="h-8"
                    />
                    {(item.description != null && item.description !== "") || true ? (
                      <Input
                        value={String(item.description ?? "")}
                        onChange={(e) => updateItem(i, { description: e.target.value })}
                        placeholder="Descrição (opcional)"
                        className="h-7 mt-1 text-xs"
                      />
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={total === 0 && item.total === undefined ? "" : String(item.total ?? "")}
                      onChange={(e) =>
                        updateItem(i, { total: e.target.value === "" ? undefined : parseFloat(e.target.value) })
                      }
                      className="h-8 text-right"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={String(rate ?? 23)}
                      onChange={(e) => updateItem(i, { vat_rate: parseFloat(e.target.value) })}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {PT_VAT_RATES.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 pr-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={String(vatAmount)}
                      onChange={(e) =>
                        updateItem(i, {
                          vat_amount: e.target.value === "" ? undefined : parseFloat(e.target.value),
                        })
                      }
                      className="h-8 text-right"
                    />
                  </td>
                  <td className="py-1.5">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addItem} className="self-start">
        <Plus className="h-4 w-4 mr-1" />
        Adicionar linha
      </Button>

      {/* ── VAT regime summary ───────────────────────────────────────────── */}
      {vatGroups.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Resumo de IVA por taxa</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left py-1 font-medium">Taxa</th>
                <th className="text-right py-1 font-medium">Base</th>
                <th className="text-right py-1 font-medium">IVA</th>
                <th className="text-right py-1 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {vatGroups.map((g) => (
                <tr key={g.rate} className="border-b border-dashed last:border-solid">
                  <td className="py-1 font-medium">{g.rate}%</td>
                  <td className="py-1 text-right">{formatCurrency(g.baseCents, currencyCode)}</td>
                  <td className="py-1 text-right">{formatCurrency(g.vatCents, currencyCode)}</td>
                  <td className="py-1 text-right">{formatCurrency(g.baseCents + g.vatCents, currencyCode)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-1">Total</td>
                <td className="py-1 text-right">{formatCurrency(totals.subtotal, currencyCode)}</td>
                <td className="py-1 text-right">{formatCurrency(totals.vatAmount, currencyCode)}</td>
                <td className="py-1 text-right">{formatCurrency(totals.total, currencyCode)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Header consistency check ────────────────────────────────────── */}
      {hasMismatch && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-amber-900">
              Total das linhas ({formatCurrency(itemsTotalCents, currencyCode)}) não bate com o total do cabeçalho (
              {formatCurrency(headerTotalCents, currencyCode)})
            </div>
            <div className="text-xs text-amber-800 mt-0.5">
              Diferença: {formatCurrency(Math.abs(delta), currencyCode)} {delta > 0 ? "a mais nas linhas" : "a menos nas linhas"}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onApplyToHeader(totals)}
            className="shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Aplicar das linhas
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/** Group items by VAT rate, returning base + vat in CENTS for each rate. */
function aggregateByRate(items: EditableItem[]) {
  const map = new Map<number, { rate: number; baseCents: number; vatCents: number }>()
  for (const it of items) {
    const total = Number(it.total) || 0
    const rate = Number(it.vat_rate) || 0
    const explicitVat = it.vat_amount === undefined || it.vat_amount === "" ? null : Number(it.vat_amount)
    const vat = explicitVat != null && Number.isFinite(explicitVat)
      ? explicitVat
      : rate > 0
        ? (total * rate) / (100 + rate)
        : 0
    const base = total - vat

    const baseCents = Math.round(base * 100)
    const vatCents = Math.round(vat * 100)

    const existing = map.get(rate)
    if (existing) {
      existing.baseCents += baseCents
      existing.vatCents += vatCents
    } else {
      map.set(rate, { rate, baseCents, vatCents })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.rate - b.rate)
}
