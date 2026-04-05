/**
 * TypeScript interfaces para SAF-T (PT) versão 1.04_01
 * Conforme Portaria 321-A/2007 e atualizações
 */

export interface SAFTFile {
  header: SAFTHeader
  masterFiles: SAFTMasterFiles
  sourceDocuments?: SAFTSourceDocuments
}

export interface SAFTHeader {
  auditFileVersion: string // "1.04_01"
  companyID: string // NIF da empresa
  taxRegistrationNumber: string // NIF
  taxAccountingBasis: "C" | "E" | "F" | "I" | "P" | "R" | "S" | "T" // C=Contabilidade, F=Faturação, etc.
  companyName: string
  businessName?: string
  companyAddress: SAFTAddress
  fiscalYear: string // "2026"
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  currencyCode: string // "EUR"
  dateCreated: string // YYYY-MM-DD
  taxEntity: string // "Global"
  productCompanyTaxID: string // NIF do produtor de software
  softwareCertificateNumber: string // "0" se não certificado
  productID: string // "Ledge/1.0"
  productVersion: string // "1.0"
  headerComment?: string
  telephone?: string
  fax?: string
  email?: string
  website?: string
}

export interface SAFTAddress {
  addressDetail?: string
  city?: string
  postalCode?: string
  region?: string
  country: string // ISO 3166-1 alpha-2
}

export interface SAFTMasterFiles {
  customers?: SAFTCustomer[]
  suppliers?: SAFTSupplier[]
  products?: SAFTProduct[]
  taxTable?: SAFTTaxTableEntry[]
}

export interface SAFTCustomer {
  customerID: string
  accountID: string // "Desconhecido" se não tem conta contabilística
  customerTaxID: string // NIF
  companyName: string
  billingAddress: SAFTAddress
  selfBillingIndicator: "0" | "1"
  telephone?: string
  email?: string
}

export interface SAFTSupplier {
  supplierID: string
  accountID: string
  supplierTaxID: string
  companyName: string
  billingAddress: SAFTAddress
  selfBillingIndicator: "0" | "1"
  telephone?: string
  email?: string
}

export interface SAFTProduct {
  productType: "P" | "S" | "O" | "E" | "I" // P=Produto, S=Serviço, O=Outro, E=Excise, I=Imposto
  productCode: string
  productGroup?: string
  productDescription: string
  productNumberCode: string
}

export interface SAFTTaxTableEntry {
  taxType: string // "IVA", "IS"
  taxCountryRegion: string // "PT", "PT-AC", "PT-MA"
  taxCode: string // "NOR", "INT", "RED", "ISE"
  description: string
  taxPercentage?: number
  taxAmount?: number
}

export interface SAFTSourceDocuments {
  salesInvoices?: SAFTSalesInvoices
  payments?: SAFTPayments
}

export interface SAFTSalesInvoices {
  numberOfEntries: number
  totalDebit: number
  totalCredit: number
  invoices: SAFTInvoice[]
}

export interface SAFTInvoice {
  invoiceNo: string // "FT A/1"
  atcud: string
  documentStatus: SAFTDocumentStatus
  hash: string
  hashControl: string
  period: string // "01" a "12"
  invoiceDate: string // YYYY-MM-DD
  invoiceType: string // "FT", "FR", "NC", "ND"
  specialRegimes: SAFTSpecialRegimes
  sourceID: string // Utilizador que criou
  systemEntryDate: string // YYYY-MM-DDTHH:MM:SS
  customerID: string
  lines: SAFTInvoiceLine[]
  documentTotals: SAFTDocumentTotals
}

export interface SAFTDocumentStatus {
  invoiceStatus: "N" | "A" | "F" | "R" | "S" // N=Normal, A=Anulado, F=Faturado
  invoiceStatusDate: string // YYYY-MM-DDTHH:MM:SS
  sourceID: string
  sourceBilling: "P" | "I" | "M" // P=Programa, I=Integrado, M=Manual
}

export interface SAFTSpecialRegimes {
  selfBillingIndicator: "0" | "1"
  cashVATSchemeIndicator: "0" | "1"
  thirdPartiesBillingIndicator: "0" | "1"
}

export interface SAFTInvoiceLine {
  lineNumber: string
  productCode: string
  productDescription: string
  quantity: number
  unitOfMeasure: string
  unitPrice: number
  taxPointDate: string // YYYY-MM-DD
  description: string
  debitAmount?: number
  creditAmount?: number
  tax: SAFTLineTax
  taxExemptionReason?: string
  taxExemptionCode?: string
  settlementAmount?: number
}

export interface SAFTLineTax {
  taxType: string // "IVA"
  taxCountryRegion: string // "PT"
  taxCode: string // "NOR", "INT", "RED", "ISE"
  taxPercentage: number
}

export interface SAFTDocumentTotals {
  taxPayable: number
  netTotal: number
  grossTotal: number
  currency?: {
    currencyCode: string
    currencyAmount: number
    exchangeRate: number
  }
}

export interface SAFTPayments {
  numberOfEntries: number
  totalDebit: number
  totalCredit: number
  payments: SAFTPayment[]
}

export interface SAFTPayment {
  paymentRefNo: string
  atcud: string
  period: string
  transactionID?: string
  transactionDate: string
  paymentType: "RC" | "RG"
  description?: string
  systemID?: string
  documentStatus: {
    paymentStatus: "N" | "A"
    paymentStatusDate: string
    sourceID: string
    sourceBilling: "P" | "I" | "M"
  }
  paymentMethod?: {
    paymentMechanism: string
    paymentAmount: number
    paymentDate: string
  }[]
  sourceID: string
  systemEntryDate: string
  customerID: string
  lines: SAFTPaymentLine[]
  documentTotals: SAFTDocumentTotals
}

export interface SAFTPaymentLine {
  lineNumber: string
  sourceDocumentID: {
    originatingON: string
    invoiceDate: string
    description: string
  }[]
  debitAmount?: number
  creditAmount?: number
  tax: SAFTLineTax
  taxExemptionReason?: string
  taxExemptionCode?: string
}
