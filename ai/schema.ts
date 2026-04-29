import { Field } from "@/prisma/client"

// Fields that only make sense at the transaction level, not per item
const TRANSACTION_ONLY_FIELDS = new Set([
  "nif",
  "customerNif",
  "vat_breakdown",
  "subtotal",
  "text",
  "projectCode",
  "categoryCode",
  "documentType",
  "documentNumber",
  "documentSeries",
  "atcud",
])

// Extra fields always included per item for Portuguese VAT compliance
const ITEM_VAT_FIELDS: Record<string, { type: string; description: string }> = {
  vat_rate: {
    type: "number",
    description: "taxa de IVA do item em percentagem (ex: 6, 13, 23). Cada item pode ter taxa diferente",
  },
  vat_amount: {
    type: "number",
    description: "valor do IVA deste item específico na moeda da fatura",
  },
}

// Fiscal fields extracted at document level (always included in schema).
// Forced into the JSON schema regardless of which Field rows the tenant
// has — without this the Portuguese fiscal data we surface in the form
// (NIF, document type, ATCUD) was being silently dropped on tenants
// whose default field catalog hadn't been seeded with these entries.
const FISCAL_FIELDS: Record<string, { type: string; description: string }> = {
  nif: {
    type: "string",
    description:
      "NIF / VAT ID do FORNECEDOR (emissor da fatura), tal como impresso. Aceitar qualquer formato fiscal: NIF PT (9 dígitos), 'VAT Reg. No.' UE (ex: 'IE 8256796 U', 'ES B12345678'), 'TVA' francês, etc. Devolver SEM o prefixo do país. Não confundir com o NIF do cliente.",
  },
  customerNif: {
    type: "string",
    description:
      "NIF / VAT ID do CLIENTE (a quem a fatura é emitida). Mesmas regras de formato do NIF do fornecedor. Pode estar em branco se o documento for um recibo simples sem identificação do adquirente.",
  },
  documentType: {
    type: "string",
    description:
      "tipo de documento fiscal: FT (Fatura), FR (Fatura-Recibo), NC (Nota de Crédito), ND (Nota de Débito), RC (Recibo), OR (Orçamento). Se não for possível determinar, usa FT para faturas e RC para recibos",
  },
  documentNumber: {
    type: "string",
    description:
      "número do documento/fatura tal como aparece no documento (ex: 'FT A/123', 'FR 2026/45', '123/2026'). Extrair exatamente como impresso",
  },
  atcud: {
    type: "string",
    description:
      "código ATCUD se presente no documento (formato: CODIGO-NUMERO, ex: 'CSDF7T5H-1'). Se não existir, deixar em branco",
  },
}

export const fieldsToJsonSchema = (fields: Field[]) => {
  const fieldsWithPrompt = fields.filter((field) => field.llm_prompt)
  const schemaProperties = fieldsWithPrompt.reduce(
    (acc, field) => {
      acc[field.code] = { type: field.type, description: field.llm_prompt || "" }
      return acc
    },
    {} as Record<string, { type: string; description: string }>
  )

  // Always include fiscal fields
  Object.assign(schemaProperties, FISCAL_FIELDS)

  // Item properties: exclude transaction-only fields, add per-item VAT fields
  const itemProperties = Object.entries(schemaProperties)
    .filter(([key]) => !TRANSACTION_ONLY_FIELDS.has(key))
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value
        return acc
      },
      {} as Record<string, { type: string; description: string }>
    )

  // Always include per-item VAT fields
  Object.assign(itemProperties, ITEM_VAT_FIELDS)

  const schema = {
    type: "object",
    properties: {
      ...schemaProperties,
      items: {
        type: "array",
        description:
          "Todos os produtos ou itens separados da fatura, cada um com o seu próprio total e taxa de IVA. Encontra todos os itens!",
        items: {
          type: "object",
          properties: itemProperties,
          required: [...Object.keys(itemProperties)],
          additionalProperties: false,
        },
      },
    },
    required: [...Object.keys(schemaProperties), "items"],
    additionalProperties: false,
  }

  return schema
}
