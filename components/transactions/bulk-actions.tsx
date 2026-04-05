"use client"

import { bulkDeleteTransactionsAction } from "@/app/(app)/transactions/actions"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"

interface BulkActionsMenuProps {
  selectedIds: string[]
  onActionComplete?: () => void
}

export function BulkActionsMenu({ selectedIds, onActionComplete }: BulkActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    const confirmMessage =
      "Tem a certeza que quer eliminar estas transações e todos os seus ficheiros? Esta ação não pode ser desfeita."
    if (!confirm(confirmMessage)) return

    try {
      setIsLoading(true)
      const result = await bulkDeleteTransactionsAction(selectedIds)
      if (!result.success) {
        throw new Error(result.error)
      }
      onActionComplete?.()
    } catch (error) {
      alert(`Falha ao eliminar transações: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
      <div className="flex items-center gap-4 bg-card shadow-2xl rounded-2xl px-6 py-4 border">
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {selectedIds.length} selecionada{selectedIds.length !== 1 ? "s" : ""}
        </span>
        <Button variant="destructive" className="gap-2" disabled={isLoading} onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </div>
    </div>
  )
}
