"use client"

import { deleteTransactionAction, saveTransactionAction } from "@/app/(app)/transactions/actions"
import { ItemsDetectTool } from "@/components/agents/items-detect"
import { VatBreakdownTable } from "@/components/agents/vat-breakdown"
import ToolWindow from "@/components/agents/tool-window"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectTreasuryAccount } from "@/components/forms/select-treasury-account"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { TransactionData } from "@/models/transactions"
import { Category, Currency, Field, Project, Transaction, TreasuryAccount } from "@/prisma/client"
import { format } from "date-fns"
import { Loader2, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useMemo, useState } from "react"

export default function TransactionEditForm({
  transaction,
  categories,
  projects,
  currencies,
  fields,
  settings,
  treasuryAccounts,
}: {
  transaction: Transaction
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
  treasuryAccounts: TreasuryAccount[]
}) {
  const router = useRouter()
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteTransactionAction, null)
  const [saveState, saveAction, isSaving] = useActionState(saveTransactionAction, null)

  const extraFields = fields.filter((field) => field.isExtra)
  const [formData, setFormData] = useState({
    name: transaction.name || "",
    merchant: transaction.merchant || "",
    description: transaction.description || "",
    total: transaction.total ? transaction.total / 100 : 0.0,
    currencyCode: transaction.currencyCode || settings.default_currency,
    convertedTotal: transaction.convertedTotal ? transaction.convertedTotal / 100 : 0.0,
    convertedCurrencyCode: transaction.convertedCurrencyCode,
    type: transaction.type || "expense",
    categoryCode: transaction.categoryCode || settings.default_category,
    projectCode: transaction.projectCode || settings.default_project,
    treasuryAccountCode: transaction.treasuryAccountCode || settings.default_treasury_account || "personal",
    issuedAt: transaction.issuedAt ? format(transaction.issuedAt, "yyyy-MM-dd") : "",
    note: transaction.note || "",
    items: transaction.items || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vat_breakdown: (transaction as any).vat_breakdown || null,
    ...extraFields.reduce(
      (acc, field) => {
        acc[field.code] = transaction.extra?.[field.code as keyof typeof transaction.extra] || ""
        return acc
      },
      {} as Record<string, string>
    ),
  })

  const fieldMap = useMemo(() => {
    return fields.reduce(
      (acc, field) => {
        acc[field.code] = field
        return acc
      },
      {} as Record<string, Field>
    )
  }, [fields])

  const handleDelete = async () => {
    if (confirm("Tem a certeza? Esta ação irá eliminar a transação e todos os ficheiros permanentemente")) {
      startTransition(async () => {
        await deleteAction(transaction.id)
        router.back()
      })
    }
  }

  useEffect(() => {
    if (saveState?.success) {
      router.back()
    }
  }, [saveState, router])

  return (
    <form action={saveAction} className="space-y-4">
      <input type="hidden" name="transactionId" value={transaction.id} />

      <FormInput
        title={fieldMap.name.name}
        name="name"
        defaultValue={formData.name}
        isRequired={fieldMap.name.isRequired}
      />

      <FormInput
        title={fieldMap.merchant.name}
        name="merchant"
        defaultValue={formData.merchant}
        isRequired={fieldMap.merchant.isRequired}
      />

      <FormInput
        title={fieldMap.description.name}
        name="description"
        defaultValue={formData.description}
        isRequired={fieldMap.description.isRequired}
      />

      <div className="flex flex-row gap-4">
        <FormInput
          title={fieldMap.total.name}
          type="number"
          step="0.01"
          name="total"
          defaultValue={formData.total.toFixed(2)}
          className="w-32"
          isRequired={fieldMap.total.isRequired}
        />

        <FormSelectCurrency
          title={fieldMap.currencyCode.name}
          name="currencyCode"
          value={formData.currencyCode}
          onValueChange={(value) => {
            setFormData({ ...formData, currencyCode: value })
          }}
          currencies={currencies}
          isRequired={fieldMap.currencyCode.isRequired}
        />

        <FormSelectType
          title={fieldMap.type.name}
          name="type"
          defaultValue={formData.type}
          isRequired={fieldMap.type.isRequired}
        />
      </div>

      <div className="flex flex-row flex-grow gap-4">
        <FormInput
          title={fieldMap.issuedAt.name}
          type="date"
          name="issuedAt"
          defaultValue={formData.issuedAt}
          isRequired={fieldMap.issuedAt.isRequired}
        />
        {formData.currencyCode !== settings.default_currency || formData.convertedTotal !== 0 ? (
          <>
            {formData.convertedTotal !== null && (
              <FormInput
                title={`Total convertido para ${formData.convertedCurrencyCode || "MOEDA DESCONHECIDA"}`}
                type="number"
                step="0.01"
                name="convertedTotal"
                defaultValue={formData.convertedTotal.toFixed(2)}
                isRequired={fieldMap.convertedTotal.isRequired}
                className="max-w-36"
              />
            )}
            {(!formData.convertedCurrencyCode || formData.convertedCurrencyCode !== settings.default_currency) && (
              <FormSelectCurrency
                title="Converter para"
                name="convertedCurrencyCode"
                defaultValue={formData.convertedCurrencyCode || settings.default_currency}
                currencies={currencies}
                isRequired={fieldMap.convertedCurrencyCode.isRequired}
              />
            )}
          </>
        ) : (
          <></>
        )}
      </div>

      <div className="flex flex-row gap-4">
        <FormSelectCategory
          title={fieldMap.categoryCode.name}
          categories={categories}
          name="categoryCode"
          defaultValue={formData.categoryCode}
          isRequired={fieldMap.categoryCode.isRequired}
        />

        <FormSelectProject
          title={fieldMap.projectCode.name}
          projects={projects}
          name="projectCode"
          defaultValue={formData.projectCode}
          isRequired={fieldMap.projectCode.isRequired}
        />
      </div>

      {treasuryAccounts.length > 0 && (
        <FormSelectTreasuryAccount
          title="Conta de Tesouraria"
          accounts={treasuryAccounts}
          name="treasuryAccountCode"
          defaultValue={formData.treasuryAccountCode}
        />
      )}

      <details className="rounded-md border bg-muted/30 p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Fiscal: IVA, base, retenção na fonte
        </summary>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <FormInput
            title="Base Tributável"
            type="number"
            step="0.01"
            name="subtotal"
            defaultValue={transaction.subtotal != null ? (transaction.subtotal / 100).toFixed(2) : ""}
          />
          <FormInput
            title="IVA (€)"
            type="number"
            step="0.01"
            name="vatAmount"
            defaultValue={transaction.vatAmount != null ? (transaction.vatAmount / 100).toFixed(2) : ""}
          />
          <FormInput
            title="Taxa IVA (%)"
            type="number"
            step="0.01"
            name="vatRate"
            defaultValue={transaction.vatRate != null ? String(transaction.vatRate) : ""}
          />
          <FormInput
            title="NIF Fornecedor"
            name="nif"
            defaultValue={transaction.nif ?? ""}
          />
          <FormInput
            title="Retenção na Fonte (%)"
            type="number"
            step="0.01"
            name="withholdingRate"
            defaultValue={transaction.withholdingRate != null ? String(transaction.withholdingRate) : ""}
          />
          <FormInput
            title="Retenção na Fonte (€)"
            type="number"
            step="0.01"
            name="withholdingAmount"
            defaultValue={
              transaction.withholdingAmount != null
                ? (transaction.withholdingAmount / 100).toFixed(2)
                : ""
            }
          />
        </div>
      </details>

      <FormTextarea
        title={fieldMap.note.name}
        name="note"
        defaultValue={formData.note}
        className="h-24"
        isRequired={fieldMap.note.isRequired}
      />

      <div className="flex flex-wrap gap-4">
        {extraFields.map((field) => (
          <FormInput
            key={field.code}
            type="text"
            title={field.name}
            name={field.code}
            defaultValue={(formData[field.code as keyof typeof formData] as string) || ""}
            isRequired={field.isRequired}
            className={field.type === "number" ? "max-w-36" : "max-w-full"}
          />
        ))}
      </div>

      {formData.vat_breakdown && (
        <ToolWindow title="Desdobramento de IVA">
          <VatBreakdownTable
            vatBreakdown={formData.vat_breakdown}
            currencyCode={formData.currencyCode || settings.default_currency}
          />
        </ToolWindow>
      )}

      {formData.items && Array.isArray(formData.items) && formData.items.length > 0 && (
        <ToolWindow title="Itens detetados">
          <ItemsDetectTool data={formData as TransactionData} />
        </ToolWindow>
      )}

      <div className="flex justify-between space-x-4 pt-6">
        <Button type="button" onClick={handleDelete} variant="destructive" disabled={isDeleting}>
          <>
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "⏳ A eliminar..." : "Eliminar"}
          </>
        </Button>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              A guardar...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Transação
            </>
          )}
        </Button>
      </div>

      <div>
        {deleteState?.error && <FormError>{deleteState.error}</FormError>}
        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </div>
    </form>
  )
}
