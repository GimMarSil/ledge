/**
 * Geração de QR Code para documentos fiscais portugueses
 * Conforme Portaria 195/2020
 *
 * Formato: campos separados por '*' com identificadores de campo
 * A:NIF_EMITENTE*B:NIF_ADQUIRENTE*C:PAIS*D:TIPO_DOC*E:ESTADO*
 * F:DATA*G:ID_DOC*H:ATCUD*I1:REGIAO_PT*...taxas...*N:IVA_TOTAL*O:TOTAL*Q:HASH*R:CERT_NO
 */

export interface QRCodeData {
  issuerNif: string // A - NIF do emitente
  buyerNif: string // B - NIF do adquirente ("999999990" = consumidor final)
  buyerCountry: string // C - País do adquirente (ISO 3166-1 alpha-2)
  documentType: string // D - Tipo de documento (FT, FR, NC, etc.)
  fiscalStatus: string // E - Estado do documento (N=Normal, A=Anulado, F=Faturado)
  documentDate: string // F - Data do documento (YYYYMMDD)
  documentId: string // G - Identificação do documento (FT A/1)
  atcud: string // H - ATCUD
  taxRegion: "PT" | "PT-AC" | "PT-MA" // I1/I2/I3... - Região fiscal
  taxBreakdown: TaxBreakdownEntry[] // Desdobramento IVA por taxa
  withholdingAmount?: number // S - Retenção na fonte
  totalTax: number // N - Total de impostos
  grossTotal: number // O - Total do documento
  hashControl: string // Q - 4 caracteres do hash
  certificateNumber?: string // R - Número do certificado AT (quando certificado)
}

export interface TaxBreakdownEntry {
  rate: number // Taxa percentual
  base: number // Base tributável
  vat: number // Valor IVA
}

export const CONSUMER_FINAL_NIF = "999999990"

export const TAX_FIELD_REGIONS: Record<string, QRCodeData["taxRegion"]> = {
  I: "PT",
  J: "PT-AC",
  K: "PT-MA",
}

function formatDecimal(value: number): string {
  return value.toFixed(2)
}

function getTaxFieldPrefix(region: string): string {
  switch (region) {
    case "PT":
      return "I"
    case "PT-AC":
      return "J"
    case "PT-MA":
      return "K"
    default:
      return "I"
  }
}

export function generateQRCodeString(data: QRCodeData): string {
  const fields: string[] = []

  fields.push(`A:${data.issuerNif}`)
  fields.push(`B:${data.buyerNif || CONSUMER_FINAL_NIF}`)
  fields.push(`C:${data.buyerCountry || "PT"}`)
  fields.push(`D:${data.documentType}`)
  fields.push(`E:${data.fiscalStatus}`)
  fields.push(`F:${data.documentDate}`)
  fields.push(`G:${data.documentId}`)
  fields.push(`H:${data.atcud}`)

  // Tax breakdown por região
  const prefix = getTaxFieldPrefix(data.taxRegion)

  // Exempt base (taxa 0)
  const exemptEntries = data.taxBreakdown.filter((t) => t.rate === 0)
  if (exemptEntries.length > 0) {
    const exemptBase = exemptEntries.reduce((sum, e) => sum + e.base, 0)
    fields.push(`${prefix}1:${formatDecimal(exemptBase)}`)
  }

  // Reduced rate
  const reducedEntries = data.taxBreakdown.filter((t) => t.rate > 0 && t.rate <= 6)
  if (reducedEntries.length > 0) {
    const base = reducedEntries.reduce((sum, e) => sum + e.base, 0)
    const vat = reducedEntries.reduce((sum, e) => sum + e.vat, 0)
    fields.push(`${prefix}2:${formatDecimal(base)}`)
    fields.push(`${prefix}3:${formatDecimal(vat)}`)
  }

  // Intermediate rate
  const intermediateEntries = data.taxBreakdown.filter((t) => t.rate > 6 && t.rate <= 13)
  if (intermediateEntries.length > 0) {
    const base = intermediateEntries.reduce((sum, e) => sum + e.base, 0)
    const vat = intermediateEntries.reduce((sum, e) => sum + e.vat, 0)
    fields.push(`${prefix}4:${formatDecimal(base)}`)
    fields.push(`${prefix}5:${formatDecimal(vat)}`)
  }

  // Normal rate
  const normalEntries = data.taxBreakdown.filter((t) => t.rate > 13)
  if (normalEntries.length > 0) {
    const base = normalEntries.reduce((sum, e) => sum + e.base, 0)
    const vat = normalEntries.reduce((sum, e) => sum + e.vat, 0)
    fields.push(`${prefix}6:${formatDecimal(base)}`)
    fields.push(`${prefix}7:${formatDecimal(vat)}`)
  }

  // Stamp tax (not typically used, but required field)
  // L:0.00 not needed if zero

  fields.push(`N:${formatDecimal(data.totalTax)}`)
  fields.push(`O:${formatDecimal(data.grossTotal)}`)

  if (data.withholdingAmount && data.withholdingAmount > 0) {
    fields.push(`S:${formatDecimal(data.withholdingAmount)}`)
  }

  fields.push(`Q:${data.hashControl}`)

  if (data.certificateNumber) {
    fields.push(`R:${data.certificateNumber}`)
  }

  return fields.join("*")
}
