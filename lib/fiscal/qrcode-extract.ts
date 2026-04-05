"use server"

/**
 * Extração de QR codes de faturas portuguesas a partir de PDFs e imagens.
 * Usa pdf2pic para renderizar páginas e jsQR + sharp para decodificar.
 */

import { QRCodeData } from "./qrcode"
import { isPortugueseQRCode, parseQRCodeString } from "./qrcode-reader"
import sharp from "sharp"
import jsQR from "jsqr"
import { fromPath } from "pdf2pic"
import fs from "fs/promises"
import path from "path"
import os from "os"

const QR_SCAN_DPI = 300
const QR_SCAN_MAX_PAGES = 2
const QR_SCAN_MAX_SIZE = 3000

/**
 * Router: extrai QR code de um ficheiro baseado no mimetype.
 */
export async function extractQRCodeFromFile(filePath: string, mimetype: string): Promise<QRCodeData | null> {
  if (mimetype === "application/pdf") {
    return extractQRCodeFromPdf(filePath)
  } else if (mimetype.startsWith("image/")) {
    return extractQRCodeFromImage(filePath)
  }
  return null
}

/**
 * Extrai QR code de um PDF renderizando cada página a alta resolução.
 */
async function extractQRCodeFromPdf(pdfPath: string): Promise<QRCodeData | null> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "qr-scan-"))

  try {
    const convert = fromPath(pdfPath, {
      density: QR_SCAN_DPI,
      saveFilename: "qr-page",
      savePath: tmpDir,
      format: "png",
      width: QR_SCAN_MAX_SIZE,
      height: QR_SCAN_MAX_SIZE,
      preserveAspectRatio: true,
    })

    // Render and scan pages sequentially (stop on first QR found)
    for (let page = 1; page <= QR_SCAN_MAX_PAGES; page++) {
      try {
        const result = await convert(page, { responseType: "image" })
        if (!result || !result.path) continue

        const qrData = await decodeQRFromImage(result.path)
        if (qrData) return qrData
      } catch {
        // Page may not exist (e.g., 1-page PDF scanning page 2) — skip
        continue
      }
    }

    return null
  } finally {
    // Cleanup temp files
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Non-critical cleanup failure
    }
  }
}

/**
 * Extrai QR code directamente de um ficheiro de imagem.
 */
async function extractQRCodeFromImage(imagePath: string): Promise<QRCodeData | null> {
  return decodeQRFromImage(imagePath)
}

/**
 * Decodifica um QR code de uma imagem usando sharp + jsQR.
 *
 * Pipeline:
 * 1. Carregar imagem com sharp
 * 2. Converter para greyscale e normalizar contraste
 * 3. Garantir canal alpha (jsQR precisa de RGBA)
 * 4. Extrair dados raw e passar ao jsQR
 * 5. Validar se é QR code e-fatura e fazer parse
 */
async function decodeQRFromImage(imagePath: string): Promise<QRCodeData | null> {
  try {
    const { data, info } = await sharp(imagePath)
      .greyscale()
      .normalise()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const result = jsQR(new Uint8ClampedArray(data.buffer), info.width, info.height)

    if (result && isPortugueseQRCode(result.data)) {
      return parseQRCodeString(result.data)
    }

    return null
  } catch {
    return null
  }
}
