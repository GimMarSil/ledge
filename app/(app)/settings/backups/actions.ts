"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getUserUploadsDirectory, safePathJoin } from "@/lib/files"
import { MODEL_BACKUP, modelFromJSON } from "@/models/backups"
import fs from "fs/promises"
import JSZip from "jszip"
import path from "path"

const SUPPORTED_BACKUP_VERSIONS = ["1.0"]
const REMOVE_EXISTING_DATA = true
const MAX_BACKUP_SIZE = 256 * 1024 * 1024 // 256MB

type BackupRestoreResult = {
  counters: Record<string, number>
}

export async function restoreBackupAction(
  _prevState: ActionState<BackupRestoreResult> | null,
  formData: FormData
): Promise<ActionState<BackupRestoreResult>> {
  const user = await getCurrentUser()
  const userUploadsDirectory = getUserUploadsDirectory(user)
  const file = formData.get("file") as File

  if (!file || file.size === 0) {
    return { success: false, error: "No file provided" }
  }

  if (file.size > MAX_BACKUP_SIZE) {
    return { success: false, error: `Backup file too large. Maximum size is ${MAX_BACKUP_SIZE / 1024 / 1024}MB` }
  }

  // Read zip archive
  let zip: JSZip
  try {
    const fileBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(fileBuffer)
    zip = await JSZip.loadAsync(fileData)
  } catch (error) {
    return { success: false, error: "Ficheiro ZIP inválido ou corrompido" }
  }

  // Validate backup structure BEFORE deleting any data
  try {
    const metadataFile = zip.file("data/metadata.json")
    if (!metadataFile) {
      return { success: false, error: "Ficheiro de backup inválido: metadata.json em falta" }
    }

    const metadataContent = await metadataFile.async("string")
    let metadata: { version?: string }
    try {
      metadata = JSON.parse(metadataContent)
    } catch {
      return { success: false, error: "Ficheiro de backup inválido: metadata.json corrompido" }
    }

    if (!metadata.version || !SUPPORTED_BACKUP_VERSIONS.includes(metadata.version)) {
      return {
        success: false,
        error: `Versão de backup incompatível: ${
          metadata.version || "desconhecida"
        }. Versões suportadas: ${SUPPORTED_BACKUP_VERSIONS.join(", ")}`,
      }
    }

    // Verify at least one data file exists
    const hasDataFiles = MODEL_BACKUP.some((backup) => zip.file(`data/${backup.filename}`) !== null)
    if (!hasDataFiles) {
      return { success: false, error: "Ficheiro de backup inválido: sem dados para restaurar" }
    }

    // Only delete AFTER validation passes
    if (REMOVE_EXISTING_DATA) {
      await cleanupUserTables(user.id)
      await fs.rm(userUploadsDirectory, { recursive: true, force: true })
    }

    const counters: Record<string, number> = {}

    // Restore tables
    for (const backup of MODEL_BACKUP) {
      try {
        const jsonFile = zip.file(`data/${backup.filename}`)
        if (jsonFile) {
          const jsonContent = await jsonFile.async("string")
          const restoredCount = await modelFromJSON(user.id, backup, jsonContent)
          counters[backup.filename] = restoredCount
        }
      } catch (error) {
      }
    }

    // Restore files
    try {
      let restoredFilesCount = 0
      const files = await prisma.file.findMany({
        where: {
          userId: user.id,
        },
      })

      const userUploadsDirectory = getUserUploadsDirectory(user)

      for (const file of files) {
        const filePathWithoutPrefix = path.normalize(file.path.replace(/^.*\/uploads\//, ""))
        const zipFilePath = path.join("data/uploads", filePathWithoutPrefix)
        const zipFile = zip.file(zipFilePath)
        if (!zipFile) {
          continue
        }

        const fileContents = await zipFile.async("nodebuffer")
        const fullFilePath = safePathJoin(userUploadsDirectory, filePathWithoutPrefix)
        if (!fullFilePath.startsWith(path.normalize(userUploadsDirectory))) {
          continue
        }

        try {
          await fs.mkdir(path.dirname(fullFilePath), { recursive: true })
          await fs.writeFile(fullFilePath, fileContents)
          restoredFilesCount++
        } catch (error) {
          continue
        }

        await prisma.file.update({
          where: { id: file.id },
          data: {
            path: filePathWithoutPrefix,
          },
        })
      }
      counters["Uploaded attachments"] = restoredFilesCount
    } catch (error) {
      return {
        success: false,
        error: "Erro ao restaurar ficheiros anexados",
      }
    }

    return { success: true, data: { counters } }
  } catch (error) {
    return {
      success: false,
      error: "Erro ao restaurar backup",
    }
  }
}

async function cleanupUserTables(userId: string) {
  // Delete in reverse order to handle foreign key constraints
  for (const { model } of [...MODEL_BACKUP].reverse()) {
    try {
      await model.deleteMany({ where: { userId } })
    } catch (error) {
    }
  }
}
