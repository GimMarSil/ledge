"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { parseEFaturaCsv } from "@/lib/efatura"
import { inferVatBreakdown, VatRegion } from "@/lib/fiscal/vat-inference"
import { getSettings } from "@/models/settings"
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

  const settings = await getSettings(user.id)
  const region = (settings.default_vat_region as VatRegion) || "mainland"

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
      // Trash entries don't count for dedupe — if the user trashed an
      // invoice they imported by mistake, we should let the next
      // import recreate it cleanly.
      deletedAt: null,
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
          ...vatColumnsFromInference(row.subtotalCents, row.vatCents, region),
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

// Builds the slice of TransactionCreateInput that carries the inferred
// VAT info. Single-rate invoices write `vatRate` + a one-row
// `vatBreakdown`; mixed-rate invoices (e.g. restaurant: comida 13%/23%
// + bebidas 23%) write the multi-row breakdown and leave vatRate equal
// to the effective (weighted) rate so /fiscal totals stay consistent.
function vatColumnsFromInference(baseCents: number, vatCents: number, region: VatRegion) {
  if (baseCents <= 0 || vatCents < 0) {
    return { vatRate: null, vatBreakdown: Prisma.JsonNull }
  }
  const inf = inferVatBreakdown(baseCents, vatCents, region)
  return {
    vatRate: inf.confidence === "mixed" ? Math.round(inf.effectiveRate * 100) / 100 : inf.breakdown[0]?.rate ?? null,
    vatBreakdown: inf.breakdown.map((l) => ({
      rate: l.rate,
      base: l.base / 100,
      vat: l.vat / 100,
    })) as Prisma.InputJsonValue,
  }
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
