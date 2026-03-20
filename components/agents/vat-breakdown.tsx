import { formatCurrency } from "@/lib/utils"

interface VatBreakdownEntry {
  rate: number
  base: number
  vat: number
}

function parseVatBreakdown(raw: unknown): VatBreakdownEntry[] {
  if (!raw) return []

  let parsed: unknown = raw
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) return []

  return parsed
    .filter(
      (entry): entry is VatBreakdownEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.rate === "number" &&
        typeof entry.base === "number" &&
        typeof entry.vat === "number"
    )
    .sort((a, b) => a.rate - b.rate)
}

export function VatBreakdownTable({
  vatBreakdown,
  currencyCode = "EUR",
}: {
  vatBreakdown: unknown
  currencyCode?: string
}) {
  const entries = parseVatBreakdown(vatBreakdown)

  if (entries.length === 0) return null

  const totalBase = entries.reduce((sum, e) => sum + e.base, 0)
  const totalVat = entries.reduce((sum, e) => sum + e.vat, 0)
  const totalWithVat = totalBase + totalVat

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b">
            <th className="text-left py-1.5 font-medium">Taxa</th>
            <th className="text-right py-1.5 font-medium">Base Tributável</th>
            <th className="text-right py-1.5 font-medium">IVA</th>
            <th className="text-right py-1.5 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.rate} className="border-b border-dashed last:border-solid">
              <td className="py-1.5 font-medium">{entry.rate}%</td>
              <td className="py-1.5 text-right">{formatCurrency(entry.base * 100, currencyCode)}</td>
              <td className="py-1.5 text-right">{formatCurrency(entry.vat * 100, currencyCode)}</td>
              <td className="py-1.5 text-right">{formatCurrency((entry.base + entry.vat) * 100, currencyCode)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="py-1.5">Total</td>
            <td className="py-1.5 text-right">{formatCurrency(totalBase * 100, currencyCode)}</td>
            <td className="py-1.5 text-right">{formatCurrency(totalVat * 100, currencyCode)}</td>
            <td className="py-1.5 text-right">{formatCurrency(totalWithVat * 100, currencyCode)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
