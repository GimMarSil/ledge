"use server"

import { getCurrentUser } from "@/lib/auth"
import { setReimbursementStatus, ReimbursementStatus } from "@/models/reimbursements"
import { revalidatePath } from "next/cache"

const VALID_STATES: ReimbursementStatus[] = ["pending", "approved", "paid", "rejected"]

export async function setReimbursementStatusAction(
  transactionIds: string[],
  status: ReimbursementStatus
) {
  const user = await getCurrentUser()
  if (!VALID_STATES.includes(status)) {
    return { success: false, error: "Estado inválido" }
  }
  if (!transactionIds.length) {
    return { success: false, error: "Nenhuma transação selecionada" }
  }

  const result = await setReimbursementStatus(user.id, transactionIds, status)
  revalidatePath("/reimbursements")
  return { success: true, count: result.count }
}
