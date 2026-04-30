"use server"

import { getCurrentUser } from "@/lib/auth"
import { reclaimStorage } from "@/models/storage"
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
  // Reclaim disk and refresh the profile's storage gauge.
  await reclaimStorage(user.id)
  revalidatePath("/trash")
  revalidatePath("/settings/profile")
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
  await reclaimStorage(user.id)
  revalidatePath("/trash")
  revalidatePath("/settings/profile")
  return { success: true, count: ids.length }
}

/**
 * Manual "Recuperar espaço" button — drops any File row not referenced
 * by a live transaction, removes the matching files from disk and
 * recalculates the storage counter. Useful after a big bulk-delete.
 */
export async function reclaimStorageAction() {
  const user = await getCurrentUser()
  const result = await reclaimStorage(user.id)
  revalidatePath("/trash")
  revalidatePath("/settings/profile")
  return { success: true, ...result }
}
