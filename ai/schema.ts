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
      "NIF / VAT ID do FORNECEDOR — quem EMITIU a fatura, normalmente no topo (cabeçalho/logo). Procura termos como 'Vendedor', 'Emissor', 'From', 'Bill from', 'Sold by', 'VAT Reg. No.', 'TVA', 'IVA Nº' associados ao nome da empresa que cobra. Aceitar qualquer formato fiscal (NIF PT 9 dígitos, 'IE 8256796 U', 'ES B12345678', 'FR 12345678901', etc.). Devolver SEM o prefixo de país e sem espaços. NUNCA usar o NIF que aparece junto a 'Cliente'/'Adquirente'/'Bill to'/'A:'. Em caso de dúvida entre dois NIFs, escolhe o que está MAIS PRÓXIMO do nome no cabeçalho.",
  },
  customerNif: {
    type: "string",
    description:
      "NIF / VAT ID do CLIENTE / ADQUIRENTE — a quem a fatura é EMITIDA. Procura termos como 'Cliente', 'Adquirente', 'Bill to', 'Cobrar a', 'Contribuinte n.º' na zona de morada do destinatário. Mesmas regras de formato. Pode ficar em branco se o documento for um recibo simples sem identificação do adquirente. NUNCA repetir o NIF do fornecedor.",
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
