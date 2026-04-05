import type {
  SAFTSourceDocuments,
  SAFTSalesInvoices,
  SAFTInvoice,
  SAFTInvoiceLine,
  SAFTDocumentTotals,
  SAFTPayments,
  SAFTPayment,
} from "./saft-types"
import type { Transaction } from "@/prisma/client"
import { SAFT_INVOICE_TYPES } from "../document-types"
import { getTaxCodeForRate } from "@/models/tax-tables"

export function buildSAFTSourceDocuments(transactions: Transaction[]): SAFTSourceDocuments {
  const invoiceTransactions = transactions.filter(
    (tx) => tx.documentType && SAFT_INVOICE_TYPES.includes(tx.documentType as any)
  )

  const receiptTransactions = transactions.filter((tx) => tx.documentType === "RC")

  const result: SAFTSourceDocuments = {}

  if (invoiceTransactions.length > 0) {
    result.salesInvoices = buildSalesInvoices(invoiceTransactions)
  }

  if (receiptTransactions.length > 0) {
    result.payments = buildPayments(receiptTransactions)
  }

  return result
}

function buildSalesInvoices(transactions: Transaction[]): SAFTSalesInvoices {
  let totalDebit = 0
  let totalCredit = 0

  const invoices: SAFTInvoice[] = transactions.map((tx) => {
    const grossTotal = (tx.total || 0) / 100
    const netTotal = (tx.subtotal || tx.total || 0) / 100
    const taxPayable = (tx.vatAmount || 0) / 100

    if (tx.documentType === "NC") {
      totalDebit += grossTotal
    } else {
      totalCredit += grossTotal
    }

    return transactionToInvoice(tx, netTotal, taxPayable, grossTotal)
  })

  return {
    numberOfEntries: invoices.length,
    totalDebit: roundDecimal(totalDebit),
    totalCredit: roundDecimal(totalCredit),
    invoices,
  }
}

function transactionToInvoice(
  tx: Transaction,
  netTotal: number,
  taxPayable: number,
  grossTotal: number
): SAFTInvoice {
  const invoiceDate = tx.issuedAt ? tx.issuedAt.toISOString().split("T")[0] : tx.createdAt.toISOString().split("T")[0]
  const systemEntryDate = tx.createdAt.toISOString().replace(/\.\d{3}Z$/, "")
  const period = tx.issuedAt
    ? String(tx.issuedAt.getMonth() + 1).padStart(2, "0")
    : String(tx.createdAt.getMonth() + 1).padStart(2, "0")

  const status = tx.fiscalStatus === "cancelled" ? "A" : "N"

  const lines = buildInvoiceLines(tx)

  return {
    invoiceNo: tx.documentNumber || `${tx.documentType || "FT"} ${tx.documentSeries || "A"}/0`,
    atcud: tx.atcud || "0-0",
    documentStatus: {
      invoiceStatus: status,
      invoiceStatusDate: systemEntryDate,
      sourceID: "Ledge",
      sourceBilling: "P",
    },
    hash: tx.hashControl ? "x".repeat(172) : "", // Hash completo não é armazenado, apenas o controlo
    hashControl: tx.hashControl || "0000",
    period,
    invoiceDate,
    invoiceType: tx.documentType || "FT",
    specialRegimes: {
      selfBillingIndicator: "0",
      cashVATSchemeIndicator: "0",
      thirdPartiesBillingIndicator: "0",
    },
    sourceID: "Ledge",
    systemEntryDate,
    customerID: tx.customerNif || "999999990",
    lines,
    documentTotals: {
      taxPayable: roundDecimal(taxPayable),
      netTotal: roundDecimal(netTotal),
      grossTotal: roundDecimal(grossTotal),
    },
  }
}

