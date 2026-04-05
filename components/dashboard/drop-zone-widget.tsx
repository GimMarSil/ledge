"use client"

import { useNotification } from "@/app/(app)/context"
import { uploadFilesAction } from "@/app/(app)/files/actions"
import { FormError } from "@/components/forms/error"
import config from "@/lib/config"
import { Camera, Loader2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useState } from "react"

export default function DashboardDropZoneWidget() {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    setUploadError("")
    if (e.target.files && e.target.files.length > 0) {
      const formData = new FormData()
      for (let i = 0; i < e.target.files.length; i++) {
        formData.append("files", e.target.files[i])
      }
      startTransition(async () => {
        const result = await uploadFilesAction(formData)
        if (result.success) {
          showNotification({ code: "sidebar.unsorted", message: "new" })
          setTimeout(() => showNotification({ code: "sidebar.unsorted", message: "" }), 3000)
          router.push("/unsorted")
        } else {
          setUploadError(result.error ? result.error : "Algo correu mal...")
        }
        setIsUploading(false)
      })
    }
  }

  return (
    <div className="flex w-full h-full min-h-[200px]">
      <label
        className={`relative w-full h-full border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer group ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"
        }`}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          multiple
          accept={config.upload.acceptedMimeTypes}
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center h-full">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : isDragging ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <Camera className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {isUploading ? "A carregar..." : "Tire uma foto ou largue os seus ficheiros aqui"}
            </p>
            {!uploadError && (
              <p className="text-sm text-muted-foreground mt-1">
                Carregue recibos, faturas e outros documentos para análise automática
              </p>
            )}
            {uploadError && <FormError>{uploadError}</FormError>}
          </div>
        </div>
      </label>
    </div>
  )
}
