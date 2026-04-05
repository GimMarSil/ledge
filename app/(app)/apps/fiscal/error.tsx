"use client"

import { Button } from "@/components/ui/button"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"

export default function FiscalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Erro ao carregar o painel fiscal</h2>
        <p className="text-muted-foreground">
          Nao foi possivel carregar os dados fiscais. Tente novamente.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button onClick={reset} variant="default">
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  )
}
