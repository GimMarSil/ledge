"use server"

/**
 * Extração de QR codes de faturas portuguesas a partir de PDFs e imagens.
 * Usa pdfjs-dist + @napi-rs/canvas (pure JS / prebuilt native, sem deps de
 * SO) para rasterizar páginas e zxing-wasm + jsQR (fallback) para decodificar.
 *
 * Tried jsQR-only first; it consistently failed on PT invoices where the
 * QR is rendered as small vector squares (typical e-Fatura output from
 * SAFT-PT certified billing software). zxing-cpp via WASM is much more
 * tolerant of small/low-contrast/anti-aliased codes.
 */

import { QRCodeData } from "./qrcode"
import { isPortugueseQRCode, parseQRCodeString } from "./qrcode-reader"
import sharp from "sharp"
import jsQR from "jsqr"
import fs from "fs/promises"
import path from "path"

// 150 DPI is plenty for zxing-cpp (the upgrade from jsQR — much more
// tolerant of low resolution). Cuts pdfjs rasterise time roughly 4x
// vs the previous 300 DPI, which dominated the QR pipeline cost.
const QR_SCAN_DPI = 150
// PT invoices commonly carry the e-Fatura QR on page 2 or 3 (footer of
// a continuation page, or a "summary" page after itemised lines). Scan
// up to 10 to match config.upload.pdfs.maxPages — the loop bails out as
// soon as a valid QR is found, so the upper bound is mostly defensive.
const QR_SCAN_MAX_PAGES = 10
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
  // See lib/previews/pdf.ts for why we resolve to a real path and use
  // eval('require') to dodge Next.js webpack rewrites.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeRequire: NodeJS.Require = eval("require")
  pdfjs.GlobalWorkerOptions.workerSrc = nodeRequire.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
  // Same standard-fonts / cmaps wiring as lib/previews/pdf.ts. Without
  // these, PDFs that reference standard fonts render with no text and
  // (more importantly here) the QR code can come out partially clipped
  // by transparent text overlays that breaks jsQR's finder pattern
  // detection.
  const pdfjsRoot = path.dirname(nodeRequire.resolve("pdfjs-dist/package.json"))
  // Plain absolute path + trailing slash — pdfjs's NodeStandardFontDataFactory
  // calls fs.readFile(base + filename) directly and rejects file:// URLs as strings.
  const standardFontDataUrl = path.join(pdfjsRoot, "standard_fonts") + path.sep
  const cMapUrl = path.join(pdfjsRoot, "cmaps") + path.sep
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
    useSystemFonts: true,
    isEvalSupported: false,
    standardFontDataUrl,
    cMapUrl,
    cMapPacked: true,
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

// Lazy-load zxing-wasm module once and reuse. The wasm binary ships in
// node_modules; in node the loader needs locateFile() to point at the
// real file path (default behaviour fetches from a CDN URL that won't
// resolve in our container).
let zxingModulePromise: Promise<unknown> | null = null
async function getZXingReader() {
  const reader = await import("zxing-wasm/reader")
  if (!zxingModulePromise) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeRequire: NodeJS.Require = eval("require")
    const wasmPath = nodeRequire.resolve("zxing-wasm/reader/zxing_reader.wasm")
    zxingModulePromise = reader.prepareZXingModule({
      overrides: { locateFile: () => wasmPath },
      fireImmediately: true,
    }) as Promise<unknown>
  }
  await zxingModulePromise
  return reader
}

async function decodeWithZXing(rawPng: Buffer): Promise<string | null> {
  try {
    const reader = await getZXingReader()
    const u8 = new Uint8Array(rawPng.buffer, rawPng.byteOffset, rawPng.byteLength)
    const results = await reader.readBarcodes(u8, {
      tryHarder: true,
      tryRotate: true,
      tryInvert: true,
      formats: ["QRCode"],
      maxNumberOfSymbols: 1,
    })
    return results[0]?.text || null
  } catch (err) {
    console.warn("[qrcode] zxing-wasm decode threw:", err instanceof Error ? err.message : err)
    return null
  }
}

async function decodeWithJsQR(input: Buffer, label: string): Promise<string | null> {
  try {
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const result = jsQR(
      new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      info.width,
      info.height
    )
    if (result?.data) {
      console.info(`[qrcode] jsQR (${label}) decoded ${result.data.length} chars`)
      return result.data
    }
    return null
  } catch (err) {
    console.warn(`[qrcode] jsQR (${label}) threw:`, err instanceof Error ? err.message : err)
    return null
  }
}

async function decodeQRFromBuffer(input: Buffer): Promise<QRCodeData | null> {
  // Strategy ladder, cheapest → most aggressive. zxing is the workhorse
  // (handles small / anti-aliased / rotated codes fine); jsQR variants
  // are the fallback. Each strategy returns the raw decoded string and
  // we validate e-Fatura format at the end so we can log non-PT QRs.
  const meta = await sharp(input).metadata().catch(() => ({ width: 0 } as { width: number }))
  const width = meta.width || 0

  type Stage = { name: string; run: () => Promise<string | null> }
  const stages: Stage[] = [
    { name: "zxing/raw", run: () => decodeWithZXing(input) },
    {
      name: "zxing/grey-norm",
      run: async () => {
        const buf = await sharp(input).greyscale().normalise().png().toBuffer()
        return decodeWithZXing(buf)
      },
    },
    {
      name: "zxing/2x-grey-norm",
      run: async () => {
        const buf = await sharp(input)
          .resize({ width: width > 0 ? width * 2 : undefined, kernel: "lanczos3" })
          .greyscale()
          .normalise()
          .png()
          .toBuffer()
        return decodeWithZXing(buf)
      },
    },
    {
      name: "zxing/threshold",
      run: async () => {
        const buf = await sharp(input).greyscale().normalise().threshold(160).png().toBuffer()
        return decodeWithZXing(buf)
      },
    },
    {
      name: "jsqr/grey-norm",
      run: async () => {
        const buf = await sharp(input).greyscale().normalise().toBuffer()
        return decodeWithJsQR(buf, "grey-norm")
      },
    },
    {
      name: "jsqr/2x-threshold",
      run: async () => {
        const buf = await sharp(input)
          .resize({ width: width > 0 ? width * 2 : undefined, kernel: "lanczos3" })
          .greyscale()
          .normalise()
          .threshold(160)
          .toBuffer()
        return decodeWithJsQR(buf, "2x-threshold")
      },
    },
  ]

  for (const stage of stages) {
    const decoded = await stage.run()
    if (!decoded) continue
    if (isPortugueseQRCode(decoded)) {
      console.info(`[qrcode] decoded e-Fatura QR via ${stage.name}`)
      return parseQRCodeString(decoded)
    }
    console.info(
      `[qrcode] ${stage.name} decoded a QR but it isn't e-Fatura format (first 80 chars: ${JSON.stringify(decoded.slice(0, 80))})`
    )
    // Don't keep trying — a QR was decoded, just isn't ours.
    return null
  }

  console.info("[qrcode] no QR detected after all strategies")
  return null
}
