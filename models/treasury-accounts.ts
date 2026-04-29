import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { Prisma, TreasuryAccount } from "@/prisma/client"
import { cache } from "react"

export type TreasuryAccountData = {
  code?: string
  name: string
  type?: "company" | "personal"
  holderName?: string | null
  iban?: string | null
  bankName?: string | null
  isActive?: boolean
}

export const PERSONAL_ACCOUNT_CODE = "personal"

export const getTreasuryAccounts = cache(async (userId: string): Promise<TreasuryAccount[]> => {
  return prisma.treasuryAccount.findMany({
    where: { userId, isActive: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })
})

export const getTreasuryAccountByCode = cache(async (userId: string, code: string) => {
  return prisma.treasuryAccount.findUnique({
    where: { userId_code: { code, userId } },
  })
})

export const createTreasuryAccount = async (userId: string, data: TreasuryAccountData) => {
  const code = data.code || codeFromName(data.name)
  return prisma.treasuryAccount.create({
    data: {
      code,
      name: data.name,
      type: data.type ?? "company",
      holderName: data.holderName ?? null,
      iban: data.iban ?? null,
      bankName: data.bankName ?? null,
      isActive: data.isActive ?? true,
      user: { connect: { id: userId } },
    } as Prisma.TreasuryAccountCreateInput,
  })
}

export const updateTreasuryAccount = async (userId: string, code: string, data: TreasuryAccountData) => {
  return prisma.treasuryAccount.update({
    where: { userId_code: { code, userId } },
    data: {
      name: data.name,
      type: data.type,
      holderName: data.holderName,
      iban: data.iban,
      bankName: data.bankName,
      isActive: data.isActive,
    },
  })
}

export const deleteTreasuryAccount = async (userId: string, code: string) => {
  // Detach from existing transactions instead of cascading — losing the
  // payer on a historical expense is worse than an orphaned reference.
  await prisma.transaction.updateMany({
    where: { userId, treasuryAccountCode: code },
    data: { treasuryAccountCode: null },
  })
  return prisma.treasuryAccount.delete({
    where: { userId_code: { code, userId } },
  })
}

// Idempotent — used by the tenant provisioning flow to ensure every
// new tenant has a "personal" account so reimbursable expenses have a
// home from day one.
export const ensurePersonalTreasuryAccount = async (
  userId: string,
  holderName?: string | null
): Promise<TreasuryAccount> => {
  return prisma.treasuryAccount.upsert({
    where: { userId_code: { code: PERSONAL_ACCOUNT_CODE, userId } },
    update: {},
    create: {
      code: PERSONAL_ACCOUNT_CODE,
      name: "Conta Pessoal",
      type: "personal",
      holderName: holderName ?? null,
      isActive: true,
      user: { connect: { id: userId } },
    },
  })
}
