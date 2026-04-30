"use server"

import { getCurrentUser } from "@/lib/auth"
import { hardDeleteTransaction, restoreTransaction } from "@/models/transactions"
import { revalidatePath } from "next/cache"

export async function restoreTransactionAction(id: string) {
  const user = await getCurrentUser()
  await restoreTransaction(id, user.id)
  revalidatePath("/trash")
  revalidatePath("/transactions")
  return { success: true }
}

export async function hardDeleteTransactionAction(id: string) {
  const user = await getCurrentUser()
  await hardDeleteTransaction(id, user.id)
  revalidatePath("/trash")
  return { success: true }
}

export async function bulkRestoreAction(ids: string[]) {
  const user = await getCurrentUser()
  for (const id of ids) await restoreTransaction(id, user.id)
  revalidatePath("/trash")
  revalidatePath("/transactions")
  return { success: true, count: ids.length }
}

export async function bulkHardDeleteAction(ids: string[]) {
  const user = await getCurrentUser()
  for (const id of ids) await hardDeleteTransaction(id, user.id)
  revalidatePath("/trash")
  return { success: true, count: ids.length }
}
