/**
 * Regras de dedutibilidade de IVA por categoria de despesa
 * Baseado na legislação fiscal portuguesa (CIVA)
 */

export interface DeductibilityRule {
  categoryCode: string
  deductibilityRate: number // 0 a 1 (0% a 100%)
  description: string
  legalBasis?: string
}

export const DEDUCTIBILITY_RULES: DeductibilityRule[] = [
  {
    categoryCode: "publicidade",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
    legalBasis: "Art. 19.º e 20.º do CIVA",
  },
  {
    categoryCode: "mercadorias",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
  },
  {
    categoryCode: "donativos",
    deductibilityRate: 0,
    description: "IVA não dedutível em donativos",
    legalBasis: "Art. 21.º do CIVA",
  },
  {
    categoryCode: "equipamento",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
  },
  {
    categoryCode: "eventos",
    deductibilityRate: 1.0,
    description: "Dedutível a 100% se para fins empresariais",
  },
  {
    categoryCode: "alimentacao",
    deductibilityRate: 1.0,
    description: "Dedutível a 100% para refeições de negócio",
    legalBasis: "Art. 21.º, n.º 1, al. d) do CIVA - restauração e bebidas",
  },
  {
    categoryCode: "seguros",
    deductibilityRate: 0,
    description: "Isento de IVA - não se aplica dedutibilidade",
    legalBasis: "Art. 9.º, n.º 1 do CIVA",
  },
  {
    categoryCode: "fatura",
    deductibilityRate: 1.0,
    description: "Dedutível conforme natureza da despesa",
  },
  {
    categoryCode: "comunicacoes",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
  },
  {
    categoryCode: "escritorio",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
  },
  {
    categoryCode: "servicos_online",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
  },
  {
    categoryCode: "rendas",
    deductibilityRate: 0,
    description: "Rendas habitualmente isentas de IVA",
    legalBasis: "Art. 9.º, n.º 29 do CIVA",
  },
  {
    categoryCode: "formacao",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
  },
  {
    categoryCode: "salarios",
    deductibilityRate: 0,
    description: "Não sujeito a IVA",
  },
  {
    categoryCode: "taxas",
    deductibilityRate: 0,
    description: "Impostos e taxas não dedutíveis",
  },
  {
    categoryCode: "viagens",
    deductibilityRate: 1.0,
    description: "Dedutível a 100% para despesas de deslocação profissional",
  },
  {
    categoryCode: "servicos_publicos",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
  },
  {
    categoryCode: "transportes",
    deductibilityRate: 0.5,
    description: "Dedutível a 50% para viaturas ligeiras de passageiros",
    legalBasis: "Art. 21.º, n.º 1, al. a) do CIVA",
  },
  {
    categoryCode: "software",
    deductibilityRate: 1.0,
    description: "Dedutível a 100%",
  },
  {
    categoryCode: "outros",
    deductibilityRate: 1.0,
    description: "Dedutibilidade depende da natureza específica da despesa",
  },
]

export function getDeductibilityRate(categoryCode: string): number {
  const rule = DEDUCTIBILITY_RULES.find((r) => r.categoryCode === categoryCode)
  return rule ? rule.deductibilityRate : 1.0
}

export function getDeductibilityRule(categoryCode: string): DeductibilityRule | undefined {
  return DEDUCTIBILITY_RULES.find((r) => r.categoryCode === categoryCode)
}

export function calculateDeductibleVAT(vatAmount: number, categoryCode: string): number {
  const rate = getDeductibilityRate(categoryCode)
  return Math.round(vatAmount * rate)
}
