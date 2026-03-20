"use client"

import { Button } from "@/components/ui/button"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function UnsortedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Erro ao carregar ficheiros</h2>
        <p className="text-muted-foreground">
          Não foi possível carregar os ficheiros por classificar. Tente novamente.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button onClick={reset} variant="default">
            Tentar novamente
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
