/**
 * Tipos de documento fiscal português conformes à AT
 */

export const DOCUMENT_TYPES = {
  FT: { code: "FT", name: "Fatura", description: "Fatura standard" },
  FR: { code: "FR", name: "Fatura-Recibo", description: "Fatura com quitação integrada" },
  NC: { code: "NC", name: "Nota de Crédito", description: "Anulação parcial ou total de fatura" },
  ND: { code: "ND", name: "Nota de Débito", description: "Acréscimo ao valor de fatura" },
  RC: { code: "RC", name: "Recibo", description: "Comprovativo de pagamento" },
  OR: { code: "OR", name: "Orçamento", description: "Documento proforma (não reportado à AT)" },
  GT: { code: "GT", name: "Guia de Transporte", description: "Documento de movimentação de bens" },
} as const

export type DocumentTypeCode = keyof typeof DOCUMENT_TYPES

export const REPORTABLE_DOCUMENT_TYPES: DocumentTypeCode[] = ["FT", "FR", "NC", "ND", "RC"]

export const SAFT_INVOICE_TYPES: DocumentTypeCode[] = ["FT", "FR", "NC", "ND"]

export const FISCAL_STATUS = {
  draft: { code: "draft", name: "Rascunho", description: "Documento ainda não emitido" },
  issued: { code: "issued", name: "Emitido", description: "Documento emitido e válido" },
  cancelled: { code: "cancelled", name: "Anulado", description: "Documento anulado" },
} as const

export type FiscalStatusCode = keyof typeof FISCAL_STATUS

export const DOCUMENT_TYPE_OPTIONS = Object.values(DOCUMENT_TYPES).map((dt) => ({
  code: dt.code,
  name: `${dt.code} - ${dt.name}`,
  description: dt.description,
}))

/**
 * Taxas de IVA portuguesas por região
 */
export const IVA_RATES = {
  PT: {
    NOR: { code: "NOR", rate: 23, description: "Taxa Normal" },
    INT: { code: "INT", rate: 13, description: "Taxa Intermédia" },
    RED: { code: "RED", rate: 6, description: "Taxa Reduzida" },
    ISE: { code: "ISE", rate: 0, description: "Isento" },
  },
  "PT-AC": {
    NOR: { code: "NOR", rate: 18, description: "Taxa Normal (Açores)" },
    INT: { code: "INT", rate: 9, description: "Taxa Intermédia (Açores)" },
    RED: { code: "RED", rate: 4, description: "Taxa Reduzida (Açores)" },
    ISE: { code: "ISE", rate: 0, description: "Isento" },
  },
  "PT-MA": {
    NOR: { code: "NOR", rate: 22, description: "Taxa Normal (Madeira)" },
    INT: { code: "INT", rate: 12, description: "Taxa Intermédia (Madeira)" },
    RED: { code: "RED", rate: 5, description: "Taxa Reduzida (Madeira)" },
    ISE: { code: "ISE", rate: 0, description: "Isento" },
  },
} as const

export type TaxRegion = keyof typeof IVA_RATES
export type TaxCode = "NOR" | "INT" | "RED" | "ISE"

/**
 * Artigos de isenção IVA mais comuns
 */
export const IVA_EXEMPTION_REASONS = [
  { code: "M01", description: "Artigo 16.º, n.º 6 do CIVA" },
  { code: "M02", description: "Artigo 6.º do Decreto-Lei n.º 198/90, de 19 de Junho" },
  { code: "M04", description: "Isento artigo 13.º do CIVA" },
  { code: "M05", description: "Isento artigo 14.º do CIVA" },
  { code: "M06", description: "Isento artigo 15.º do CIVA" },
  { code: "M07", description: "Isento artigo 9.º do CIVA" },
  { code: "M09", description: "IVA - não confere direito a dedução" },
  { code: "M10", description: "IVA - regime de isenção (art. 53.º do CIVA)" },
  { code: "M11", description: "Regime particular do tabaco" },
  { code: "M12", description: "Regime da margem de lucro - Agências de viagens" },
  { code: "M13", description: "Regime da margem de lucro - Bens em segunda m��o" },
  { code: "M14", description: "Regime da margem de lucro - Objetos de arte" },
  { code: "M15", description: "Regime da margem de lucro - Objetos de coleção e antiguidades" },
  { code: "M16", description: "Isento artigo 14.º do RITI" },
  { code: "M19", description: "Outras isenções" },
  { code: "M20", description: "IVA - regime forfetário (art. 59.º-D do CIVA)" },
  { code: "M21", description: "IVA - não confere direito a dedução (ou expressão similar)" },
  { code: "M25", description: "Mercadorias à consignação" },
  { code: "M30", description: "IVA - autoliquidação" },
  { code: "M31", description: "IVA - autoliquidação (art. 2.º, n.º 1, alínea j) do CIVA)" },
  { code: "M32", description: "IVA - autoliquidação (art. 2.º, n.º 1, alínea l) do CIVA)" },
  { code: "M33", description: "IVA - autoliquidação (art. 2.º, n.º 1, alínea m) do CIVA)" },
  { code: "M40", description: "IVA - autoliquidação (art.º 6.º, n.º 6, alínea a) do CIVA, a contrário)" },
  { code: "M41", description: "IVA - autoliquidação (art.º 8.º, n.º 3 do RITI)" },
  { code: "M42", description: "IVA - autoliquidação (Decreto-Lei n.º 21/2007, de 29 de Janeiro)" },
  { code: "M43", description: "IVA - autoliquidação (Decreto-Lei n.º 362/99, de 16 de Setembro)" },
  { code: "M99", description: "Não sujeito; não tributado (ou expressão similar)" },
] as const
