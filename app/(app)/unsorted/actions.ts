"use server"

import { AnalysisResult, analyzeTransaction } from "@/ai/analyze"
import { AnalyzeAttachment, loadAttachmentsForAI } from "@/ai/attachments"
import { buildLLMPrompt } from "@/ai/prompt"
import { fieldsToJsonSchema } from "@/ai/schema"
import { transactionFormSchema } from "@/forms/transactions"
import { ActionState } from "@/lib/actions"
import { getCurrentUser, isAiBalanceExhausted, isSubscriptionExpired } from "@/lib/auth"
import {
  fullPathForFile,
  getDirectorySize,
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  safePathJoin,
  unsortedFilePath,
} from "@/lib/files"
import { extractQRCodeFromFile } from "@/lib/fiscal/qrcode-extract"
import { generateQRCodeString } from "@/lib/fiscal/qrcode"
import { mergeQRCodeWithAnalysis, qrCodeDataToTransactionFields } from "@/lib/fiscal/qrcode-to-transaction"
import { DEFAULT_PROMPT_ANALYSE_NEW_FILE } from "@/models/defaults"
import { createFile, deleteFile, getFileById, updateFile } from "@/models/files"
import { createTransaction, TransactionData, updateTransactionFiles } from "@/models/transactions"
import { updateUser } from "@/models/users"
import { Category, Field, File, Project, Transaction } from "@/prisma/client"
import { randomUUID } from "crypto"
import { mkdir, readFile, rename, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

export async function analyzeFileAction(
  file: File,
  settings: Record<string, string>,
  fields: Field[],
  categories: Category[],
  projects: Project[]
): Promise<ActionState<AnalysisResult>> {
  const user = await getCurrentUser()

  if (!file || file.userId !== user.id) {
    return { success: false, error: "File not found or does not belong to the user" }
  }

  if (isAiBalanceExhausted(user)) {
    return {
      success: false,
      error: "You used all of your pre-paid AI scans, please upgrade your account or buy new subscription plan",
    }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
    }
  }

  // Step 1: Tentar extrair QR code do ficheiro (grátis, rápido, determinístico)
  let qrFields: Partial<TransactionData> = {}
  let qrRawString = ""
  try {
    const filePath = fullPathForFile(user, file)
    const qrData = await extractQRCodeFromFile(filePath, file.mimetype)
    if (qrData) {
      qrRawString = generateQRCodeString(qrData)
      qrFields = qrCodeDataToTransactionFields(qrData, qrRawString)
      console.log("QR code e-fatura extraído:", qrFields)
    }
  } catch (error) {
    console.warn("Extração de QR code falhou (continuando com LLM):", error)
  }

  // Step 2: Carregar attachments para análise LLM
  let attachments: AnalyzeAttachment[] = []
  try {
    attachments = await loadAttachmentsForAI(user, file)
  } catch (error) {
    return { success: false, error: "Failed to retrieve files: " + error }
  }

  // Step 3: Construir prompt (enriquecido com dados QR se disponíveis)
  let prompt = buildLLMPrompt(
    settings.prompt_analyse_new_file || DEFAULT_PROMPT_ANALYSE_NEW_FILE,
    fields,
    categories,
    projects
  )

  if (Object.keys(qrFields).length > 0) {
    prompt += `\n\nDados já extraídos automaticamente do QR code da fatura (usar como referência fidedigna para campos fiscais):\n- NIF emitente: ${qrFields.nif || "N/A"}\n- Tipo documento: ${qrFields.documentType || "N/A"}\n- Nº documento: ${qrFields.documentNumber || "N/A"}\n- Data: ${qrFields.issuedAt || "N/A"}\n- Total: ${qrFields.total || "N/A"}\n- IVA: ${qrFields.vatAmount || "N/A"}\n- ATCUD: ${qrFields.atcud || "N/A"}`
  }

  // Step 4: Análise LLM
  const schema = fieldsToJsonSchema(fields)
  const results = await analyzeTransaction(prompt, schema, attachments, file.id, user.id)

  // Step 5: Merge QR data com output LLM (QR ganha nos campos fiscais)
  if (results.success && results.data && Object.keys(qrFields).length > 0) {
    results.data.output = mergeQRCodeWithAnalysis(qrFields, results.data.output) as Record<string, string>
  }

  if (results.data?.tokensUsed && results.data.tokensUsed > 0) {
    await updateUser(user.id, { aiBalance: { decrement: 1 } })
  }

  return results
}