function buildInvoiceLines(tx: Transaction): SAFTInvoiceLine[] {
  const items = Array.isArray(tx.items) ? (tx.items as any[]) : []
  const isCredit = tx.documentType === "NC"
  const invoiceDate = tx.issuedAt ? tx.issuedAt.toISOString().split("T")[0] : tx.createdAt.toISOString().split("T")[0]

  if (items.length > 0) {
    return items.map((item: any, index: number) => {
      const unitPrice = (item.total || 0) / 100
      const vatRate = item.vat_rate || Number(tx.vatRate) || 0
      const taxCode = getTaxCodeForRate(vatRate)

      const line: SAFTInvoiceLine = {
        lineNumber: String(index + 1),
        productCode: item.name ? slugify(item.name) : `item-${index + 1}`,
        productDescription: item.name || "Sem descrição",
        quantity: 1,
        unitOfMeasure: "UN",
        unitPrice: roundDecimal(unitPrice),
        taxPointDate: invoiceDate,
        description: item.description || item.name || "Sem descrição",
        tax: {
          taxType: "IVA",
          taxCountryRegion: "PT",
          taxCode,
          taxPercentage: vatRate,
        },
      }

      if (isCredit) {
        line.debitAmount = roundDecimal(unitPrice)
      } else {
        line.creditAmount = roundDecimal(unitPrice)
      }

      if (vatRate === 0) {
        line.taxExemptionReason = "Isento artigo 53.º do CIVA"
        line.taxExemptionCode = "M10"
      }

      return line
    })
  }

  // Sem items — uma única linha com o total
  const unitPrice = (tx.total || 0) / 100
  const vatRate = Number(tx.vatRate) || 0
  const taxCode = getTaxCodeForRate(vatRate)

  const line: SAFTInvoiceLine = {
    lineNumber: "1",
    productCode: tx.name ? slugify(tx.name) : "servico",
    productDescription: tx.name || "Sem descrição",
    quantity: 1,
    unitOfMeasure: "UN",
    unitPrice: roundDecimal(unitPrice),
    taxPointDate: invoiceDate,
    description: tx.description || tx.name || "Sem descrição",
    tax: {
      taxType: "IVA",
      taxCountryRegion: "PT",
      taxCode,
      taxPercentage: vatRate,
    },
  }

  if (isCredit) {
    line.debitAmount = roundDecimal(unitPrice)
  } else {
    line.creditAmount = roundDecimal(unitPrice)
  }

  if (vatRate === 0) {
    line.taxExemptionReason = "Isento artigo 53.º do CIVA"
    line.taxExemptionCode = "M10"
  }

  return [line]
}

function buildPayments(transactions: Transaction[]): SAFTPayments {
  let totalDebit = 0
  let totalCredit = 0

  const payments: SAFTPayment[] = transactions.map((tx) => {
    const grossTotal = (tx.total || 0) / 100
    const netTotal = (tx.subtotal || tx.total || 0) / 100
    const taxPayable = (tx.vatAmount || 0) / 100

    totalCredit += grossTotal

    const paymentDate = tx.issuedAt ? tx.issuedAt.toISOString().split("T")[0] : tx.createdAt.toISOString().split("T")[0]
    const systemEntryDate = tx.createdAt.toISOString().replace(/\.\d{3}Z$/, "")
    const period = tx.issuedAt
      ? String(tx.issuedAt.getMonth() + 1).padStart(2, "0")
      : String(tx.createdAt.getMonth() + 1).padStart(2, "0")

    const status = tx.fiscalStatus === "cancelled" ? "A" : "N"

    return {
      paymentRefNo: tx.documentNumber || `RC ${tx.documentSeries || "A"}/0`,
      atcud: tx.atcud || "0-0",
      period,
      transactionDate: paymentDate,
      paymentType: "RC" as const,
      documentStatus: {
        paymentStatus: status as "N" | "A",
        paymentStatusDate: systemEntryDate,
        sourceID: "Ledge",
        sourceBilling: "P" as const,
      },
      sourceID: "Ledge",
      systemEntryDate,
      customerID: tx.customerNif || "999999990",
      lines: [
        {
          lineNumber: "1",
          sourceDocumentID: [],
          creditAmount: roundDecimal(grossTotal),
          tax: {
            taxType: "IVA",
            taxCountryRegion: "PT",
            taxCode: getTaxCodeForRate(Number(tx.vatRate) || 0),
            taxPercentage: Number(tx.vatRate) || 0,
          },
        },
      ],
      documentTotals: {
        taxPayable: roundDecimal(taxPayable),
        netTotal: roundDecimal(netTotal),
        grossTotal: roundDecimal(grossTotal),
      },
    }
  })

  return {
    numberOfEntries: payments.length,
    totalDebit: roundDecimal(totalDebit),
    totalCredit: roundDecimal(totalCredit),
    payments,
  }
}

function roundDecimal(value: number): number {
  return Math.round(value * 100) / 100
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50)
}
