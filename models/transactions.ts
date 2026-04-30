import { prisma } from "@/lib/db"
import { Field, Prisma, Transaction } from "@/prisma/client"
import { cache } from "react"
import { getFields } from "./fields"
import { deleteFile } from "./files"

export type TransactionData = {
  name?: string | null
  description?: string | null
  merchant?: string | null
  total?: number | null
  currencyCode?: string | null
  convertedTotal?: number | null
  convertedCurrencyCode?: string | null
  type?: string | null
  items?: TransactionData[] | undefined
  note?: string | null
  files?: string[] | undefined
  extra?: Record<string, unknown>
  categoryCode?: string | null
  projectCode?: string | null
  issuedAt?: Date | string | null
  text?: string | null
  // Campos fiscais portugueses
  documentType?: string | null
  documentNumber?: string | null
  documentSeries?: string | null
  nif?: string | null
  customerNif?: string | null
  subtotal?: number | null
  vatAmount?: number | null
  vatRate?: number | null
  vatBreakdown?: Record<string, unknown>[] | null
  atcud?: string | null
  hashControl?: string | null
  qrCode?: string | null
  fiscalStatus?: string | null
  withholdingRate?: number | null
  withholdingAmount?: number | null
  [key: string]: unknown
}

export type TransactionFilters = {
  search?: string
  dateFrom?: string
  dateTo?: string
  ordering?: string
  categoryCode?: string
  projectCode?: string
  type?: string
  page?: number
}

export type TransactionPagination = {
  limit: number
  offset: number
}

export const getTransactions = cache(
  async (
    userId: string,
    filters?: TransactionFilters,
    pagination?: TransactionPagination
  ): Promise<{
    transactions: Transaction[]
    total: number
  }> => {
    // Trash items are excluded from every primary read. Use the
    // dedicated trash helpers below to look them up.
    const where: Prisma.TransactionWhereInput = { userId, deletedAt: null }
    let orderBy: Prisma.TransactionOrderByWithRelationInput = { issuedAt: "desc" }

    if (filters) {
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { merchant: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { note: { contains: filters.search, mode: "insensitive" } },
          { text: { contains: filters.search, mode: "insensitive" } },
        ]
      }

      if (filters.dateFrom || filters.dateTo) {
        where.issuedAt = {
          gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
        }
      }

      if (filters.categoryCode) {
        where.categoryCode = filters.categoryCode
      }

      if (filters.projectCode) {
        where.projectCode = filters.projectCode
      }

      if (filters.type) {
        where.type = filters.type
      }

      if (filters.ordering) {
        const isDesc = filters.ordering.startsWith("-")
        const field = isDesc ? filters.ordering.slice(1) : filters.ordering
        orderBy = { [field]: isDesc ? "desc" : "asc" }
      }
    }

    if (pagination) {
      const total = await prisma.transaction.count({ where })
      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          category: true,
          project: true,
        },
        orderBy,
        take: pagination?.limit,
        skip: pagination?.offset,
      })
      return { transactions, total }
    } else {
      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          category: true,
          project: true,
        },
        orderBy,
      })
      return { transactions, total: transactions.length }
    }
  }
)

export const getTransactionById = cache(async (id: string, userId: string): Promise<Transaction | null> => {
  return await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      category: true,
      project: true,
    },
  })
})

export const getTransactionsByFileId = cache(async (fileId: string, userId: string): Promise<Transaction[]> => {
  return await prisma.transaction.findMany({
    where: { files: { array_contains: [fileId] }, userId },
  })
})

export const createTransaction = async (userId: string, data: TransactionData): Promise<Transaction> => {
  const { standard, extra } = await splitTransactionDataExtraFields(data, userId)

  return await prisma.transaction.create({
    data: {
      ...(standard as Prisma.TransactionUncheckedCreateInput),
      extra: extra,
      items: data.items as Prisma.InputJsonValue,
      vatBreakdown: standard.vatBreakdown as Prisma.InputJsonValue,
      userId,
    },
  })
}

export const updateTransaction = async (id: string, userId: string, data: TransactionData): Promise<Transaction> => {
  const { standard, extra } = await splitTransactionDataExtraFields(data, userId)

  return await prisma.transaction.update({
    where: { id, userId },
    data: {
      ...(standard as Prisma.TransactionUncheckedUpdateInput),
      extra: extra,
      items: data.items ? (data.items as Prisma.InputJsonValue) : [],
      vatBreakdown: standard.vatBreakdown as Prisma.InputJsonValue,
    },
  })
}

export const updateTransactionFiles = async (id: string, userId: string, files: string[]): Promise<Transaction> => {
  return await prisma.transaction.update({
    where: { id, userId },
    data: { files },
  })
}