export async function saveFileAsTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    // Get the file record
    const fileId = formData.get("fileId") as string
    const file = await getFileById(fileId, user.id)
    if (!file) throw new Error("File not found")

    // Create transaction
    const transaction = await createTransaction(user.id, validatedForm.data)

    // Move file to processed location
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFileName = path.basename(file.path)
    const newRelativeFilePath = getTransactionFileUploadPath(file.id, originalFileName, transaction)

    // Move file to new location and name
    const oldFullFilePath = safePathJoin(userUploadsDirectory, file.path)
    const newFullFilePath = safePathJoin(userUploadsDirectory, newRelativeFilePath)
    await mkdir(path.dirname(newFullFilePath), { recursive: true })
    await rename(path.resolve(oldFullFilePath), path.resolve(newFullFilePath))

    // Update file record
    await updateFile(file.id, user.id, {
      path: newRelativeFilePath,
      isReviewed: true,
    })

    await updateTransactionFiles(transaction.id, user.id, [file.id])

    revalidatePath("/unsorted")
    revalidatePath("/transactions")

    return { success: true, data: transaction }
  } catch (error) {
    return { success: false, error: `Failed to save transaction: ${error}` }
  }
}

export async function deleteUnsortedFileAction(
  _prevState: ActionState<Transaction> | null,
  fileId: string
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    await deleteFile(fileId, user.id)
    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete file" }
  }
}

export async function splitFileIntoItemsAction(
  _prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const fileId = formData.get("fileId") as string
    const items = JSON.parse(formData.get("items") as string) as TransactionData[]

    if (!fileId || !items || items.length === 0) {
      return { success: false, error: "File ID and items are required" }
    }

    // Get the original file
    const originalFile = await getFileById(fileId, user.id)
    if (!originalFile) {
      return { success: false, error: "Original file not found" }
    }

    // Get the original file's content
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFilePath = safePathJoin(userUploadsDirectory, originalFile.path)
    const fileContent = await readFile(originalFilePath)

    // Create a new file for each item
    for (const item of items) {
      const fileUuid = randomUUID()
      const fileName = `${originalFile.filename}-part-${item.name}`
      const relativeFilePath = unsortedFilePath(fileUuid, fileName)
      const fullFilePath = safePathJoin(userUploadsDirectory, relativeFilePath)

      // Create directory if it doesn't exist
      await mkdir(path.dirname(fullFilePath), { recursive: true })

      // Copy the original file content
      await writeFile(fullFilePath, fileContent)

      // Create file record in database with the item data cached.
      // We preserve every field from the parsed item — earlier this picked
      // an explicit subset and silently dropped fiscal fields (NIF,
      // documentType, documentNumber, atcud, subtotal, vatAmount), so any
      // split transaction was un-exportable to SAFT-PT.
      await createFile(user.id, {
        id: fileUuid,
        filename: fileName,
        path: relativeFilePath,
        mimetype: originalFile.mimetype,
        metadata: originalFile.metadata,
        isSplitted: true,
        cachedParseResult: { ...item, name: item.name },
      })
    }

    // Delete the original file
    await deleteFile(fileId, user.id)

    // Update user storage used
    const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
    await updateUser(user.id, { storageUsed })

    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    return { success: false, error: `Failed to split file into items: ${error}` }
  }
}
