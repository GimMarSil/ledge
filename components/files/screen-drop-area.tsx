"use client"

import { useNotification } from "@/app/(app)/context"
import { uploadFilesAction } from "@/app/(app)/files/actions"
import { uploadTransactionFilesAction } from "@/app/(app)/transactions/actions"
import { AlertCircle, CloudUpload, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

export default function ScreenDropArea({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const dragCounter = useRef(0)
  const { transactionId } = useParams()

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const items = e.dataTransfer.items
    if (!items) return
    let hasFiles = false
    for (const item of items) {
      if (item.kind === "file") {
        hasFiles = true
        break
      }
    }
    if (!hasFiles) return
    dragCounter.current++
    if (dragCounter.current === 1) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        setIsUploading(true)
        setUploadError("")

        try {
          const formData = new FormData()
          if (transactionId) {
            formData.append("transactionId", transactionId as string)
          }
          for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i])
          }

          const result = transactionId
            ? await uploadTransactionFilesAction(formData)
            : await uploadFilesAction(formData)

          if (result.success) {
            showNotification({ code: "sidebar.unsorted", message: "new" })
            setTimeout(() => showNotification({ code: "sidebar.unsorted", message: "" }), 3000)
            if (!transactionId) {
              router.push("/unsorted")
              // Background QR scan kicked off by the server action runs
              // after the response returns. Refresh a couple of times so
              // the 'Analisado' pill and pre-filled fields appear without
              // the user having to manually reload.
              setTimeout(() => router.refresh(), 3000)
              setTimeout(() => router.refresh(), 8000)
            }
          } else {
            setUploadError(result.error ? result.error : "Algo correu mal...")
          }
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : "Algo correu mal...")
        } finally {
          setIsUploading(false)
        }
      }
    },
    [transactionId, router, showNotification]
  )

  useEffect(() => {
    document.body.addEventListener("dragenter", handleDragEnter as unknown as EventListener)
    document.body.addEventListener("dragover", handleDragOver as unknown as EventListener)
    document.body.addEventListener("dragleave", handleDragLeave as unknown as EventListener)
    document.body.addEventListener("drop", handleDrop as unknown as EventListener)

    return () => {
      document.body.removeEventListener("dragenter", handleDragEnter as unknown as EventListener)
      document.body.removeEventListener("dragover", handleDragOver as unknown as EventListener)
      document.body.removeEventListener("dragleave", handleDragLeave as unknown as EventListener)
      document.body.removeEventListener("drop", handleDrop as unknown as EventListener)
    }
  }, [isDragging, handleDrop])

  return (
    <div className="relative min-h-screen w-full">
      {children}

      {isDragging && (
        <div
          className="fixed inset-0 bg-primary/5 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-primary"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-card p-10 rounded-2xl shadow-2xl text-center border animate-scale-in">
            <CloudUpload className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">
              {transactionId ? "Largue ficheiros para adicionar à transação" : "Largue ficheiros para carregar"}
            </h3>
            <p className="text-muted-foreground">Largue em qualquer lugar do ecrã</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-10 rounded-2xl shadow-2xl text-center border animate-scale-in">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
            <h3 className="text-xl font-semibold mb-2">
              {transactionId ? "A adicionar ficheiros..." : "A carregar..."}
            </h3>
          </div>
        </div>
      )}

      {uploadError && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setUploadError("")}
        >
          <div className="bg-card p-10 rounded-2xl shadow-2xl text-center border animate-scale-in">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Erro ao carregar</h3>
            <p className="text-muted-foreground">{uploadError}</p>
            <p className="text-xs text-muted-foreground mt-3">Clique para fechar</p>
          </div>
        </div>
      )}
    </div>
  )
}
