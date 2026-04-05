import type { SAFTHeader } from "./saft-types"
import type { User } from "@/prisma/client"

export function buildSAFTHeader(
  user: User,
  fiscalYear: string,
  startDate: string,
  endDate: string
): SAFTHeader {
  const addressParts = (user.businessAddress || "").split("\n")
  const addressDetail = addressParts[0] || ""
  const cityPostal = addressParts[1] || ""
  const cityMatch = cityPostal.match(/^(\d{4}-\d{3})?\s*(.*)$/)
  const postalCode = cityMatch?.[1] || ""
  const city = cityMatch?.[2] || cityPostal

  return {
    auditFileVersion: "1.04_01",
    companyID: user.businessNif || "000000000",
    taxRegistrationNumber: user.businessNif || "000000000",
    taxAccountingBasis: "F", // F = Faturação
    companyName: user.businessName || user.name,
    companyAddress: {
      addressDetail: addressDetail || "Sem morada",
      city: city || "Sem cidade",
      postalCode: postalCode || "0000-000",
      country: "PT",
    },
    fiscalYear,
    startDate,
    endDate,
    currencyCode: "EUR",
    dateCreated: new Date().toISOString().split("T")[0],
    taxEntity: "Global",
    productCompanyTaxID: "999999990", // NIF genérico até certificação
    softwareCertificateNumber: "0", // Não certificado
    productID: "Ledge/BuildFlow",
    productVersion: "1.0",
    email: user.email,
  }
}
