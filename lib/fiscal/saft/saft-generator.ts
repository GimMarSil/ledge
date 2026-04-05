/**
 * Gerador SAF-T (PT) versão 1.04_01
 * Gera ficheiro XML completo conforme Portaria 321-A/2007
 */

import type { SAFTFile } from "./saft-types"
import { buildSAFTHeader } from "./saft-header"
import { buildSAFTMasterFiles } from "./saft-master-files"
import { buildSAFTSourceDocuments } from "./saft-source-documents"
import type { User, Transaction, FiscalEntity, TaxTable } from "@/prisma/client"

export interface SAFTGeneratorInput {
  user: User
  fiscalYear: string
  startDate: string
  endDate: string
  transactions: Transaction[]
  fiscalEntities: FiscalEntity[]
  taxTables: TaxTable[]
}

export function generateSAFTData(input: SAFTGeneratorInput): SAFTFile {
  return {
    header: buildSAFTHeader(input.user, input.fiscalYear, input.startDate, input.endDate),
    masterFiles: buildSAFTMasterFiles(input.fiscalEntities, input.taxTables, input.transactions),
    sourceDocuments: buildSAFTSourceDocuments(input.transactions),
  }
}

export function saftToXML(data: SAFTFile): string {
  const lines: string[] = []

  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push(
    '<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
  )

  // Header
  lines.push("  <Header>")
  lines.push(`    <AuditFileVersion>${escapeXml(data.header.auditFileVersion)}</AuditFileVersion>`)
  lines.push(`    <CompanyID>${escapeXml(data.header.companyID)}</CompanyID>`)
  lines.push(`    <TaxRegistrationNumber>${escapeXml(data.header.taxRegistrationNumber)}</TaxRegistrationNumber>`)
  lines.push(`    <TaxAccountingBasis>${data.header.taxAccountingBasis}</TaxAccountingBasis>`)
  lines.push(`    <CompanyName>${escapeXml(data.header.companyName)}</CompanyName>`)
  if (data.header.businessName) {
    lines.push(`    <BusinessName>${escapeXml(data.header.businessName)}</BusinessName>`)
  }
  lines.push("    <CompanyAddress>")
  lines.push(`      <AddressDetail>${escapeXml(data.header.companyAddress.addressDetail || "")}</AddressDetail>`)
  lines.push(`      <City>${escapeXml(data.header.companyAddress.city || "")}</City>`)
  lines.push(`      <PostalCode>${escapeXml(data.header.companyAddress.postalCode || "")}</PostalCode>`)
  lines.push(`      <Country>${data.header.companyAddress.country}</Country>`)
  lines.push("    </CompanyAddress>")
  lines.push(`    <FiscalYear>${data.header.fiscalYear}</FiscalYear>`)
  lines.push(`    <StartDate>${data.header.startDate}</StartDate>`)
  lines.push(`    <EndDate>${data.header.endDate}</EndDate>`)
  lines.push(`    <CurrencyCode>${data.header.currencyCode}</CurrencyCode>`)
  lines.push(`    <DateCreated>${data.header.dateCreated}</DateCreated>`)
  lines.push(`    <TaxEntity>${escapeXml(data.header.taxEntity)}</TaxEntity>`)
  lines.push(`    <ProductCompanyTaxID>${data.header.productCompanyTaxID}</ProductCompanyTaxID>`)
  lines.push(`    <SoftwareCertificateNumber>${data.header.softwareCertificateNumber}</SoftwareCertificateNumber>`)
  lines.push(`    <ProductID>${escapeXml(data.header.productID)}</ProductID>`)
  lines.push(`    <ProductVersion>${escapeXml(data.header.productVersion)}</ProductVersion>`)
  if (data.header.email) {
    lines.push(`    <Email>${escapeXml(data.header.email)}</Email>`)
  }
  lines.push("  </Header>")

  // MasterFiles
  lines.push("  <MasterFiles>")

  // Customers
  if (data.masterFiles.customers) {
    for (const customer of data.masterFiles.customers) {
      lines.push("    <Customer>")
      lines.push(`      <CustomerID>${escapeXml(customer.customerID)}</CustomerID>`)
      lines.push(`      <AccountID>${escapeXml(customer.accountID)}</AccountID>`)
      lines.push(`      <CustomerTaxID>${escapeXml(customer.customerTaxID)}</CustomerTaxID>`)
      lines.push(`      <CompanyName>${escapeXml(customer.companyName)}</CompanyName>`)
      lines.push("      <BillingAddress>")
      lines.push(`        <AddressDetail>${escapeXml(customer.billingAddress.addressDetail || "")}</AddressDetail>`)
      lines.push(`        <City>${escapeXml(customer.billingAddress.city || "")}</City>`)
      lines.push(`        <PostalCode>${escapeXml(customer.billingAddress.postalCode || "")}</PostalCode>`)
      lines.push(`        <Country>${customer.billingAddress.country}</Country>`)
      lines.push("      </BillingAddress>")
      lines.push(`      <SelfBillingIndicator>${customer.selfBillingIndicator}</SelfBillingIndicator>`)
      if (customer.email) lines.push(`      <Email>${escapeXml(customer.email)}</Email>`)
      if (customer.telephone) lines.push(`      <Telephone>${escapeXml(customer.telephone)}</Telephone>`)
      lines.push("    </Customer>")
    }
  }

  // Suppliers
  if (data.masterFiles.suppliers) {
    for (const supplier of data.masterFiles.suppliers) {
      lines.push("    <Supplier>")
      lines.push(`      <SupplierID>${escapeXml(supplier.supplierID)}</SupplierID>`)
      lines.push(`      <AccountID>${escapeXml(supplier.accountID)}</AccountID>`)
      lines.push(`      <SupplierTaxID>${escapeXml(supplier.supplierTaxID)}</SupplierTaxID>`)
      lines.push(`      <CompanyName>${escapeXml(supplier.companyName)}</CompanyName>`)
      lines.push("      <BillingAddress>")
      lines.push(`        <AddressDetail>${escapeXml(supplier.billingAddress.addressDetail || "")}</AddressDetail>`)
      lines.push(`        <City>${escapeXml(supplier.billingAddress.city || "")}</City>`)
      lines.push(`        <PostalCode>${escapeXml(supplier.billingAddress.postalCode || "")}</PostalCode>`)
      lines.push(`        <Country>${supplier.billingAddress.country}</Country>`)
      lines.push("      </BillingAddress>")
      lines.push(`      <SelfBillingIndicator>${supplier.selfBillingIndicator}</SelfBillingIndicator>`)
      if (supplier.email) lines.push(`      <Email>${escapeXml(supplier.email)}</Email>`)
      if (supplier.telephone) lines.push(`      <Telephone>${escapeXml(supplier.telephone)}</Telephone>`)
      lines.push("    </Supplier>")
    }
  }

  // Products
  if (data.masterFiles.products) {
    for (const product of data.masterFiles.products) {
      lines.push("    <Product>")
      lines.push(`      <ProductType>${product.productType}</ProductType>`)
      lines.push(`      <ProductCode>${escapeXml(product.productCode)}</ProductCode>`)
      if (product.productGroup) {
        lines.push(`      <ProductGroup>${escapeXml(product.productGroup)}</ProductGroup>`)
      }
      lines.push(`      <ProductDescription>${escapeXml(product.productDescription)}</ProductDescription>`)
      lines.push(`      <ProductNumberCode>${escapeXml(product.productNumberCode)}</ProductNumberCode>`)
      lines.push("    </Product>")
    }
  }

  // TaxTable
  if (data.masterFiles.taxTable) {
    lines.push("    <TaxTable>")
    for (const entry of data.masterFiles.taxTable) {
      lines.push("      <TaxTableEntry>")
      lines.push(`        <TaxType>${entry.taxType}</TaxType>`)
      lines.push(`        <TaxCountryRegion>${entry.taxCountryRegion}</TaxCountryRegion>`)
      lines.push(`        <TaxCode>${entry.taxCode}</TaxCode>`)
      lines.push(`        <Description>${escapeXml(entry.description)}</Description>`)
      if (entry.taxPercentage !== undefined) {
        lines.push(`        <TaxPercentage>${entry.taxPercentage.toFixed(2)}</TaxPercentage>`)
      }
      lines.push("      </TaxTableEntry>")
    }
    lines.push("    </TaxTable>")
  }

  lines.push("  </MasterFiles>")

  // SourceDocuments
  if (data.sourceDocuments) {
    lines.push("  <SourceDocuments>")

    // SalesInvoices
    if (data.sourceDocuments.salesInvoices) {
      const si = data.sourceDocuments.salesInvoices
      lines.push("    <SalesInvoices>")
      lines.push(`      <NumberOfEntries>${si.numberOfEntries}</NumberOfEntries>`)
      lines.push(`      <TotalDebit>${si.totalDebit.toFixed(2)}</TotalDebit>`)
      lines.push(`      <TotalCredit>${si.totalCredit.toFixed(2)}</TotalCredit>`)

      for (const invoice of si.invoices) {
        lines.push("      <Invoice>")
        lines.push(`        <InvoiceNo>${escapeXml(invoice.invoiceNo)}</InvoiceNo>`)
        lines.push(`        <ATCUD>${escapeXml(invoice.atcud)}</ATCUD>`)
        lines.push("        <DocumentStatus>")
        lines.push(`          <InvoiceStatus>${invoice.documentStatus.invoiceStatus}</InvoiceStatus>`)
        lines.push(`          <InvoiceStatusDate>${invoice.documentStatus.invoiceStatusDate}</InvoiceStatusDate>`)
        lines.push(`          <SourceID>${escapeXml(invoice.documentStatus.sourceID)}</SourceID>`)
        lines.push(`          <SourceBilling>${invoice.documentStatus.sourceBilling}</SourceBilling>`)
        lines.push("        </DocumentStatus>")
        lines.push(`        <Hash>${escapeXml(invoice.hash)}</Hash>`)
        lines.push(`        <HashControl>${escapeXml(invoice.hashControl)}</HashControl>`)
        lines.push(`        <Period>${invoice.period}</Period>`)
        lines.push(`        <InvoiceDate>${invoice.invoiceDate}</InvoiceDate>`)
        lines.push(`        <InvoiceType>${invoice.invoiceType}</InvoiceType>`)
        lines.push("        <SpecialRegimes>")
        lines.push(`          <SelfBillingIndicator>${invoice.specialRegimes.selfBillingIndicator}</SelfBillingIndicator>`)
        lines.push(`          <CashVATSchemeIndicator>${invoice.specialRegimes.cashVATSchemeIndicator}</CashVATSchemeIndicator>`)
        lines.push(`          <ThirdPartiesBillingIndicator>${invoice.specialRegimes.thirdPartiesBillingIndicator}</ThirdPartiesBillingIndicator>`)
        lines.push("        </SpecialRegimes>")
        lines.push(`        <SourceID>${escapeXml(invoice.sourceID)}</SourceID>`)
        lines.push(`        <SystemEntryDate>${invoice.systemEntryDate}</SystemEntryDate>`)
        lines.push(`        <CustomerID>${escapeXml(invoice.customerID)}</CustomerID>`)

        for (const line of invoice.lines) {
          lines.push("        <Line>")
          lines.push(`          <LineNumber>${line.lineNumber}</LineNumber>`)
          lines.push(`          <ProductCode>${escapeXml(line.productCode)}</ProductCode>`)
          lines.push(`          <ProductDescription>${escapeXml(line.productDescription)}</ProductDescription>`)
          lines.push(`          <Quantity>${line.quantity}</Quantity>`)
          lines.push(`          <UnitOfMeasure>${line.unitOfMeasure}</UnitOfMeasure>`)
          lines.push(`          <UnitPrice>${line.unitPrice.toFixed(2)}</UnitPrice>`)
          lines.push(`          <TaxPointDate>${line.taxPointDate}</TaxPointDate>`)
          lines.push(`          <Description>${escapeXml(line.description)}</Description>`)
          if (line.debitAmount !== undefined) {
            lines.push(`          <DebitAmount>${line.debitAmount.toFixed(2)}</DebitAmount>`)
          }
          if (line.creditAmount !== undefined) {
            lines.push(`          <CreditAmount>${line.creditAmount.toFixed(2)}</CreditAmount>`)
          }
          lines.push("          <Tax>")
          lines.push(`            <TaxType>${line.tax.taxType}</TaxType>`)
          lines.push(`            <TaxCountryRegion>${line.tax.taxCountryRegion}</TaxCountryRegion>`)
          lines.push(`            <TaxCode>${line.tax.taxCode}</TaxCode>`)
          lines.push(`            <TaxPercentage>${line.tax.taxPercentage.toFixed(2)}</TaxPercentage>`)
          lines.push("          </Tax>")
          if (line.taxExemptionReason) {
            lines.push(`          <TaxExemptionReason>${escapeXml(line.taxExemptionReason)}</TaxExemptionReason>`)
          }
          if (line.taxExemptionCode) {
            lines.push(`          <TaxExemptionCode>${line.taxExemptionCode}</TaxExemptionCode>`)
          }
          lines.push("        </Line>")
        }

        lines.push("        <DocumentTotals>")
        lines.push(`          <TaxPayable>${invoice.documentTotals.taxPayable.toFixed(2)}</TaxPayable>`)
        lines.push(`          <NetTotal>${invoice.documentTotals.netTotal.toFixed(2)}</NetTotal>`)
        lines.push(`          <GrossTotal>${invoice.documentTotals.grossTotal.toFixed(2)}</GrossTotal>`)
        lines.push("        </DocumentTotals>")
        lines.push("      </Invoice>")
      }

      lines.push("    </SalesInvoices>")
    }

    // Payments
    if (data.sourceDocuments.payments) {
      const p = data.sourceDocuments.payments
      lines.push("    <Payments>")
      lines.push(`      <NumberOfEntries>${p.numberOfEntries}</NumberOfEntries>`)
      lines.push(`      <TotalDebit>${p.totalDebit.toFixed(2)}</TotalDebit>`)
      lines.push(`      <TotalCredit>${p.totalCredit.toFixed(2)}</TotalCredit>`)

      for (const payment of p.payments) {
        lines.push("      <Payment>")
        lines.push(`        <PaymentRefNo>${escapeXml(payment.paymentRefNo)}</PaymentRefNo>`)
        lines.push(`        <ATCUD>${escapeXml(payment.atcud)}</ATCUD>`)
        lines.push(`        <Period>${payment.period}</Period>`)
        lines.push(`        <TransactionDate>${payment.transactionDate}</TransactionDate>`)
        lines.push(`        <PaymentType>${payment.paymentType}</PaymentType>`)
        lines.push("        <DocumentStatus>")
        lines.push(`          <PaymentStatus>${payment.documentStatus.paymentStatus}</PaymentStatus>`)
        lines.push(`          <PaymentStatusDate>${payment.documentStatus.paymentStatusDate}</PaymentStatusDate>`)
        lines.push(`          <SourceID>${escapeXml(payment.documentStatus.sourceID)}</SourceID>`)
        lines.push(`          <SourceBilling>${payment.documentStatus.sourceBilling}</SourceBilling>`)
        lines.push("        </DocumentStatus>")
        lines.push(`        <SourceID>${escapeXml(payment.sourceID)}</SourceID>`)
        lines.push(`        <SystemEntryDate>${payment.systemEntryDate}</SystemEntryDate>`)
        lines.push(`        <CustomerID>${escapeXml(payment.customerID)}</CustomerID>`)

        for (const line of payment.lines) {
          lines.push("        <Line>")
          lines.push(`          <LineNumber>${line.lineNumber}</LineNumber>`)
          if (line.debitAmount !== undefined) {
            lines.push(`          <DebitAmount>${line.debitAmount.toFixed(2)}</DebitAmount>`)
          }
          if (line.creditAmount !== undefined) {
            lines.push(`          <CreditAmount>${line.creditAmount.toFixed(2)}</CreditAmount>`)
          }
          lines.push("          <Tax>")
          lines.push(`            <TaxType>${line.tax.taxType}</TaxType>`)
          lines.push(`            <TaxCountryRegion>${line.tax.taxCountryRegion}</TaxCountryRegion>`)
          lines.push(`            <TaxCode>${line.tax.taxCode}</TaxCode>`)
          lines.push(`            <TaxPercentage>${line.tax.taxPercentage.toFixed(2)}</TaxPercentage>`)
          lines.push("          </Tax>")
          lines.push("        </Line>")
        }

        lines.push("        <DocumentTotals>")
        lines.push(`          <TaxPayable>${payment.documentTotals.taxPayable.toFixed(2)}</TaxPayable>`)
        lines.push(`          <NetTotal>${payment.documentTotals.netTotal.toFixed(2)}</NetTotal>`)
        lines.push(`          <GrossTotal>${payment.documentTotals.grossTotal.toFixed(2)}</GrossTotal>`)
        lines.push("        </DocumentTotals>")
        lines.push("      </Payment>")
      }

      lines.push("    </Payments>")
    }

    lines.push("  </SourceDocuments>")
  }

  lines.push("</AuditFile>")

  return lines.join("\n")
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
