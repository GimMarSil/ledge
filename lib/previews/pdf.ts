"use server"

import { fileExists, getUserPreviewsDirectory, safePathJoin } from "@/lib/files"
import { User } from "@/prisma/client"
import { spawn } from "child_process"
import fs from "fs/promises"
import os from "os"
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
    const convertedFilePath = safePathJoin(userPreviewsDirectory, `${basename}.${i}.v6.webp`)
    if (await fileExists(convertedFilePath)) {
      existingPages.push(convertedFilePath)
    } else {
      break
    }
  }
  if (existingPages.length > 0) {
    return { contentType: "image/webp", pages: existingPages }
  }

  const opts: RasteriseOpts = {
    maxPages: config.upload.pdfs.maxPages,
    dpi: config.upload.pdfs.dpi,
    maxWidth: config.upload.pdfs.maxWidth,
    maxHeight: config.upload.pdfs.maxHeight,
    quality: config.upload.pdfs.quality,
  }

  // Try poppler (pdftoppm) first — handles font substitution natively
  // via Cairo + Fontconfig and renders PHC-style invoices correctly
  // where pdfjs falls back to blank cells. Only available in Linux
  // production; Windows dev falls back to pdfjs.
  let pages: Buffer[]
  try {
    pages = await rasterisePdfWithPoppler(origFilePath, opts)
  } catch (err) {
    console.warn(
      "[pdf] poppler rasterise failed, falling back to pdfjs:",
      err instanceof Error ? err.message : err
    )
    const data = await fs.readFile(origFilePath)
    pages = await rasterisePdf(data, opts)
  }

  const written: string[] = []
  for (let i = 0; i < pages.length; i++) {
    const out = safePathJoin(userPreviewsDirectory, `${basename}.${i + 1}.v6.webp`)
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

/**
 * Rasterise a PDF via poppler-utils (pdftoppm). Drops PNGs into a
 * temp directory and re-encodes them to webp. The big win over pdfjs
 * is that poppler uses Cairo + Fontconfig: PDFs that reference but
 * don't embed body fonts (PHC-generated invoices etc.) get correct
 * substitution from the system fonts installed in the Dockerfile.
 *
 * Throws if pdftoppm is missing (Windows dev) — caller falls back to
 * pdfjs.
 */
async function rasterisePdfWithPoppler(pdfPath: string, opts: RasteriseOpts): Promise<Buffer[]> {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdftoppm-"))
  try {
    const outPrefix = path.join(workDir, "p")
    const args = [
      "-png",
      "-r",
      String(opts.dpi),
      "-l",
      String(opts.maxPages),
      pdfPath,
      outPrefix,
    ]

    await new Promise<void>((resolve, reject) => {
      const child = spawn("pdftoppm", args, { stdio: ["ignore", "ignore", "pipe"] })
      let stderr = ""
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString()
      })
      child.on("error", reject)
      child.on("close", (code) => {
        if (code === 0) resolve()
        else reject(new Error(`pdftoppm exited with code ${code}: ${stderr.trim()}`))
      })
    })

    // pdftoppm names files p-1.png, p-2.png, ... (with zero-padding
    // depending on total page count). Read directory and sort.
    const entries = (await fs.readdir(workDir))
      .filter((f) => f.endsWith(".png"))
      .sort((a, b) => {
        const an = parseInt(a.match(/(\d+)\.png$/)?.[1] || "0", 10)
        const bn = parseInt(b.match(/(\d+)\.png$/)?.[1] || "0", 10)
        return an - bn
      })

    const out: Buffer[] = []
    for (const entry of entries) {
      const pngPath = path.join(workDir, entry)
      // Clamp to maxWidth/maxHeight in sharp so a huge invoice at 150
      // DPI doesn't blow out memory or storage.
      const webp = await sharp(pngPath)
        .resize({
          width: opts.maxWidth,
          height: opts.maxHeight,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: opts.quality })
        .toBuffer()
      out.push(webp)
    }
    return out
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
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

  // Locate the standard fonts and cmaps shipped with pdfjs-dist. PDFs
  // that reference standard fonts (Helvetica, Times, Courier, …) without
  // embedding them — which most PT invoices do — render with NO text at
  // all unless we point pdfjs at these. Symptom: preview images show
  // logos and shapes but blank table cells, and the LLM has nothing to
  // read. Resolve from the package root so it works in dev and in the
  // Docker image.
  // pdfjs's NodeStandardFontDataFactory does `fs.readFile(url)` directly,
  // concatenating the filename onto this base. A `file://` URL string
  // would error (fs.readFile only accepts URL *objects*, not the string
  // form), so we pass a plain absolute path with a trailing slash.
  const pdfjsRoot = path.dirname(nodeRequire.resolve("pdfjs-dist/package.json"))
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
    // useSystemFonts=true tested and made rendering strictly worse —
    // pdfjs in node tries to substitute via Fontconfig but the path
    // through @napi-rs/canvas isn't wired for that, so substituted
    // glyphs render as blank shapes (covers even text that previously
    // worked). Stay on the path-glyph fallback that needs only
    // standardFontDataUrl + cMaps.
    disableFontFace: true,
    useSystemFonts: false,
    isEvalSupported: false,
    standardFontDataUrl,
    cMapUrl,
    cMapPacked: true,
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
