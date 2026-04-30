"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { parseEFaturaCsv } from "@/lib/efatura"
import { Prisma } from "@/prisma/client"
import { revalidatePath } from "next/cache"

export type EFaturaImportSummary = {
  batchId: string
  imported: number
  skipped: number
  errors: { line: number; reason: string }[]
}

export async function importEFaturaAction(
  _prevState: ActionState<EFaturaImportSummary> | null,
  formData: FormData
): Promise<ActionState<EFaturaImportSummary>> {
  const user = await getCurrentUser()
  const file = formData.get("file") as File | null

  if (!file || file.size === 0) {
    return { success: false, error: "Sem ficheiro" }
  }

  // The AT portal exports as Windows-1252. Try UTF-8 first; fall back
  // to latin1 when we see the Â/Ã garbage that signals a mis-decode.
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

  // Global dedupe: catch invoices we already created (manually or in a
  // previous import). Key is supplier NIF + document number — that's
  // how the AT portal itself uniquely identifies an invoice.
  const existing = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      OR: rows.map((r) => ({ nif: r.supplierNif, documentNumber: r.documentNumber })),
    },
    select: { nif: true, documentNumber: true },
  })
  const existingKey = new Set(existing.map((t) => `${t.nif}|${t.documentNumber}`))

  // Create the batch up front so transactions can link back to it.
  // We update the counts at the end; if the request blows up midway we
  // still have a record of the partial run.
  const batch = await prisma.importBatch.create({
    data: {
      user: { connect: { id: user.id } },
      source: "e-fatura",
      filename: file.name,
    },
  })

  let imported = 0
  let skipped = 0
  const txErrors: { line: number; reason: string }[] = [...errors]

  for (const row of rows) {
    const key = `${row.supplierNif}|${row.documentNumber}`
    if (existingKey.has(key)) {
      skipped++
      continue
    }
    existingKey.add(key) // also dedupe within the file itself

    try {
      await prisma.transaction.create({
        data: {
          userId: user.id,
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
          // /fiscal aggregates by vatRate. The AT CSV doesn't carry a
          // rate column, so we infer it from vatAmount / subtotal and
          // snap to the closest standard PT rate (0, 6, 13, 23%).
          vatRate: snapToPtVatRate(row.subtotalCents, row.vatCents),
          // Persist a one-row breakdown too — saftexport and the
          // dashboard prefer this shape when it's present.
          vatBreakdown:
            row.subtotalCents > 0 && row.vatCents > 0
              ? [
                  {
                    rate: snapToPtVatRate(row.subtotalCents, row.vatCents),
                    base: row.subtotalCents / 100,
                    vat: row.vatCents / 100,
                  },
                ]
              : Prisma.JsonNull,
          currencyCode: "EUR",
          treasuryAccountCode: "personal",
          fiscalStatus: "registered",
          importBatchId: batch.id,
        } as Prisma.TransactionUncheckedCreateInput,
      })
      imported++
    } catch (e) {
      txErrors.push({
        line: 0,
        reason: `${row.supplierName} ${row.documentNumber}: ${(e as Error).message}`,
      })
    }
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: { importedCount: imported, skippedCount: skipped },
  })

  revalidatePath("/transactions")
  revalidatePath("/import/e-fatura")

  return {
    success: true,
    data: { batchId: batch.id, imported, skipped, errors: txErrors },
  }
}

// Standard mainland PT VAT rates. Reduced rates differ on the islands
// (Madeira/Açores) but the AT CSV doesn't disambiguate, so we accept a
// small tolerance and pick the closest mainland rate.
const PT_VAT_RATES = [0, 6, 13, 23]
function snapToPtVatRate(baseCents: number, vatCents: number): number {
  if (baseCents <= 0) return 0
  const computed = (vatCents * 100) / baseCents
  let best = 0
  let bestDelta = Number.POSITIVE_INFINITY
  for (const r of PT_VAT_RATES) {
    const d = Math.abs(r - computed)
    if (d < bestDelta) {
      best = r
      bestDelta = d
    }
  }
  return best
}

/**
 * Bulk-edit every transaction in a batch (or just the selected ones).
 * Empty/null fields in `patch` are ignored so the user can update one
 * field at a time without nulling out the others.
 */
export async function bulkEditBatchAction(
  batchId: string,
  patch: {
    categoryCode?: string | null
    projectCode?: string | null
    treasuryAccountCode?: string | null
    description?: string | null
    note?: string | null
  },
  transactionIds?: string[]
) {
  const user = await getCurrentUser()
  // Unchecked variant — categoryCode/projectCode/treasuryAccountCode are
  // relation FKs and the typed (checked) UpdateManyMutationInput doesn't
  // expose them, only the relation `connect` form which updateMany
  // doesn't support. Unchecked lets us write the FK column directly.
  const data: Prisma.TransactionUncheckedUpdateManyInput = {}
  if (patch.categoryCode !== undefined) data.categoryCode = patch.categoryCode || null
  if (patch.projectCode !== undefined) data.projectCode = patch.projectCode || null
  if (patch.treasuryAccountCode !== undefined) data.treasuryAccountCode = patch.treasuryAccountCode || null
  if (patch.description !== undefined && patch.description) data.description = patch.description
  if (patch.note !== undefined && patch.note) data.note = patch.note

  if (Object.keys(data).length === 0) {
    return { success: false, error: "Nada para atualizar" }
  }

  const where: Prisma.TransactionWhereInput = {
    userId: user.id,
    importBatchId: batchId,
  }
  if (transactionIds && transactionIds.length) {
    where.id = { in: transactionIds }
  }

  const result = await prisma.transaction.updateMany({
    where,
    data: data as Prisma.TransactionUpdateManyMutationInput,
  })
  revalidatePath(`/import/e-fatura/${batchId}`)
  return { success: true, count: result.count }
}

/**
 * Hard-delete every transaction in a batch and the batch row itself.
 * Used to roll back an import that came in wrong (e.g. wrong period).
 */
export async function deleteBatchAction(batchId: string) {
  const user = await getCurrentUser()
  // Verify ownership first so we don't accidentally delete another
  // tenant's batch on a stale URL.
  const batch = await prisma.importBatch.findFirst({
    where: { id: batchId, userId: user.id },
    select: { id: true },
  })
  if (!batch) {
    return { success: false, error: "Lote não encontrado" }
  }
  await prisma.transaction.deleteMany({
    where: { userId: user.id, importBatchId: batchId },
  })
  await prisma.importBatch.delete({ where: { id: batchId } })
  revalidatePath("/import/e-fatura")
  revalidatePath("/transactions")
  return { success: true }
}
