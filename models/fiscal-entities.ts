import { prisma } from "@/lib/db"
import { FiscalEntity } from "@/prisma/client"
import { cache } from "react"

export type FiscalEntityData = {
  nif: string
  name: string
  type: "customer" | "supplier"
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string
  email?: string | null
  phone?: string | null
}

export const getFiscalEntities = cache(
  async (userId: string, type?: "customer" | "supplier"): Promise<FiscalEntity[]> => {
    const where: { userId: string; type?: string } = { userId }
    if (type) where.type = type
    return await prisma.fiscalEntity.findMany({
      where,
      orderBy: { name: "asc" },
    })
  }
)

export const getFiscalEntityByNif = cache(
  async (userId: string, nif: string, type: "customer" | "supplier"): Promise<FiscalEntity | null> => {
    return await prisma.fiscalEntity.findUnique({
      where: { userId_nif_type: { userId, nif, type } },
    })
  }
)

export async function upsertFiscalEntity(userId: string, data: FiscalEntityData): Promise<FiscalEntity> {
  return await prisma.fiscalEntity.upsert({
    where: {
      userId_nif_type: {
        userId,
        nif: data.nif,
        type: data.type,
      },
    },
    update: {
      name: data.name,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country || "PT",
      email: data.email,
      phone: data.phone,
    },
    create: {
      userId,
      ...data,
      country: data.country || "PT",
    },
  })
}

export async function deleteFiscalEntity(id: string, userId: string): Promise<void> {
  await prisma.fiscalEntity.delete({
    where: { id, userId },
  })
}

export const searchFiscalEntities = cache(
  async (userId: string, query: string, type?: "customer" | "supplier"): Promise<FiscalEntity[]> => {
    const where: { userId: string; type?: string; OR: object[] } = {
      userId,
      OR: [
        { nif: { contains: query } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    }
    if (type) where.type = type

    return await prisma.fiscalEntity.findMany({
      where: where as any,
      orderBy: { name: "asc" },
      take: 10,
    })
  }
)
