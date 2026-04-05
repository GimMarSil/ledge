import type { SAFTMasterFiles, SAFTCustomer, SAFTSupplier, SAFTProduct, SAFTTaxTableEntry } from "./saft-types"
import type { FiscalEntity, TaxTable, Transaction } from "@/prisma/client"

export function buildSAFTMasterFiles(
  fiscalEntities: FiscalEntity[],
  taxTables: TaxTable[],
  transactions: Transaction[]
): SAFTMasterFiles {
  const customers = fiscalEntities
    .filter((e) => e.type === "customer")
    .map(entityToCustomer)

  const suppliers = fiscalEntities
    .filter((e) => e.type === "supplier")
    .map(entityToSupplier)

  // Garantir que existe pelo menos o "Consumidor Final"
  if (!customers.find((c) => c.customerTaxID === "999999990")) {
    customers.unshift({
      customerID: "CF",
      accountID: "Desconhecido",
      customerTaxID: "999999990",
      companyName: "Consumidor Final",
      billingAddress: { addressDetail: "Desconhecido", city: "Desconhecido", postalCode: "0000-000", country: "PT" },
      selfBillingIndicator: "0",
    })
  }

  // Extrair produtos únicos das transações
  const products = extractProductsFromTransactions(transactions)

  // Tax table entries
  const taxTableEntries = taxTables.map(taxTableToEntry)

  return {
    customers: customers.length > 0 ? customers : undefined,
    suppliers: suppliers.length > 0 ? suppliers : undefined,
    products: products.length > 0 ? products : undefined,
    taxTable: taxTableEntries.length > 0 ? taxTableEntries : undefined,
  }
}

function entityToCustomer(entity: FiscalEntity): SAFTCustomer {
  return {
    customerID: entity.nif,
    accountID: "Desconhecido",
    customerTaxID: entity.nif,
    companyName: entity.name,
    billingAddress: {
      addressDetail: entity.address || "Desconhecido",
      city: entity.city || "Desconhecido",
      postalCode: entity.postalCode || "0000-000",
      country: entity.country,
    },
    selfBillingIndicator: "0",
    email: entity.email || undefined,
    telephone: entity.phone || undefined,
  }
}

function entityToSupplier(entity: FiscalEntity): SAFTSupplier {
  return {
    supplierID: entity.nif,
    accountID: "Desconhecido",
    supplierTaxID: entity.nif,
    companyName: entity.name,
    billingAddress: {
      addressDetail: entity.address || "Desconhecido",
      city: entity.city || "Desconhecido",
      postalCode: entity.postalCode || "0000-000",
      country: entity.country,
    },
    selfBillingIndicator: "0",
    email: entity.email || undefined,
    telephone: entity.phone || undefined,
  }
}

function taxTableToEntry(table: TaxTable): SAFTTaxTableEntry {
  return {
    taxType: table.taxType,
    taxCountryRegion: table.region,
    taxCode: table.taxCode,
    description: table.description,
    taxPercentage: Number(table.rate),
  }
}

function extractProductsFromTransactions(transactions: Transaction[]): SAFTProduct[] {
  const productMap = new Map<string, SAFTProduct>()

  for (const tx of transactions) {
    const items = Array.isArray(tx.items) ? (tx.items as any[]) : []
    if (items.length > 0) {
      for (const item of items) {
        const code = item.name ? slugify(item.name) : `item-${productMap.size + 1}`
        if (!productMap.has(code)) {
          productMap.set(code, {
            productType: "S",
            productCode: code,
            productDescription: item.name || "Sem descrição",
            productNumberCode: code,
          })
        }
      }
    } else if (tx.name) {
      const code = slugify(tx.name)
      if (!productMap.has(code)) {
        productMap.set(code, {
          productType: "S",
          productCode: code,
          productDescription: tx.name,
          productNumberCode: code,
        })
      }
    }
  }

  return Array.from(productMap.values())
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
