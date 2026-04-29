import { prisma } from "@/lib/db"
import { Prisma, Transaction } from "@/prisma/client"

export type ReimbursementStatus = "pending" | "approved" | "paid" | "rejected"

export type ReimbursementFilters = {
  dateFrom?: string
  dateTo?: string
  status?: ReimbursementStatus | "all"
  treasuryAccountCode?: string
}

export type ReimbursementSummary = {
  totalCount: number
  totalAmount: number // cents
  byStatus: Record<ReimbursementStatus, { count: number; amount: number }>
  transactions: Transaction[]
}

const ZERO_BUCKET = { count: 0, amount: 0 }

// Reimbursable expenses are those paid by a "personal" treasury account
// (i.e. the employee fronted the cost out of pocket) and not yet marked
// as paid. We deliberately scope by user — this app's single-tenant
// model treats each User as a separate workspace; multi-employee
// rollups will need a joined Employee model in a later phase.
export async function getReimbursableTransactions(
  userId: string,
  filters: ReimbursementFilters = {}
): Promise<ReimbursementSummary> {
  const where: Prisma.TransactionWhereInput = {
    userId,
    treasuryAccount: { type: "personal" },
  }

  if (filters.treasuryAccountCode) {
    where.treasuryAccountCode = filters.treasuryAccountCode
  }

  if (filters.status && filters.status !== "all") {
    where.reimbursementStatus = filters.status
  }

  if (filters.dateFrom || filters.dateTo) {
    where.issuedAt = {
      gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { treasuryAccount: true, category: true, project: true },
    orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
  })

  const byStatus: ReimbursementSummary["byStatus"] = {
    pending: { ...ZERO_BUCKET },
    approved: { ...ZERO_BUCKET },
    paid: { ...ZERO_BUCKET },
    rejected: { ...ZERO_BUCKET },
  }

  let totalAmount = 0
  for (const tx of transactions) {
    const status = (tx.reimbursementStatus as ReimbursementStatus) || "pending"
    const amount = tx.total ?? 0
    if (byStatus[status]) {
      byStatus[status].count += 1
      byStatus[status].amount += amount
    }
    totalAmount += amount
  }

  return {
    totalCount: transactions.length,
    totalAmount,
    byStatus,
    transactions,
  }
}

export async function setReimbursementStatus(
  userId: string,
  transactionIds: string[],
  status: ReimbursementStatus
): Promise<{ count: number }> {
  const data: Prisma.TransactionUpdateManyMutationInput = { reimbursementStatus: status }
  if (status === "paid") {
    data.reimbursementPaidAt = new Date()
  }

  const result = await prisma.transaction.updateMany({
    where: {
      userId,
      id: { in: transactionIds },
      treasuryAccount: { type: "personal" },
    },
    data,
  })
  return { count: result.count }
}
