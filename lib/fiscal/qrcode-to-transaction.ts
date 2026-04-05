/**
 * Mapeamento de dados QR code e-fatura para TransactionData
 * e merge com resultados da análise LLM.
 */

import { QRCodeData } from "./qrcode"
import { TransactionData } from "@/models/transactions"

/**
 * Converte QRCodeData para campos TransactionData.
 * Inclui também a string raw do QR code no campo `qrCode`.
 */
export function qrCodeDataToTransactionFields(qr: QRCodeData, rawQRString: string): Partial<TransactionData> {
  const fields: Partial<TransactionData> = {
    nif: qr.issuerNif,
    customerNif: qr.buyerNif,
    documentType: qr.documentType,
    documentNumber: qr.documentId,
    atcud: qr.atcud || undefined,
    hashControl: qr.hashControl,
    total: qr.grossTotal,
    vatAmount: qr.totalTax,
    subtotal: parseFloat((qr.grossTotal - qr.totalTax).toFixed(2)),
    qrCode: rawQRString,
  }

  // Data do documento: YYYYMMDD -> YYYY-MM-DD
  if (qr.documentDate && qr.documentDate.length === 8) {
    const y = qr.documentDate.substring(0, 4)
    const m = qr.documentDate.substring(4, 6)
    const d = qr.documentDate.substring(6, 8)
    fields.issuedAt = `${y}-${m}-${d}`
  }

  // VAT breakdown
  if (qr.taxBreakdown.length > 0) {
    fields.vatBreakdown = qr.taxBreakdown.map((t) => ({
      rate: t.rate,
      base: t.base,
      vat: t.vat,
    }))

    // Se só há uma taxa, preencher vatRate
    if (qr.taxBreakdown.length === 1) {
      fields.vatRate = qr.taxBreakdown[0].rate
    }
  }

  // Withholding
  if (qr.withholdingAmount && qr.withholdingAmount > 0) {
    fields.withholdingAmount = qr.withholdingAmount
  }

  // Fiscal status: E field -> N=issued, A=cancelled, F=issued (faturado)
  if (qr.fiscalStatus) {
    switch (qr.fiscalStatus) {
      case "N":
      case "F":
        fields.fiscalStatus = "issued"
        break
      case "A":
        fields.fiscalStatus = "cancelled"
        break
    }
  }

  return fields
}

// Campos fiscais/numéricos onde o QR code é autoritativo (mais fiável que LLM)
const QR_AUTHORITATIVE_FIELDS = new Set([
  "nif",
  "customerNif",
  "documentType",
  "documentNumber",
  "atcud",
  "hashControl",
  "total",
  "subtotal",
  "vatAmount",
  "vatRate",
  "vatBreakdown",
  "issuedAt",
  "fiscalStatus",
  "qrCode",
  "withholdingAmount",
])

/**
 * Faz merge dos dados extraídos do QR code com o output da análise LLM.
 *
 * Estratégia:
 * - QR code ganha nos campos fiscais/numéricos (são dados máquina, assinados pela AT)
 * - LLM ganha nos campos descritivos (name, merchant, items, category, project)
 * - Se um campo está vazio num lado, usa o valor do outro
 */
export function mergeQRCodeWithAnalysis(
  qrFields: Partial<TransactionData>,
  llmOutput: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...llmOutput }

  for (const [key, qrValue] of Object.entries(qrFields)) {
    if (qrValue === undefined || qrValue === null) continue

    if (QR_AUTHORITATIVE_FIELDS.has(key)) {
      // QR code wins for fiscal fields
      merged[key] = qrValue
    } else if (merged[key] === undefined || merged[key] === null || merged[key] === "") {
      // Fallback: use QR value if LLM didn't provide it
      merged[key] = qrValue
    }
  }

  return merged
}
