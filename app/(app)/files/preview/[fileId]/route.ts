import { getCurrentUser } from "@/lib/auth"
import { fileExists, fullPathForFile } from "@/lib/files"
import { generateFilePreviews } from "@/lib/previews/generate"
import { getFileById } from "@/models/files"
import fs from "fs/promises"
import { NextResponse } from "next/server"
import path from "path"
import { encodeFilename } from "@/lib/utils"

// Next.js App Router doesn't auto-route HEAD to GET — declare it
// explicitly so the FilePreview can probe X-Page-Count without
// downloading the full WebP body.
export async function HEAD(request: Request, ctx: { params: Promise<{ fileId: string }> }) {
  return GET(request, ctx)
}

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const user = await getCurrentUser()

  if (!fileId) {
    return new NextResponse("No fileId provided", { status: 400 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1", 10)

  try {
    // Find file in database
    const file = await getFileById(fileId, user.id)

    if (!file || file.userId !== user.id) {
      return new NextResponse("File not found or does not belong to the user", { status: 404 })
    }

    // Check if file exists on disk
    const fullFilePath = fullPathForFile(user, file)
    const isFileExists = await fileExists(fullFilePath)
    if (!isFileExists) {
      return new NextResponse(`File not found on disk: ${file.path}`, { status: 404 })
    }

    // Generate previews
    const { contentType, previews } = await generateFilePreviews(user, fullFilePath, file.mimetype)
    if (page > previews.length) {
      return new NextResponse("Page not found", { status: 404 })
    }
    const previewPath = previews[page - 1] || fullFilePath

    // Read file
    const fileBuffer = await fs.readFile(previewPath)

    // Return file with proper content type
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename*=${encodeFilename(path.basename(previewPath))}`,
        // Browsers aggressively cache /files/preview/{id}; that hides
        // server-side regenerations (after a render bug fix or reupload).
        // Force a revalidation each request — cheap, and the rasterised
        // pages are already cached on disk.
        "Cache-Control": "no-cache, must-revalidate",
        // Total page count so the client can render multi-page nav
        // without a separate round-trip. CORS-safelisted-aware: also
        // expose it explicitly for fetch clients reading headers.
        "X-Page-Count": String(previews.length),
        "Access-Control-Expose-Headers": "X-Page-Count",
      },
    })
  } catch (error) {
    console.error("[files/preview] failed", { fileId, error })
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
