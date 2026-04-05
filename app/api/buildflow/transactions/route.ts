import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticateBuildFlowRequest } from "../middleware"
import { createTransaction, getTransactions } from "@/models/transactions"

export async function GET(request: Request) {
  const authResult = await authenticateBuildFlowRequest()
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult
  const { searchParams } = new URL(request.url)

  const filters = {
    search: searchParams.get("search") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    categoryCode: searchParams.get("categoryCode") || undefined,
    projectCode: searchParams.get("projectCode") || undefined,
    type: searchParams.get("type") || undefined,
  }

  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)

  const { transactions, total } = await getTransactions(userId, filters, {
    limit,
    offset: (page - 1) * limit,
  })

  return NextResponse.json({
    data: transactions.map((tx) => ({
      id: tx.id,
      name: tx.name,
      merchant: tx.merchant,
      total: (tx.total || 0) / 100,
      currency: tx.currencyCode,
      type: tx.type,
      documentType: tx.documentType,
      documentNumber: tx.documentNumber,
      nif: tx.nif,
      vatAmount: (tx.vatAmount || 0) / 100,
      issuedAt: tx.issuedAt,
      fiscalStatus: tx.fiscalStatus,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: Request) {
  const authResult = await authenticateBuildFlowRequest()
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult
  const body = await request.json()

  // Converter valores de EUR para cêntimos
  const data = {
    ...body,
    total: body.total ? Math.round(body.total * 100) : undefined,
    subtotal: body.subtotal ? Math.round(body.subtotal * 100) : undefined,
    vatAmount: body.vatAmount ? Math.round(body.vatAmount * 100) : undefined,
  }

  const transaction = await createTransaction(userId, data)

  return NextResponse.json({ data: transaction }, { status: 201 })
}
