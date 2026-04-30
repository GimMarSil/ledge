"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser, isSubscriptionExpired } from "@/lib/auth"
import {
  getDirectorySize,
  getUserUploadsDirectory,
  isEnoughStorageToUploadFile,
  safePathJoin,
  unsortedFilePath,
} from "@/lib/files"
import { extractQRCodeFromFile } from "@/lib/fiscal/qrcode-extract"
import { generateQRCodeString } from "@/lib/fiscal/qrcode"
import { qrCodeDataToTransactionFields } from "@/lib/fiscal/qrcode-to-transaction"
import { createFile, updateFile } from "@/models/files"
import { updateUser } from "@/models/users"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

export async function uploadFilesAction(formData: FormData): Promise<ActionState<null>> {
  const user = await getCurrentUser()
  const files = formData.getAll("files") as File[]

  // Make sure upload dir exists
  const userUploadsDirectory = getUserUploadsDirectory(user)

  // Check limits
  const totalFileSize = files.reduce((acc, file) => acc + file.size, 0)
  if (!isEnoughStorageToUploadFile(user, totalFileSize)) {
    return { success: false, error: `Insufficient storage to upload these files` }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
    }
  }

  // Process each file
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      if (!(file instanceof File)) {
        return { success: false, error: "Invalid file" }
      }

      // Save file to filesystem
      const fileUuid = randomUUID()
      const relativeFilePath = unsortedFilePath(fileUuid, file.name)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const fullFilePath = safePathJoin(userUploadsDirectory, relativeFilePath)
      await mkdir(path.dirname(fullFilePath), { recursive: true })

      await writeFile(fullFilePath, buffer)

      // Create file record in database
      const fileRecord = await createFile(user.id, {
        id: fileUuid,
        filename: file.name,
        path: relativeFilePath,
        mimetype: file.type,
        metadata: {
          size: file.size,
          lastModified: file.lastModified,
        },
      })

      // Best-effort silent QR pre-classification. Runs in the upload
      // server action so by the time /unsorted re-renders, fields are
      // already populated for the user — no separate button or wait.
      // Failure is silent: most uploaded docs don't carry an e-Fatura
      // QR and we don't want to surface that as an error.
      try {
        const qrData = await extractQRCodeFromFile(fullFilePath, file.type)
        if (qrData) {
          const qrRaw = generateQRCodeString(qrData)
          const qrFields = qrCodeDataToTransactionFields(qrData, qrRaw)
          await updateFile(fileRecord.id, user.id, {
            cachedParseResult: qrFields as Record<string, unknown>,
          })
        }
      } catch (err) {
        console.warn("[upload] QR pre-classification failed:", err instanceof Error ? err.message : err)
      }

      return fileRecord
    })
  )

  const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
  await updateUser(user.id, { storageUsed })

  revalidatePath("/unsorted")

  return { success: true, error: null }
}
