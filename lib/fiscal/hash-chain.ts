/**
 * Hash chain para documentos fiscais portugueses
 *
 * Cada documento contém um hash RSA-SHA1 encadeado ao documento anterior.
 * Input: "InvoiceDate;SystemEntryDate;InvoiceNo;GrossTotal;PreviousHash"
 * O HashControl são os caracteres nas posições 1-4 do hash Base64.
 *
 * NOTA: A chave RSA deve ser certificada pela AT para validade legal.
 * Sem certificação, o hash funciona para SAF-T mas não tem valor legal.
 */

import { createSign } from "crypto"

export interface HashInput {
  invoiceDate: string // formato YYYY-MM-DD
  systemEntryDate: string // formato YYYY-MM-DDTHH:MM:SS
  invoiceNo: string // ex: "FT A/1"
  grossTotal: string // ex: "123.45" (2 casas decimais)
  previousHash: string // hash do documento anterior, ou "" para o primeiro
}

export function generateDocumentHash(input: HashInput, privateKeyPem: string): string {
  const dataToSign = [
    input.invoiceDate,
    input.systemEntryDate,
    input.invoiceNo,
    input.grossTotal,
    input.previousHash,
  ].join(";")

  const sign = createSign("RSA-SHA1")
  sign.update(dataToSign)
  sign.end()

  return sign.sign(privateKeyPem, "base64")
}

export function extractHashControl(fullHash: string): string {
  if (fullHash.length < 4) return fullHash
  return fullHash.substring(0, 4)
}

export function getHashInputString(input: HashInput): string {
  return [input.invoiceDate, input.systemEntryDate, input.invoiceNo, input.grossTotal, input.previousHash].join(";")
}
