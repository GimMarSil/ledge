import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticateBuildFlowRequest } from "../middleware"
import { getDeductibilityRate } from "@/lib/fiscal/deductibility"

export async function GET(request: Request) {
  const authResult = await authenticateBuildFlowRequest()
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult
  const { searchParams } = new URL(request.url)

  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
  const quarter = searchParams.get("quarter") // "1", "2", "3", "4" ou null para anual

  let startDate: Date
  let endDate: Date

  if (quarter) {
    const q = parseInt(quarter)
    startDate = new Date(year, (q - 1) * 3, 1)
    endDate = new Date(year, q * 3, 0)
  } else {
    startDate = new Date(`${year}-01-01`)
    endDate = new Date(`${year}-12-31`)
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      issuedAt: { gte: startDate, lte: endDate },
    },
    include: { category: true },
  })

  const income = transactions.filter((t) => t.type === "income")
  const expenses = transactions.filter((t) => t.type === "expense")

  // IVA liquidado por taxa
  const vatCollected: Record<number, { base: number; vat: number }> = {}
  for (const tx of income) {
    const rate = Number(tx.vatRate) || 0
    if (!vatCollected[rate]) vatCollected[rate] = { base: 0, vat: 0 }
    vatCollected[rate].base += tx.subtotal || 0
    vatCollected[rate].vat += tx.vatAmount || 0
  }

  // IVA dedutível por taxa
  const vatDeductible: Record<number, { base: number; vat: number }> = {}
  for (const tx of expenses) {
    const rate = Number(tx.vatRate) || 0
    const deductRate = getDeductibilityRate(tx.category?.code || "outros")
    if (!vatDeductible[rate]) vatDeductible[rate] = { base: 0, vat: 0 }
    vatDeductible[rate].base += tx.subtotal || 0
    vatDeductible[rate].vat += Math.round((tx.vatAmount || 0) * deductRate)
  }

  const totalCollected = Object.values(vatCollected).reduce((sum, v) => sum + v.vat, 0)
  const totalDeductible = Object.values(vatDeductible).reduce((sum, v) => sum + v.vat, 0)

  return NextResponse.json({
    period: {
      year,
      quarter: quarter ? parseInt(quarter) : null,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    },
    vatCollected: Object.entries(vatCollected).map(([rate, data]) => ({
      rate: Number(rate),
      base: data.base / 100,
      vat: data.vat / 100,
    })),
    vatDeductible: Object.entries(vatDeductible).map(([rate, data]) => ({
      rate: Number(rate),
      base: data.base / 100,
      vat: data.vat / 100,
    })),
    summary: {
      totalVatCollected: totalCollected / 100,
      totalVatDeductible: totalDeductible / 100,
      vatBalance: (totalCollected - totalDeductible) / 100,
      status: totalCollected >= totalDeductible ? "a_pagar" : "a_recuperar",
    },
  })
}
