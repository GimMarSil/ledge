import { prisma } from "@/lib/db"
import { TaxTable } from "@/prisma/client"
import { cache } from "react"
import { IVA_RATES, type TaxRegion } from "@/lib/fiscal/document-types"

export const getTaxTables = cache(async (userId: string): Promise<TaxTable[]> => {
  return await prisma.taxTable.findMany({
    where: { userId },
    orderBy: [{ region: "asc" }, { rate: "desc" }],
  })
})

export const getActiveTaxTables = cache(async (userId: string): Promise<TaxTable[]> => {
  return await prisma.taxTable.findMany({
    where: {
      userId,
      OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
    },
    orderBy: [{ region: "asc" }, { rate: "desc" }],
  })
})

export async function createDefaultTaxTables(userId: string): Promise<void> {
  const regions = Object.entries(IVA_RATES) as [TaxRegion, (typeof IVA_RATES)[TaxRegion]][]

  for (const [region, rates] of regions) {
    for (const [taxCode, info] of Object.entries(rates)) {
      await prisma.taxTable.upsert({
        where: {
          userId_taxType_region_taxCode_validFrom: {
            userId,
            taxType: "IVA",
            region,
            taxCode,
            validFrom: new Date("2024-01-01"),
          },
        },
        update: {},
        create: {
          userId,
          taxType: "IVA",
          region,
          taxCode,
          description: info.description,
          rate: info.rate,
          validFrom: new Date("2024-01-01"),
        },
      })
    }
  }
}

export function getTaxCodeForRate(rate: number, region: TaxRegion = "PT"): string {
  const regionRates = IVA_RATES[region]
  if (rate === 0) return "ISE"
  if (rate === regionRates.RED.rate) return "RED"
  if (rate === regionRates.INT.rate) return "INT"
  if (rate === regionRates.NOR.rate) return "NOR"
  return "NOR"
}
