import { getCurrentUser } from "@/lib/auth"
import { getReimbursableTransactions, ReimbursementStatus } from "@/models/reimbursements"
import { NextRequest, NextResponse } from "next/server"

/**
 * CSV export for approved (or any selected status) reimbursements.
 *
 * Produces a file the user can hand to the finance team or upload into
 * a payments tool. Columns are intentionally minimal so it stays readable
 * in Excel without massaging — for SEPA XML bulk upload we'll add a
 * dedicated endpoint later.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const { searchParams } = req.nextUrl
  const status = (searchParams.get("status") ?? "approved") as ReimbursementStatus
  const dateFrom = searchParams.get("dateFrom") ?? undefined
  const dateTo = searchParams.get("dateTo") ?? undefined

  const summary = await getReimbursableTransactions(user.id, { status, dateFrom, dateTo })

  const rows: string[] = []
  rows.push(["Data", "Fornecedor", "Descrição", "NIF", "Documento", "Total", "Moeda", "Estado"].join(";"))

  for (const tx of summary.transactions) {
    const issued = tx.issuedAt ? new Date(tx.issuedAt).toISOString().slice(0, 10) : ""
    const total = ((tx.total ?? 0) / 100).toFixed(2).replace(".", ",")
    const cells = [
      issued,
      tx.merchant ?? "",
      (tx.name ?? tx.description ?? "").replace(/[\r\n;]/g, " "),
      tx.nif ?? "",
      [tx.documentType, tx.documentSeries, tx.documentNumber].filter(Boolean).join(" "),
      total,
      tx.currencyCode ?? "EUR",
      tx.reimbursementStatus ?? "",
    ]
    rows.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
  }

  const csv = "﻿" + rows.join("\r\n") // BOM so Excel detects UTF-8
  const filename = `reembolsos-${status}-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
