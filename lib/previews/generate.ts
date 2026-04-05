import { resizeImage } from "@/lib/previews/images"
import { User } from "@/prisma/client"

export async function generateFilePreviews(
  user: User,
  filePath: string,
  mimetype: string
): Promise<{ contentType: string; previews: string[] }> {
  if (mimetype === "application/pdf") {
    // Serve the PDF directly — preview is handled in the browser
    return { contentType: "application/pdf", previews: [filePath] }
  } else if (mimetype.startsWith("image/")) {
    const { contentType, resizedPath } = await resizeImage(user, filePath)
    return { contentType, previews: [resizedPath] }
  } else {
    return { contentType: mimetype, previews: [filePath] }
  }
}
