"use client"

import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectType } from "@/components/forms/select-type"
import { Button } from "@/components/ui/button"
import { Category, Currency } from "@/prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"

export default function GlobalSettingsForm({
  settings,
  currencies,
  categories,
}: {
  settings: Record<string, string>
  currencies: Currency[]
  categories: Category[]
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  return (
    <form action={saveAction} className="space-y-4">
      <FormSelectCurrency
        title="Moeda Predefinida"
        name="default_currency"
        defaultValue={settings.default_currency}
        currencies={currencies}
      />

      <FormSelectType title="Tipo de Transação Predefinido" name="default_type" defaultValue={settings.default_type} />

      <FormSelectCategory
        title="Categoria de Transação Predefinida"
        name="default_category"
        defaultValue={settings.default_category}
        categories={categories}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Retenção do caixote do lixo (dias)</span>
        <input
          type="number"
          name="trash_retention_days"
          min={1}
          max={3650}
          defaultValue={settings.trash_retention_days || "90"}
          className="px-3 py-2 rounded-md border bg-background w-32"
        />
        <span className="text-xs text-muted-foreground">
          Transações apagadas ficam no caixote do lixo durante este período antes de serem apagadas definitivamente. Default 90 dias.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Região fiscal (taxas de IVA)</span>
        <select
          name="default_vat_region"
          defaultValue={settings.default_vat_region || "mainland"}
          className="px-3 py-2 rounded-md border bg-background"
        >
          <option value="mainland">Continente (23 / 13 / 6 %)</option>
          <option value="madeira">Madeira (22 / 12 / 5 %)</option>
          <option value="azores">Açores (16 / 9 / 4 %)</option>
        </select>
        <span className="text-xs text-muted-foreground">
          Usada para inferir a taxa de IVA quando o documento traz só a base e o valor do imposto (ex: import e-Fatura).
        </span>
      </label>

      <div className="flex flex-row items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar..." : "Guardar Definições"}
        </Button>
        {saveState?.success && (
          <p className="text-green-500 flex flex-row items-center gap-2">
            <CircleCheckBig />
            Guardado!
          </p>
        )}
      </div>

      {saveState?.error && <FormError>{saveState.error}</FormError>}
    </form>
  )
}
