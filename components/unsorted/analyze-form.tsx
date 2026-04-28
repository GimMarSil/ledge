"use client"

import { useNotification } from "@/app/(app)/context"
import { analyzeFileAction, deleteUnsortedFileAction, saveFileAsTransactionAction } from "@/app/(app)/unsorted/actions"
import { CurrencyConverterTool } from "@/components/agents/currency-converter"
import ToolWindow from "@/components/agents/tool-window"
import { EditableItemsTable, type EditableItem } from "@/components/unsorted/editable-items-table"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Category, Currency, Field, File, Project } from "@/prisma/client"
import { format } from "date-fns"
import { ArrowDownToLine, Brain, Loader2, Trash2 } from "lucide-react"
import { startTransition, useActionState, useMemo, useState } from "react"

export default function AnalyzeForm({
  file,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: {
  file: File
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}) {
  const { showNotification } = useNotification()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState<string>("")
  const [analyzeError, setAnalyzeError] = useState<string>("")
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteUnsortedFileAction, null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const fieldMap = useMemo(() => {
    return fields.reduce(
      (acc, field) => {
        acc[field.code] = field
        return acc
      },
      {} as Record<string, Field>
    )
  }, [fields])

  // Defensive lookup: when defaults haven't been seeded yet (fresh install,
  // brand-new tenant via provision endpoint), the field map can be missing
  // entries the form expects. Returning a safe fallback prevents the whole
  // page from crashing with "Cannot read properties of undefined".
  const f = (code: string, fallbackName: string) =>
    fieldMap[code] ?? {
      name: fallbackName,
      isRequired: false,
      isVisibleInAnalysis: true,
    } as unknown as Field

  const extraFields = useMemo(() => fields.filter((field) => field.isExtra), [fields])
  const initialFormState = useMemo(() => {
    const baseState = {
      name: file.filename,
      merchant: "",
      description: "",
      type: settings.default_type,
      total: 0.0,
      currencyCode: settings.default_currency,
      convertedTotal: 0.0,
      convertedCurrencyCode: settings.default_currency,
      categoryCode: settings.default_category,
      projectCode: settings.default_project,
      issuedAt: "",
      note: "",
      text: "",
      items: [] as EditableItem[],
      // Portuguese fiscal fields surfaced from the AI extraction so the
      // SAFT-PT export and IVA report have the data they need.
      nif: "",
      customerNif: "",
      documentType: "",
      documentNumber: "",
      atcud: "",
      subtotal: "",
      vatAmount: "",
    }

    // Add extra fields
    const extraFieldsState = extraFields.reduce(
      (acc, field) => {
        acc[field.code] = ""
        return acc
      },
      {} as Record<string, string>
    )

    // Load cached results if they exist
    const cachedResults = file.cachedParseResult
      ? Object.fromEntries(
          Object.entries(file.cachedParseResult as Record<string, string>).filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
          )
        )
      : {}

    return {
      ...baseState,
      ...extraFieldsState,
      ...cachedResults,
    }
  }, [file.filename, settings, extraFields, file.cachedParseResult])
  const [formData, setFormData] = useState(initialFormState)

  async function saveAsTransaction(formData: FormData) {
    setSaveError("")
    setIsSaving(true)
    startTransition(async () => {
      const result = await saveFileAsTransactionAction(null, formData)
      setIsSaving(false)

      if (result.success) {
        showNotification({ code: "global.banner", message: "Guardado!", type: "success" })
        showNotification({ code: "sidebar.transactions", message: "new" })
        setTimeout(() => showNotification({ code: "sidebar.transactions", message: "" }), 3000)
      } else {
        setSaveError(result.error ? result.error : "Algo correu mal...")
        showNotification({ code: "global.banner", message: "Falha ao guardar", type: "failed" })
      }
    })
  }

  const startAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalyzeError("")
    try {
      setAnalyzeStep("A analisar...")
      const results = await analyzeFileAction(file, settings, fields, categories, projects)

      if (!results.success) {
        setAnalyzeError(results.error ? results.error : "Algo correu mal...")
      } else {
        const nonEmptyFields = Object.fromEntries(
          Object.entries(results.data?.output || {}).filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
          )
        )
        setFormData({ ...formData, ...nonEmptyFields })
      }
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : "Falha na análise")
    } finally {
      setIsAnalyzing(false)
      setAnalyzeStep("")
    }
  }

  return (
    <>
      {file.isSplitted ? (
        <div className="flex justify-end">
          <Badge variant="outline">Este ficheiro foi dividido</Badge>
        </div>
      ) : (
        <Button className="w-full mb-6 py-6 text-lg" onClick={startAnalyze} disabled={isAnalyzing} data-analyze-button>
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              <span>{analyzeStep}</span>
            </>
          ) : (
            <>
              <Brain className="mr-1 h-4 w-4" />
              <span>Analisar com IA</span>
            </>
          )}
        </Button>
      )}

      <div>{analyzeError && <FormError>{analyzeError}</FormError>}</div>

      <form className="space-y-4" action={saveAsTransaction}>
        <input type="hidden" name="fileId" value={file.id} />
        <FormInput
          title={f("name", "Nome").name}
          name="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required={f("name", "Nome").isRequired}
        />

        <FormInput
          title={f("merchant", "Fornecedor").name}
          name="merchant"
          value={formData.merchant}
          onChange={(e) => setFormData((prev) => ({ ...prev, merchant: e.target.value }))}
          hideIfEmpty={!f("merchant", "Fornecedor").isVisibleInAnalysis}
          required={f("merchant", "Fornecedor").isRequired}
        />

        <FormInput
          title={f("description", "Descrição").name}
          name="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          hideIfEmpty={!f("description", "Descrição").isVisibleInAnalysis}
          required={f("description", "Descrição").isRequired}
        />

        <div className="flex flex-wrap gap-4">
          <FormInput
            title={f("total", "Total").name}
            name="total"
            type="number"
            step="0.01"
            value={formData.total || ""}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value || "0")
              if (!isNaN(newValue)) { setFormData((prev) => ({ ...prev, total: newValue })) }
            }}
            className="w-32"
            required={f("total", "Total").isRequired}
          />

          <FormSelectCurrency
            title={f("currencyCode", "Moeda").name}
            currencies={currencies}
            name="currencyCode"
            value={formData.currencyCode}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, currencyCode: value }))}
            hideIfEmpty={!f("currencyCode", "Moeda").isVisibleInAnalysis}
            required={f("currencyCode", "Moeda").isRequired}
          />

          <FormSelectType
            title={f("type", "Tipo").name}
            name="type"
            value={formData.type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
            hideIfEmpty={!f("type", "Tipo").isVisibleInAnalysis}
            required={f("type", "Tipo").isRequired}
          />
        </div>

        {formData.total != 0 && formData.currencyCode && formData.currencyCode !== settings.default_currency && (
          <ToolWindow title={`Taxa de câmbio em ${format(new Date(formData.issuedAt || Date.now()), "dd/MM/yyyy")}`}>
            <CurrencyConverterTool
              originalTotal={formData.total}
              originalCurrencyCode={formData.currencyCode}
              targetCurrencyCode={settings.default_currency}
              date={new Date(formData.issuedAt || Date.now())}
              onChange={(value) => setFormData((prev) => ({ ...prev, convertedTotal: value }))}
            />
            <input type="hidden" name="convertedCurrencyCode" value={settings.default_currency} />
          </ToolWindow>
        )}

        <div className="flex flex-row gap-4">
          <FormInput
            title={f("issuedAt", "Data de Emissão").name}
            type="date"
            name="issuedAt"
            value={formData.issuedAt}
            onChange={(e) => setFormData((prev) => ({ ...prev, issuedAt: e.target.value }))}
            hideIfEmpty={!f("issuedAt", "Data de Emissão").isVisibleInAnalysis}
            required={f("issuedAt", "Data de Emissão").isRequired}
          />
        </div>

        <div className="flex flex-row gap-4">
          <FormSelectCategory
            title={f("categoryCode", "Categoria").name}
            categories={categories}
            name="categoryCode"
            value={formData.categoryCode}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryCode: value }))}
            placeholder="Selecionar Categoria"
            hideIfEmpty={!f("categoryCode", "Categoria").isVisibleInAnalysis}
            required={f("categoryCode", "Categoria").isRequired}
          />

          {projects.length > 0 && (
            <FormSelectProject
              title={f("projectCode", "Projeto").name}
              projects={projects}
              name="projectCode"
              value={formData.projectCode}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, projectCode: value }))}
              placeholder="Selecionar Projeto"
              hideIfEmpty={!f("projectCode", "Projeto").isVisibleInAnalysis}
              required={f("projectCode", "Projeto").isRequired}
            />
          )}
        </div>

        <FormInput
          title={f("note", "Nota").name}
          name="note"
          value={formData.note}
          onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
          hideIfEmpty={!f("note", "Nota").isVisibleInAnalysis}
          required={f("note", "Nota").isRequired}
        />

        {/* Dados Fiscais — campos exigidos para SAFT-PT e relatórios de IVA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t mt-4">
          <FormInput
            title="Tipo de Documento"
            name="documentType"
            value={formData.documentType || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, documentType: e.target.value }))}
            placeholder="FT, FR, NC, ND, RC..."
          />
          <FormInput
            title="Nº de Documento"
            name="documentNumber"
            value={formData.documentNumber || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, documentNumber: e.target.value }))}
            placeholder="Ex: FT A/123"
          />
          <FormInput
            title="NIF do Fornecedor"
            name="nif"
            value={formData.nif || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, nif: e.target.value }))}
            placeholder="9 dígitos"
          />
        </div>
        {/* Hidden — preserved end-to-end so the AI's extraction reaches the DB
            even when the field is not visible in the form. */}
        <input type="hidden" name="customerNif" value={formData.customerNif || ""} />
        <input type="hidden" name="atcud" value={formData.atcud || ""} />
        <input type="hidden" name="subtotal" value={formData.subtotal == null ? "" : String(formData.subtotal)} />
        <input type="hidden" name="vatAmount" value={formData.vatAmount == null ? "" : String(formData.vatAmount)} />
        <input type="hidden" name="vat_breakdown" value={(formData as Record<string, unknown>).vat_breakdown ? JSON.stringify((formData as Record<string, unknown>).vat_breakdown) : ""} />

        {extraFields.map((field) => (
          <FormInput
            key={field.code}
            type="text"
            title={field.name}
            name={field.code}
            value={formData[field.code as keyof typeof formData] as string | number | undefined}
            onChange={(e) => setFormData((prev) => ({ ...prev, [field.code]: e.target.value }))}
            hideIfEmpty={!field.isVisibleInAnalysis}
            required={field.isRequired}
          />
        ))}

        {/* Linhas editáveis com resumo IVA por taxa e verificação de
            consistência cabeçalho ↔ linhas. Substitui o ItemsDetectTool
            read-only e o VatBreakdownTable derivado de uma string opaca. */}
        <ToolWindow title="Linhas da fatura">
          <EditableItemsTable
            items={(formData.items as EditableItem[]) || []}
            currencyCode={formData.currencyCode || settings.default_currency}
            headerTotal={
              typeof formData.total === "number" ? Math.round(formData.total * 100) : null
            }
            onChange={(items) => setFormData((prev) => ({ ...prev, items }))}
            onApplyToHeader={(t) => {
              setFormData((prev) => ({
                ...prev,
                total: t.total / 100,
                subtotal: String(t.subtotal / 100),
                vatAmount: String(t.vatAmount / 100),
                // hidden vat_breakdown input picks this up on submit
                vat_breakdown: t.vatBreakdown as unknown as string,
              }))
            }}
          />
        </ToolWindow>

        <div className="hidden">
          <input type="text" name="items" value={JSON.stringify(formData.items)} readOnly />
          <FormTextarea
            title={f("text", "Texto reconhecido").name}
            name="text"
            value={formData.text}
            onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
            hideIfEmpty={!f("text", "Texto reconhecido").isVisibleInAnalysis}
          />
        </div>

        <div className="flex justify-between gap-4 pt-6">
          <Button
            type="button"
            onClick={() => startTransition(() => deleteAction(file.id))}
            variant="destructive"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "⏳ A eliminar..." : "Eliminar"}
          </Button>

          <Button type="submit" disabled={isSaving} data-save-button>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4" />
                Guardar como Transação
              </>
            )}
          </Button>
        </div>

        <div>
          {deleteState?.error && <FormError>{deleteState.error}</FormError>}
          {saveError && <FormError>{saveError}</FormError>}
        </div>
      </form>
    </>
  )
}
