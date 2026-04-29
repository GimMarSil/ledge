"use server"

import { fileExists, getUserPreviewsDirectory, safePathJoin } from "@/lib/files"
import { User } from "@/prisma/client"
import fs from "fs/promises"
import path from "path"
import sharp from "sharp"
import config from "../config"

/**
 * Render a PDF to one webp image per page. Uses pdfjs-dist (pure JS) plus
 * @napi-rs/canvas (prebuilt native binary, Windows-friendly, no Cairo) to
 * rasterise each page, then sharp to encode to webp.
 *
 * Replaces the previous pdf2pic + GraphicsMagick + Ghostscript pipeline,
 * which required system-level binaries that are awkward to install on
 * Windows dev boxes and add weight to CI containers.
 *
 * Cached on disk per file id so subsequent calls are free.
 */
export async function pdfToImages(
  user: User,
  origFilePath: string
): Promise<{ contentType: string; pages: string[] }> {
  const userPreviewsDirectory = getUserPreviewsDirectory(user)
  await fs.mkdir(userPreviewsDirectory, { recursive: true })

  const basename = path.basename(origFilePath, path.extname(origFilePath))

  // Cache hit
  const existingPages: string[] = []
  for (let i = 1; i <= config.upload.pdfs.maxPages; i++) {
    const convertedFilePath = safePathJoin(userPreviewsDirectory, `${basename}.${i}.webp`)
    if (await fileExists(convertedFilePath)) {
      existingPages.push(convertedFilePath)
    } else {
      break
    }
  }
  if (existingPages.length > 0) {
    return { contentType: "image/webp", pages: existingPages }
  }

  const data = await fs.readFile(origFilePath)
  const pages = await rasterisePdf(data, {
    maxPages: config.upload.pdfs.maxPages,
    dpi: config.upload.pdfs.dpi,
    maxWidth: config.upload.pdfs.maxWidth,
    maxHeight: config.upload.pdfs.maxHeight,
    quality: config.upload.pdfs.quality,
  })

  const written: string[] = []
  for (let i = 0; i < pages.length; i++) {
    const out = safePathJoin(userPreviewsDirectory, `${basename}.${i + 1}.webp`)
    await fs.writeFile(out, pages[i])
    written.push(out)
  }
  return { contentType: "image/webp", pages: written }
}

type RasteriseOpts = {
  maxPages: number
  dpi: number
  maxWidth: number
  maxHeight: number
  quality: number
}

async function rasterisePdf(data: Buffer, opts: RasteriseOpts): Promise<Buffer[]> {
  // pdfjs-dist v4 ships ESM under /legacy/build for node compat.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  // pdfjs always boots a "fake worker" in node and refuses to start if
  // workerSrc is empty. Resolve the worker file to a real path so the
  // legacy fake-worker loader can require it. (Empty string here used
  // to throw "Setting up fake worker failed: No GlobalWorkerOptions
  // .workerSrc specified.")
  // eval('require') sidesteps Next.js's webpack rewrite so we get the
  // real Node CJS require — pdfjs-dist is also in serverExternalPackages.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeRequire: NodeJS.Require = eval("require")
  pdfjs.GlobalWorkerOptions.workerSrc = nodeRequire.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")

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
  const pageCount = Math.min(doc.numPages, opts.maxPages)
  const scale = opts.dpi / 72 // PDF user-space units are at 72 dpi

  const out: Buffer[] = []
  for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
    const page = await doc.getPage(pageNo)
    let viewport = page.getViewport({ scale })

    // Clamp to maxWidth/maxHeight so a high-DPI request on a huge PDF
    // doesn't blow out memory. Preserve aspect ratio.
    const widthClamp = opts.maxWidth / viewport.width
    const heightClamp = opts.maxHeight / viewport.height
    const fit = Math.min(1, widthClamp, heightClamp)
    if (fit < 1) viewport = page.getViewport({ scale: scale * fit })

    const width = Math.ceil(viewport.width)
    const height = Math.ceil(viewport.height)

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    // pdfjs' types insist on browser CanvasRenderingContext2D; @napi-rs's
    // SkiaContext implements the same surface so we cast through unknown.
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise

    const png = await canvas.encode("png")
    const webp = await sharp(png).webp({ quality: opts.quality }).toBuffer()
    out.push(webp)

    page.cleanup()
  }
  await doc.cleanup()
  await doc.destroy()
  return out
}
