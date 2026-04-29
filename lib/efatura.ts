/**
 * Parser for the AT (Autoridade Tributária) e-Fatura CSV export.
 *
 * The portal lets the taxpayer download every invoice their suppliers
 * communicated against their NIF. The file uses `;` as separator,
 * Windows-1252 encoding by default, decimal commas, and the "amount"
 * cells include a non-breaking space + euro sign ("41 940,92 €").
 *
 * We deliberately keep this file pure (no DB, no auth) so it can be
 * unit-tested. The caller is responsible for persisting the parsed
 * rows.
 */

export type EFaturaDocType = "FT" | "FR" | "NC" | "ND" | "RC" | "FS" | "OR" | "OTHER"

export type EFaturaRow = {
  sector: string | null
  supplierNif: string
  supplierName: string
  documentNumber: string
  atcud: string | null
  documentType: EFaturaDocType
  documentTypeRaw: string
  issuedAt: Date | null
  totalCents: number
  vatCents: number
  subtotalCents: number
  status: string | null
}

const TYPE_MAP: Record<string, EFaturaDocType> = {
  fatura: "FT",
  "fatura-recibo": "FR",
  recibo: "RC",
  "nota de crédito": "NC",
  "nota de credito": "NC",
  "nota de débito": "ND",
  "nota de debito": "ND",
  "fatura simplificada": "FS",
  orçamento: "OR",
  orcamento: "OR",
}

function mapType(raw: string): EFaturaDocType {
  return TYPE_MAP[raw.trim().toLowerCase()] ?? "OTHER"
}

function parseAmountToCents(input: string): number {
  if (!input) return 0
  // Strip currency symbols, NBSPs and ordinary spaces; convert PT decimal
  // comma to a dot, then parseFloat.
  const cleaned = input
    .replace(/ /g, " ")
    .replace(/[€$£]/g, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "") // thousands separator
    .replace(/,/g, ".")
  const n = parseFloat(cleaned)
  if (!isFinite(n)) return 0
  return Math.round(n * 100)
}

function parseDate(input: string): Date | null {
  // Format: DD/MM/YYYY
  const m = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`)
  return isNaN(d.getTime()) ? null : d
}

function splitEmitente(input: string): { nif: string; name: string } {
  // "503156000 - Sacyr Somague, SA"
  const idx = input.indexOf(" - ")
  if (idx < 0) {
    return { nif: "", name: input.trim() }
  }
  return { nif: input.slice(0, idx).trim(), name: input.slice(idx + 3).trim() }
}

function splitDocAndAtcud(input: string): { documentNumber: string; atcud: string | null } {
  // "ZFAT BF01/5000131244 / JFWY3XH3-5000131244"
  const parts = input.split(" / ")
  if (parts.length < 2) {
    return { documentNumber: input.trim(), atcud: null }
  }
  // Last part is the ATCUD; everything before joined back is the doc nº.
  const atcud = parts[parts.length - 1].trim() || null
  const documentNumber = parts.slice(0, -1).join(" / ").trim()
  return { documentNumber, atcud }
}

// Naive but resilient CSV-line splitter for `;`-separated values that
// allows quoted cells. We don't need full RFC-4180 — the AT file is
// well-behaved.
function splitCsvLine(line: string, sep = ";"): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === sep && !inQuotes) {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

/**
 * Parse a full e-Fatura CSV string. Returns successfully parsed rows
 * along with line numbers for any rows that couldn't be parsed so the
 * UI can surface them.
 */
export function parseEFaturaCsv(input: string): { rows: EFaturaRow[]; errors: { line: number; reason: string }[] } {
  // Strip UTF-8 BOM if present.
  const cleaned = input.replace(/^﻿/, "")
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0)

  const rows: EFaturaRow[] = []
  const errors: { line: number; reason: string }[] = []

  if (lines.length === 0) return { rows, errors }

  // First line is the header — discard. We index by position so changes
  // in column order will misparse, but the AT file format is stable.
  const HEADER_KEYS = [
    "sector",
    "emitente",
    "doc",
    "tipo",
    "data",
    "total",
    "iva",
    "base",
    "situacao",
  ]
  const dataLines = lines.slice(1)

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]
    const cells = splitCsvLine(line, ";")
    if (cells.length < HEADER_KEYS.length) {
      errors.push({ line: i + 2, reason: `Esperava ${HEADER_KEYS.length} colunas, obteve ${cells.length}` })
      continue
    }

    const [sector, emitente, doc, tipo, data, total, iva, base, situacao] = cells.map((c) => c.trim())
    if (!emitente) {
      errors.push({ line: i + 2, reason: "Linha sem emitente" })
      continue
    }

    const { nif, name } = splitEmitente(emitente)
    const { documentNumber, atcud } = splitDocAndAtcud(doc)

    rows.push({
      sector: sector || null,
      supplierNif: nif,
      supplierName: name,
      documentNumber,
      atcud,
      documentType: mapType(tipo),
      documentTypeRaw: tipo,
      issuedAt: parseDate(data),
      totalCents: parseAmountToCents(total),
      vatCents: parseAmountToCents(iva),
      subtotalCents: parseAmountToCents(base),
      status: situacao || null,
    })
  }

  return { rows, errors }
}
