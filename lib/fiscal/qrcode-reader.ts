/**
 * Leitura e parsing de QR Codes de faturas portuguesas (e-fatura)
 * Conforme Portaria 195/2020
 *
 * Inverso de generateQRCodeString() em qrcode.ts
 */

import { QRCodeData, TaxBreakdownEntry, TAX_FIELD_REGIONS } from "./qrcode"
import { IVA_RATES, type TaxRegion } from "./document-types"

/**
 * Valida se um texto decodificado de QR code corresponde ao formato e-fatura português.
 * Verifica presença dos campos obrigatórios A (NIF emitente), N (total impostos) e O (total documento).
 */
export function isPortugueseQRCode(text: string): boolean {
  return text.startsWith("A:") && text.includes("*N:") && text.includes("*O:") && text.includes("*Q:")
}

/**
 * Faz parse de uma string QR code no formato e-fatura português para QRCodeData.
 *
 * Formato: "A:509123456*B:999999990*C:PT*D:FT*E:N*F:20260404*G:FT A/1*H:ATCUD*I7:100.00*I8:23.00*N:23.00*O:123.00*Q:ABCD*R:1234"
 */
export function parseQRCodeString(raw: string): QRCodeData | null {
  if (!isPortugueseQRCode(raw)) return null

  // Parse all fields into a map
  const fields = new Map<string, string>()
  for (const pair of raw.split("*")) {
    const colonIdx = pair.indexOf(":")
    if (colonIdx === -1) continue
    const key = pair.substring(0, colonIdx)
    const value = pair.substring(colonIdx + 1)
    fields.set(key, value)
  }

  // Validate required fields
  const issuerNif = fields.get("A")
  const documentType = fields.get("D")
  const documentDate = fields.get("F")
  const totalTax = fields.get("N")
  const grossTotal = fields.get("O")
  const hashControl = fields.get("Q")

  if (!issuerNif || !documentType || !documentDate || !totalTax || !grossTotal || !hashControl) {
    return null
  }

  // Detect tax region from which prefix (I/J/K) has fields
  let taxRegion: QRCodeData["taxRegion"] = "PT"
  for (const [prefix, region] of Object.entries(TAX_FIELD_REGIONS)) {
    // Check if any field starts with this prefix followed by a digit
    for (const key of fields.keys()) {
      if (key.length >= 2 && key[0] === prefix && key[1] >= "1" && key[1] <= "8") {
        taxRegion = region
        break
      }
    }
  }

  // Reconstruct tax breakdown
  const taxBreakdown = parseTaxBreakdown(fields, taxRegion)

  return {
    issuerNif,
    buyerNif: fields.get("B") || "999999990",
    buyerCountry: fields.get("C") || "PT",
    documentType,
    fiscalStatus: fields.get("E") || "N",
    documentDate,
    documentId: fields.get("G") || "",
    atcud: fields.get("H") || "",
    taxRegion,
    taxBreakdown,
    totalTax: parseFloat(totalTax),
    grossTotal: parseFloat(grossTotal),
    withholdingAmount: fields.has("S") ? parseFloat(fields.get("S")!) : undefined,
    hashControl,
    certificateNumber: fields.get("R"),
  }
}

/**
 * Reconstroi o array de taxBreakdown a partir dos campos I/J/K do QR code.
 *
 * Campos por prefixo (I para PT, J para PT-AC, K para PT-MA):
 *   {prefix}1 = base tributável isenta (rate 0%)
 *   {prefix}2 = base tributável taxa reduzida
 *   {prefix}3 = IVA taxa reduzida
 *   {prefix}4 = base tributável taxa intermédia
 *   {prefix}5 = IVA taxa intermédia
 *   {prefix}6 = base tributável taxa normal
 *   {prefix}7 = IVA taxa normal
 */
function parseTaxBreakdown(fields: Map<string, string>, region: TaxRegion): TaxBreakdownEntry[] {
  const rates = IVA_RATES[region]
  const prefix = Object.entries(TAX_FIELD_REGIONS).find(([, r]) => r === region)?.[0] || "I"
  const breakdown: TaxBreakdownEntry[] = []

  // Exempt (rate 0%)
  const exemptBase = fields.get(`${prefix}1`)
  if (exemptBase) {
    breakdown.push({ rate: 0, base: parseFloat(exemptBase), vat: 0 })
  }

  // Reduced rate
  const reducedBase = fields.get(`${prefix}2`)
  const reducedVat = fields.get(`${prefix}3`)
  if (reducedBase && reducedVat) {
    breakdown.push({ rate: rates.RED.rate, base: parseFloat(reducedBase), vat: parseFloat(reducedVat) })
  }

  // Intermediate rate
  const intermediateBase = fields.get(`${prefix}4`)
  const intermediateVat = fields.get(`${prefix}5`)
  if (intermediateBase && intermediateVat) {
    breakdown.push({
      rate: rates.INT.rate,
      base: parseFloat(intermediateBase),
      vat: parseFloat(intermediateVat),
    })
  }

  // Normal rate
  const normalBase = fields.get(`${prefix}6`)
  const normalVat = fields.get(`${prefix}7`)
  if (normalBase && normalVat) {
    breakdown.push({ rate: rates.NOR.rate, base: parseFloat(normalBase), vat: parseFloat(normalVat) })
  }

  return breakdown
}
