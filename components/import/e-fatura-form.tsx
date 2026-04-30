"use client"

import { importEFaturaAction } from "@/app/(app)/import/e-fatura/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef } from "react"

export function EFaturaImportForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(importEFaturaAction, null)
  const ref = useRef<HTMLFormElement>(null)

  // Auto-jump to the batch review page once the import succeeds — the
  // user kept landing on /transactions and not finding the bulk-edit
  // toolbar that's actually on the batch detail page.
  useEffect(() => {
    if (state?.success && state.data?.batchId) {
      const t = setTimeout(() => {
        router.push(`/import/e-fatura/${state.data!.batchId}`)
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [state, router])

  return (
    <Card className="p-6 space-y-4 max-w-2xl">
      <form action={action} ref={ref} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Ficheiro CSV do e-Fatura</span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="mt-2 block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border file:bg-muted file:cursor-pointer"
          />
        </label>

        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> A importar…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" /> Importar
            </>
          )}
        </Button>
      </form>

      {state && state.success && state.data && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm">
          <div className="font-medium text-emerald-900">Importação concluída</div>
          <ul className="mt-2 space-y-1 text-emerald-900">
            <li>{state.data.imported} novas transações criadas</li>
            <li>
              {state.data.skipped} linhas ignoradas (já existiam por NIF + Nº documento)
            </li>
            {state.data.errors.length > 0 && (
              <li className="text-amber-800">
                {state.data.errors.length} erros — primeiro: {state.data.errors[0].reason}
              </li>
            )}
          </ul>
          <Link
            href={`/import/e-fatura/${state.data.batchId}`}
            className="mt-3 inline-block text-emerald-900 underline"
          >
            Abrir lote para classificar →
          </Link>
        </div>
      )}

      {state && !state.success && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          {state.error}
        </div>
      )}
    </Card>
  )
}
