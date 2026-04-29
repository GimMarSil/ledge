"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { parseEFaturaCsv } from "@/lib/efatura"
import { createTransaction } from "@/models/transactions"
import { revalidatePath } from "next/cache"

export type EFaturaImportSummary = {
  imported: number
  skipped: number
  errors: { line: number; reason: string }[]
}

/**
 * Imports the AT e-Fatura CSV: each row becomes a Transaction stub
 * with the fiscal fields pre-filled (supplier NIF, document type/nr,
 * ATCUD, total, IVA, subtotal). The user can later attach the actual
 * receipt PDF by uploading it and linking, or the system will match
 * by ATCUD if available.
 *
 * "skipped" counts rows we ignored because the user already has a
 * transaction with the same supplierNif + documentNumber — keeps the
 * flow idempotent so the user can re-import each quarter without
 * creating duplicates.
 */
export async function importEFaturaAction(
  _prevState: ActionState<EFaturaImportSummary> | null,
  formData: FormData
): Promise<ActionState<EFaturaImportSummary>> {
  const user = await getCurrentUser()
  const file = formData.get("file") as File | null

  if (!file || file.size === 0) {
    return { success: false, error: "Sem ficheiro" }
  }

  // The AT portal exports as Windows-1252 ("ANSI"). Try UTF-8 first
  // (some browsers re-encode) and fall back to latin1 when we see the
  // Â/ encoding garbage that signals a mis-decode.
  const buf = Buffer.from(await file.arrayBuffer())
  let text = buf.toString("utf8")
  if (text.includes("Ã") || text.includes("Â")) {
    text = buf.toString("latin1")
  }

  const { rows, errors } = parseEFaturaCsv(text)
  if (rows.length === 0) {
    return {
      success: false,
      error: errors.length
        ? `Nenhuma linha importável. Primeiro erro: ${errors[0].reason}`
        : "Ficheiro vazio",
    }
  }

  // Build a single dedupe lookup using the supplier NIF + document
  // number pair — that's how the AT portal identifies an invoice.
  const { prisma } = await import("@/lib/db")
  const existing = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      OR: rows.map((r) => ({
        nif: r.supplierNif,
        documentNumber: r.documentNumber,
      })),
    },
    select: { nif: true, documentNumber: true },
  })
  const existingKey = new Set(existing.map((t) => `${t.nif}|${t.documentNumber}`))

  let imported = 0
  let skipped = 0
  for (const row of rows) {
    const key = `${row.supplierNif}|${row.documentNumber}`
    if (existingKey.has(key)) {
      skipped++
      continue
    }
    try {
      await createTransaction(user.id, {
        name: `${row.supplierName} ${row.documentNumber}`.trim(),
        merchant: row.supplierName,
        type: "expense",
        nif: row.supplierNif,
        customerNif: user.businessNif || null,
        documentType: row.documentType === "OTHER" ? null : row.documentType,
        documentNumber: row.documentNumber,
        atcud: row.atcud,
        issuedAt: row.issuedAt,
        total: row.totalCents,
        vatAmount: row.vatCents,
        subtotal: row.subtotalCents,
        currencyCode: "EUR",
        // Personal account by default — the user will reclassify the
        // company-paid ones in /reimbursements via bulk select.
        treasuryAccountCode: "personal",
        // Marks it as "extracted from a fiscal authority" so the user
        // knows the totals match what's already on AT and the doc is
        // legally valid.
        fiscalStatus: "registered",
      })
      imported++
    } catch (e) {
      errors.push({ line: 0, reason: `${row.supplierName} ${row.documentNumber}: ${(e as Error).message}` })
    }
  }

  revalidatePath("/transactions")
  revalidatePath("/import/e-fatura")

  return { success: true, data: { imported, skipped, errors } }
}