// "Delete" sends to the trash (soft-delete). Files attached to the
// transaction are NOT touched here — they're only reaped when the
// trash entry is purged for real (hardDeleteTransaction).
export const deleteTransaction = async (id: string, userId: string): Promise<Transaction | undefined> => {
  const transaction = await getTransactionById(id, userId)
  if (!transaction) return undefined
  return prisma.transaction.update({
    where: { id, userId },
    data: { deletedAt: new Date() },
  })
}

export const bulkDeleteTransactions = async (ids: string[], userId: string) => {
  return prisma.transaction.updateMany({
    where: { id: { in: ids }, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  })
}

// ── Trash / soft-delete helpers ──────────────────────────────────────────

export const getDeletedTransactions = cache(async (userId: string): Promise<Transaction[]> => {
  return prisma.transaction.findMany({
    where: { userId, deletedAt: { not: null } },
    include: { category: true, project: true },
    orderBy: { deletedAt: "desc" },
  })
})

export const restoreTransaction = async (id: string, userId: string) => {
  return prisma.transaction.update({
    where: { id, userId },
    data: { deletedAt: null },
  })
}

export const hardDeleteTransaction = async (id: string, userId: string): Promise<Transaction | undefined> => {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!transaction) return undefined

  const files = Array.isArray(transaction.files) ? transaction.files : []
  for (const fileId of files as string[]) {
    const stillReferenced = await prisma.transaction.count({
      where: { files: { array_contains: [fileId] }, userId, NOT: { id } },
    })
    if (stillReferenced === 0) {
      await deleteFile(fileId, userId)
    }
  }
  return prisma.transaction.delete({ where: { id, userId } })
}

/**
 * Lazy purge — called on every visit to /trash. Hard-deletes any
 * transaction whose deletedAt is older than the user's configured
 * retention window (default 90 days). We don't run a cron because
 * Despesas is provisioned tenant-by-tenant; doing it on access is
 * predictable and costs nothing on a healthy install.
 */
export const purgeExpiredTrash = async (userId: string, retentionDays: number) => {
  if (retentionDays <= 0) return { purged: 0 }
  const threshold = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  const expired = await prisma.transaction.findMany({
    where: { userId, deletedAt: { lt: threshold } },
    select: { id: true },
  })
  for (const { id } of expired) {
    await hardDeleteTransaction(id, userId)
  }
  return { purged: expired.length }
}

// Columns that are first-class on the Transaction model. They must reach
// `standard` even when the user has no matching Field row — otherwise
// AI-extracted fiscal data is silently dropped before INSERT, which
// breaks SAFT-PT and IVA reports (no NIF, no document type/number).
const ALWAYS_STANDARD_KEYS = new Set<string>([
  "name",
  "merchant",
  "description",
  "type",
  "total",
  "currencyCode",
  "convertedTotal",
  "convertedCurrencyCode",
  "categoryCode",
  "projectCode",
  "issuedAt",
  "note",
  "text",
  "files",
  // Portuguese fiscal columns
  "nif",
  "customerNif",
  "documentType",
  "documentNumber",
  "documentSeries",
  "atcud",
  "subtotal",
  "vatAmount",
  "vatBreakdown",
  "vat_breakdown",
  // Treasury / reimbursement
  "treasuryAccountCode",
  "reimbursementStatus",
  "reimbursementPaidAt",
  "importBatchId",
  // Fiscal/IVA — these were silently dropped on save when the user
  // had no Field row for them, so /fiscal aggregations stayed at zero.
  "vatRate",
  "withholdingRate",
  "withholdingAmount",
  "fiscalStatus",
])

const splitTransactionDataExtraFields = async (
  data: TransactionData,
  userId: string
): Promise<{ standard: TransactionData; extra: Prisma.InputJsonValue }> => {
  const fields = await getFields(userId)
  const fieldMap = fields.reduce(
    (acc, field) => {
      acc[field.code] = field
      return acc
    },
    {} as Record<string, Field>
  )

  const standard: TransactionData = {}
  const extra: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    if (ALWAYS_STANDARD_KEYS.has(key)) {
      // vat_breakdown comes in as either alias; normalise to the model key.
      if (key === "vat_breakdown") {
        ;(standard as Record<string, unknown>).vatBreakdown = value
      } else {
        standard[key] = value
      }
      return
    }
    const fieldDef = fieldMap[key]
    if (fieldDef) {
      if (fieldDef.isExtra) {
        extra[key] = value
      } else {
        standard[key] = value
      }
    }
  })

  return { standard, extra: extra as Prisma.InputJsonValue }
}
