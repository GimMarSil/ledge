import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getReimbursableTransactions, ReimbursementStatus } from "@/models/reimbursements"
import { buildSepaPain001, SepaTransfer } from "@/lib/sepa"
import { NextRequest, NextResponse } from "next/server"

/**
 * SEPA pain.001.001.03 export — generates a credit transfer file the
 * user uploads to their bank's homebanking ("ficheiro de pagamentos")
 * to settle approved reimbursement claims in bulk.
 *
 * Debtor: the first active company-type treasury account with an IBAN.
 * Creditor: the holder of each transaction's linked personal account
 *           (in this single-user model that's the same person as the
 *           current user, but we read the account record so the name +
 *           IBAN match the actual payee — no hardcoded assumption).
 *
 * If any required field is missing we return a 400 with a clear error
 * so the UI can surface the gap to the user (no silent empty file).
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const { searchParams } = req.nextUrl
  const status = (searchParams.get("status") ?? "approved") as ReimbursementStatus
  const dateFrom = searchParams.get("dateFrom") ?? undefined
  const dateTo = searchParams.get("dateTo") ?? undefined

  // Find the debtor (paying) account.
  const debtorAccount = await prisma.treasuryAccount.findFirst({
    where: {
      userId: user.id,
      type: "company",
      isActive: true,
      iban: { not: null },
    },
    orderBy: { createdAt: "asc" },
  })

  if (!debtorAccount || !debtorAccount.iban) {
    return NextResponse.json(
      {
        error:
          "Sem conta de tesouraria de tipo 'empresa' com IBAN configurado. Adicione uma em Definições → Contas de Tesouraria.",
      },
      { status: 400 }
    )
  }

  const summary = await getReimbursableTransactions(user.id, { status, dateFrom, dateTo })

  if (summary.transactions.length === 0) {
    return NextResponse.json(
      { error: "Não há despesas para exportar com este filtro." },
      { status: 400 }
    )
  }

  // Build one transfer per transaction. We could also collapse all of a
  // creditor's amounts into a single line, but keeping one-per-tx makes
  // bank statements line up with the reimbursements list and simplifies
  // reconciliation later.
  const transfers: SepaTransfer[] = []
  const missingIban: string[] = []

  for (const tx of summary.transactions) {
    const acct = tx.treasuryAccount
    if (!acct || !acct.iban) {
      missingIban.push(tx.name ?? tx.id)
      continue
    }
    transfers.push({
      endToEndId: `RB-${tx.id.replace(/-/g, "").slice(0, 30)}`,
      amountCents: tx.total ?? 0,
      currency: tx.currencyCode || "EUR",
      creditorName: acct.holderName || acct.name,
      creditorIban: acct.iban,
      remittanceInfo: [
        "Reembolso",
        tx.merchant,
        tx.documentNumber,
        tx.issuedAt ? new Date(tx.issuedAt).toISOString().slice(0, 10) : null,
      ]
        .filter(Boolean)
        .join(" "),
    })
  }

  if (transfers.length === 0) {
    return NextResponse.json(
      {
        error: `Nenhuma das ${summary.transactions.length} despesas tem conta pessoal com IBAN. Atualize o IBAN em Definições → Contas de Tesouraria.`,
      },
      { status: 400 }
    )
  }

  const xml = buildSepaPain001({
    messageId: `RB-${Date.now()}`,
    initiatingPartyName: user.businessName || user.name || "Empresa",
    debtorName: debtorAccount.holderName || user.businessName || user.name || "Empresa",
    debtorIban: debtorAccount.iban,
    // Default to next business day; bank will hold until then.
    requestedExecutionDate: nextBusinessDay(),
    transfers,
  })

  const filename = `reembolsos-sepa-${new Date().toISOString().slice(0, 10)}.xml`
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...(missingIban.length ? { "X-Skipped-Transactions": String(missingIban.length) } : {}),
    },
  })
}

function nextBusinessDay(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  // Skip Saturday/Sunday.
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1)
  }
  return d.toISOString().slice(0, 10)
}
