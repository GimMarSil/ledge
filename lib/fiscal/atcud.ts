/**
 * ATCUD - Código Único de Documento
 * Formato: CODIGO_VALIDACAO-NUMERO_SEQUENCIAL
 *
 * O código de validação é obtido da AT ao registar uma série.
 * Até certificação, pode ser preenchido manualmente.
 */

export function generateATCUD(seriesValidationCode: string, sequentialNumber: number): string {
  if (!seriesValidationCode) {
    return `0-${sequentialNumber}`
  }
  return `${seriesValidationCode}-${sequentialNumber}`
}

export function parseATCUD(atcud: string): { validationCode: string; sequentialNumber: number } | null {
  const parts = atcud.split("-")
  if (parts.length !== 2) return null

  const sequentialNumber = parseInt(parts[1])
  if (isNaN(sequentialNumber)) return null

  return {
    validationCode: parts[0],
    sequentialNumber,
  }
}
