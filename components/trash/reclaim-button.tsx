"use client"

import { reclaimStorageAction } from "@/app/(app)/trash/actions"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/utils"
import { Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

export function ReclaimStorageButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string>("")

  const click = () => {
    setResult("")
    startTransition(async () => {
      const r = await reclaimStorageAction()
      setResult(`${r.purgedFiles} ficheiro(s) órfão(s) apagado(s) — ${formatBytes(r.freedBytes)} libertados`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1 mt-2">
      <Button type="button" size="sm" variant="outline" onClick={click} disabled={pending}>
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        Recuperar espaço
      </Button>
      {result && <span className="text-[10px] text-emerald-700">{result}</span>}
    </div>
  )
}
