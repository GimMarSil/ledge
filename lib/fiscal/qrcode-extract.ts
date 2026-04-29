"use server"

/**
 * Extração de QR codes de faturas portuguesas a partir de PDFs e imagens.
 * Usa pdfjs-dist + @napi-rs/canvas (pure JS / prebuilt native, sem deps de
 * SO) para rasterizar páginas e jsQR + sharp para decodificar.
 */

import { QRCodeData } from "./qrcode"
import { isPortugueseQRCode, parseQRCodeString } from "./qrcode-reader"
import sharp from "sharp"
import jsQR from "jsqr"
import fs from "fs/promises"

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
 * Extrai QR code de um PDF renderizando cada página a alta resolução em
 * memória (sem ficheiros temporários nem dependências de SO).
 */
async function extractQRCodeFromPdf(pdfPath: string): Promise<QRCodeData | null> {
  const data = await fs.readFile(pdfPath)
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  // See lib/previews/pdf.ts for why we resolve to a real path instead
  // of leaving workerSrc as an empty string.
  const { createRequire } = await import("module")
  const req = createRequire(import.meta.url)
  pdfjs.GlobalWorkerOptions.workerSrc = req.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
  const { createCanvas } = await import("@napi-rs/canvas")

  // pdfjs v4 wants a *class* it can `new`, not an object literal.
  class NodeCanvasFactory {
    create(w: number, h: number) {
      const c = createCanvas(w, h)
      return {
        canvas: c as unknown as HTMLCanvasElement,
        context: c.getContext("2d") as unknown as CanvasRenderingContext2D,
      }
    }
    reset(canvasAndContext: { canvas: { width: number; height: number } }, w: number, h: number) {
      canvasAndContext.canvas.width = w
      canvasAndContext.canvas.height = h
    }
    destroy(canvasAndContext: { canvas: { width: number; height: number } }) {
      canvasAndContext.canvas.width = 0
      canvasAndContext.canvas.height = 0
    }
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    disableFontFace: true,
    useSystemFonts: false,
    isEvalSupported: false,
    CanvasFactory: NodeCanvasFactory as unknown as never,
  } as unknown as never)
  const doc = await loadingTask.promise
  const scale = QR_SCAN_DPI / 72

  try {
    const limit = Math.min(doc.numPages, QR_SCAN_MAX_PAGES)
    for (let pageNo = 1; pageNo <= limit; pageNo++) {
      const page = await doc.getPage(pageNo)
      let viewport = page.getViewport({ scale })
      const fit = Math.min(1, QR_SCAN_MAX_SIZE / viewport.width, QR_SCAN_MAX_SIZE / viewport.height)
      if (fit < 1) viewport = page.getViewport({ scale: scale * fit })

      const width = Math.ceil(viewport.width)
      const height = Math.ceil(viewport.height)
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext("2d")
      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise

      const png = await canvas.encode("png")
      const qrData = await decodeQRFromBuffer(png)
      page.cleanup()
      if (qrData) {
        await doc.cleanup()
        await doc.destroy()
        return qrData
      }
    }
    return null
  } finally {
    await doc.cleanup()
    await doc.destroy()
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
  return decodeQRFromBuffer(await fs.readFile(imagePath))
}

async function decodeQRFromBuffer(input: Buffer): Promise<QRCodeData | null> {
  try {
    const { data, info } = await sharp(input)
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
