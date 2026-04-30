"use client"

import { formatBytes } from "@/lib/utils"
import { File } from "@/prisma/client"
import { CheckCircle2, ZoomIn, ZoomOut } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function FilePreview({ file }: { file: File }) {
  const [isEnlarged, setIsEnlarged] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const isPdf = file.mimetype === "application/pdf"
  const isAnalyzed = !!file.cachedParseResult

  // Fetch page count from the preview route's X-Page-Count header so
  // we render one <img> per page stacked vertically (scrollable). HEAD
  // avoids pulling the WebP body just to read the count.
  useEffect(() => {
    if (!isPdf) return
    let cancelled = false
    fetch(`/files/preview/${file.id}?page=1`, { method: "HEAD" })
      .then((r) => {
        if (cancelled) return
        const c = parseInt(r.headers.get("X-Page-Count") || "1", 10)
        if (Number.isFinite(c) && c > 0) setPageCount(c)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [file.id, isPdf])

  const fileSize =
    file.metadata && typeof file.metadata === "object" && "size" in file.metadata ? Number(file.metadata.size) : 0

  return (
    <>
      <div className="flex flex-col gap-2 p-4 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          {isAnalyzed ? (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="h-3 w-3" /> Analisado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Por analisar
            </span>
          )}
          <div className="flex items-center gap-1">
            {pageCount > 1 && (
              <span className="text-xs text-muted-foreground mr-2">{pageCount} páginas</span>
            )}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1 rounded hover:bg-muted"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-1 rounded hover:bg-muted"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* PDFs: tall iframe that fills available vertical space (most useful
            for invoices). Images: keep the 3:4 aspect so phone-shot receipts
            don't blow out the layout. */}
        <div className={`overflow-auto ${isPdf ? "h-[min(85vh,900px)] min-h-[500px]" : "aspect-[3/4]"}`}>
          {isPdf ? (
            // /files/preview serves rasterised WebP pages (LLM vision
            // can't ingest application/pdf). Stack every page vertically
            // inside the scrollable container so the user sees the whole
            // document at once — typical invoice review flow.
            <div className="flex flex-col gap-2">
              {Array.from({ length: pageCount }, (_, idx) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={idx}
                  src={`/files/preview/${file.id}?page=${idx + 1}`}
                  alt={`${file.filename} — página ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="w-full max-w-full h-auto object-contain"
                  style={
                    zoom !== 1
                      ? { transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/files/preview/${file.id}`}
                alt={file.filename}
                loading="lazy"
                onError={() => setImgError(true)}
                className={`${
                  isEnlarged
                    ? "fixed inset-0 z-50 m-auto w-screen h-screen object-contain cursor-zoom-out bg-black/80"
                    : "w-full max-w-full h-auto object-contain cursor-zoom-in"
                }`}
                // Default (zoom=1): natural fit — image expands to fill
                // the column width, height auto, no horizontal scroll.
                // Only apply the transform once the user zooms in.
                style={
                  !isEnlarged && zoom !== 1
                    ? { transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }
                    : undefined
                }
                onClick={() => setIsEnlarged(!isEnlarged)}
              />
              {imgError && (
                <div className="absolute inset-4 flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded">
                  Não foi possível pré-visualizar este ficheiro
                </div>
              )}
              {isEnlarged && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsEnlarged(false)} />
              )}
            </>
          )}
        </div>
        <div className="flex flex-col gap-2 mt-2 overflow-hidden">
          <h2 className="text-md underline font-semibold overflow-ellipsis">
            <Link href={`/files/download/${file.id}`}>{file.filename}</Link>
          </h2>
          <p className="text-sm overflow-ellipsis">
            <strong>Tipo:</strong> {file.mimetype}
          </p>
          <p className="text-sm">
            <strong>Tamanho:</strong> {formatBytes(fileSize)}
          </p>
        </div>
      </div>
    </>
  )
}
