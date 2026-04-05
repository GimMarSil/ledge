/**
 * Validação e formatação de NIF/NIPC português
 * Algoritmo: módulo 11 com pesos 9,8,7,6,5,4,3,2
 */

const VALID_PREFIXES = ["1", "2", "3", "5", "6", "7", "8", "9"]

export function validateNIF(nif: string): boolean {
  const cleaned = nif.replace(/[\s.-]/g, "")

  if (cleaned.length !== 9 || !/^\d{9}$/.test(cleaned)) {
    return false
  }

  if (!VALID_PREFIXES.includes(cleaned[0])) {
    return false
  }

  const weights = [9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleaned[i]) * weights[i]
  }

  const remainder = sum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder

  return parseInt(cleaned[8]) === checkDigit
}

export function formatNIF(nif: string): string {
  const cleaned = nif.replace(/[\s.-]/g, "")
  if (cleaned.length !== 9) return nif
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`
}

export function cleanNIF(nif: string): string {
  return nif.replace(/[\s.-]/g, "")
}
