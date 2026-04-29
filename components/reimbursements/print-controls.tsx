"use client"

export function PrintControls() {
  return (
    <div className="flex justify-between items-start gap-4 print:hidden mb-6">
      <button
        type="button"
        onClick={() => history.back()}
        className="text-sm px-3 py-1.5 rounded-md border bg-background hover:bg-muted"
      >
        ← Voltar
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground"
      >
        Imprimir / Guardar PDF
      </button>
    </div>
  )
}
