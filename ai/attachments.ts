import { fileExists, fullPathForFile } from "@/lib/files"
import { generateFilePreviews } from "@/lib/previews/generate"
import { File, User } from "@/prisma/client"
import fs from "fs/promises"

// Most PT invoices: page 1 = header + items, page 2 = totals/IVA/QR,
// page 3+ = T&Cs. Sending only 4 pages was clipping the totals on
// dense multi-page invoices (e.g. construction-supplier statements
// that span 6+ pages). Match config.upload.pdfs.maxPages so the LLM
// sees the whole thing — token cost scales linearly but accuracy on
// multi-page documents matters more for accounting use.
const MAX_PAGES_TO_ANALYZE = 10

export type AnalyzeAttachment = {
  filename: string
  contentType: string
  base64: string
}

export const loadAttachmentsForAI = async (user: User, file: File): Promise<AnalyzeAttachment[]> => {
  const fullFilePath = fullPathForFile(user, file)
  const isFileExists = await fileExists(fullFilePath)
  if (!isFileExists) {
    throw new Error("File not found on disk")
  }

  const { contentType, previews } = await generateFilePreviews(user, fullFilePath, file.mimetype)

  return Promise.all(
    previews.slice(0, MAX_PAGES_TO_ANALYZE).map(async (preview) => ({
      filename: file.filename,
      contentType: contentType,
      base64: await loadFileAsBase64(preview),
    }))
  )
}

export const loadFileAsBase64 = async (filePath: string): Promise<string> => {
  const buffer = await fs.readFile(filePath)
  return Buffer.from(buffer).toString("base64")
}
