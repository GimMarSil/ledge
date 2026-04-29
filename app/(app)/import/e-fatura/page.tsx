import { EFaturaImportForm } from "@/components/import/e-fatura-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Importar e-Fatura",
}

export default function EFaturaImportPage() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 w-full">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Importar e-Fatura</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-prose">
          Carregue o CSV exportado do{" "}
          <a
            href="https://faturas.portaldasfinancas.gov.pt"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Portal das Finanças → e-Fatura
          </a>
          . Cada linha torna-se uma transação com os campos fiscais já preenchidos
          (NIF do fornecedor, número de documento, ATCUD, total, IVA). Ficheiros já
          importados são automaticamente ignorados (deduplicação por NIF + Nº
          documento).
        </p>
      </header>

      <EFaturaImportForm />
    </div>
  )
}
