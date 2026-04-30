/**
 * Calendario Fiscal Portugues
 * Obrigações e prazos legais por regime fiscal
 */

export type BusinessRegime =
  | "trabalhador_dependente"
  | "trabalhador_independente"
  | "micro_empresa"
  | "pme"
  | "sgps"
  | "grande_empresa"

export const BUSINESS_REGIME_LABELS: Record<BusinessRegime, string> = {
  trabalhador_dependente: "Trabalhador Dependente",
  trabalhador_independente: "Trabalhador Independente",
  micro_empresa: "Micro-empresa",
  pme: "PME / Media Empresa",
  sgps: "SGPS (Holding)",
  grande_empresa: "Grande Empresa",
}

export type FiscalObligationType =
  | "iva_mensal"
  | "iva_trimestral"
  | "irs_anual"
  | "irs_pagamento_conta"
  | "irc_modelo22"
  | "irc_pagamento_conta"
  | "irc_pagamento_especial"
  | "ies"
  | "tsu"
  | "comunicação_faturas"
  | "retencoes_fonte"

export type UrgencyLevel = "overdue" | "urgent" | "soon" | "upcoming" | "distant"

export interface FiscalDeadlineInstance {
  type: FiscalObligationType
  name: string
  description: string
  dueDate: Date
  referencePeriod: string
  legalBasis?: string
}

interface FiscalObligation {
  type: FiscalObligationType
  name: string
  description: string
  frequency: "monthly" | "quarterly" | "annual" | "3x_year"
  applicableRegimes: BusinessRegime[]
  legalBasis?: string
  getDeadlines(year: number): FiscalDeadlineInstance[]
}

// ─── Helper: último dia útil do mes ────────────────────────────────

function lastBusinessDay(year: number, month: number): Date {
  // month is 0-indexed
  const lastDay = new Date(year, month + 1, 0) // last calendar day
  const dow = lastDay.getDay()
  if (dow === 0) lastDay.setDate(lastDay.getDate() - 2) // Sunday -> Friday
  if (dow === 6) lastDay.setDate(lastDay.getDate() - 1) // Saturday -> Friday
  return lastDay
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

// ─── Obrigações Fiscais ────────────────────────────────────────────

const FISCAL_OBLIGATIONS: FiscalObligation[] = [
  // IVA Mensal - dia 10 do 2o mes seguinte
  {
    type: "iva_mensal",
    name: "Declaração Periodica IVA (Mensal)",
    description: "Entrega mensal da declaração periodica de IVA e respetivo pagamento",
    frequency: "monthly",
    applicableRegimes: ["pme", "grande_empresa", "sgps"],
    legalBasis: "Art. 41.o do CIVA",
    getDeadlines(year: number) {
      const deadlines: FiscalDeadlineInstance[] = []
      for (let month = 0; month < 12; month++) {
        // Deadline is 10th of the 2nd month after reference
        const dueMonth = month + 2
        const dueYear = year + Math.floor(dueMonth / 12)
        const dueMonthIdx = dueMonth % 12
        deadlines.push({
          type: "iva_mensal",
          name: "Declaração Periodica IVA",
          description: `IVA referente a ${MONTH_NAMES[month]} ${year}`,
          dueDate: new Date(dueYear, dueMonthIdx, 10),
          referencePeriod: `${MONTH_NAMES[month]} ${year}`,
          legalBasis: "Art. 41.o do CIVA",
        })
      }
      return deadlines
    },
  },

  // IVA Trimestral - dia 15 do 2o mes apos trimestre
  {
    type: "iva_trimestral",
    name: "Declaração Periodica IVA (Trimestral)",
    description: "Entrega trimestral da declaração periodica de IVA e respetivo pagamento",
    frequency: "quarterly",
    applicableRegimes: ["trabalhador_independente", "micro_empresa"],
    legalBasis: "Art. 41.o do CIVA",
    getDeadlines(year: number) {
      const quarters = [
        { q: "1T", months: "Jan-Mar", dueMonth: 4, dueDay: 15 },
        { q: "2T", months: "Abr-Jun", dueMonth: 7, dueDay: 15 },
        { q: "3T", months: "Jul-Set", dueMonth: 10, dueDay: 15 },
        { q: "4T", months: "Out-Dez", dueMonth: 1, dueDay: 15, nextYear: true },
      ]
      return quarters.map((q) => ({
        type: "iva_trimestral" as const,
        name: "Declaração Periodica IVA",
        description: `IVA referente ao ${q.q} (${q.months}) de ${year}`,
        dueDate: new Date(q.nextYear ? year + 1 : year, q.dueMonth - 1, q.dueDay),
        referencePeriod: `${q.q} ${year}`,
        legalBasis: "Art. 41.o do CIVA",
      }))
    },
  },

  // IRS Anual - 1 Abril a 30 Junho
  {
    type: "irs_anual",
    name: "Declaração Anual de IRS (Modelo 3)",
    description: "Entrega da declaração anual de rendimentos (IRS)",
    frequency: "annual",
    applicableRegimes: ["trabalhador_dependente", "trabalhador_independente"],
    legalBasis: "Art. 60.o do CIRS",
    getDeadlines(year: number) {
      return [{
        type: "irs_anual",
        name: "Declaração IRS (Modelo 3)",
        description: `Declaração de rendimentos de ${year - 1}. Período: 1 Abril - 30 Junho ${year}`,
        dueDate: new Date(year, 5, 30), // 30 June
        referencePeriod: `Ano ${year - 1}`,
        legalBasis: "Art. 60.o do CIRS",
      }]
    },
  },

  // IRS Pagamentos por Conta - Jul/Set/Dez dia 20
  {
    type: "irs_pagamento_conta",
    name: "Pagamento por Conta IRS",
    description: "Pagamentos por conta trimestrais de IRS",
    frequency: "3x_year",
    applicableRegimes: ["trabalhador_independente"],
    legalBasis: "Art. 102.o do CIRS",
    getDeadlines(year: number) {
      const months = [
        { month: 6, label: "1.o Pagamento (Julho)" },
        { month: 8, label: "2.o Pagamento (Setembro)" },
        { month: 11, label: "3.o Pagamento (Dezembro)" },
      ]
      return months.map((m) => ({
        type: "irs_pagamento_conta" as const,
        name: "Pagamento por Conta IRS",
        description: `${m.label} - pagamento por conta de IRS ${year}`,
        dueDate: new Date(year, m.month, 20),
        referencePeriod: `${year}`,
        legalBasis: "Art. 102.o do CIRS",
      }))
    },
  },

  // IRC Modelo 22 - ultimo dia de Maio
  {
    type: "irc_modelo22",
    name: "Declaração IRC (Modelo 22)",
    description: "Entrega da declaração anual de IRC e pagamento do imposto",
    frequency: "annual",
    applicableRegimes: ["micro_empresa", "pme", "sgps", "grande_empresa"],
    legalBasis: "Art. 120.o do CIRC",
    getDeadlines(year: number) {
      return [{
        type: "irc_modelo22",
        name: "Declaração IRC (Modelo 22)",
        description: `Declaração de rendimentos de ${year - 1}. Prazo: último dia útil de Maio ${year}`,
        dueDate: lastBusinessDay(year, 4), // May (0-indexed)
        referencePeriod: `Ano ${year - 1}`,
        legalBasis: "Art. 120.o do CIRC",
      }]
    },
  },

  // IRC Pagamentos por Conta - Jul/Set/Dez último dia útil
  {
    type: "irc_pagamento_conta",
    name: "Pagamento por Conta IRC",
    description: "Pagamentos por conta trimestrais de IRC",
    frequency: "3x_year",
    applicableRegimes: ["micro_empresa", "pme", "sgps", "grande_empresa"],
    legalBasis: "Art. 104.o do CIRC",
    getDeadlines(year: number) {
      const months = [
        { month: 6, label: "1.o Pagamento (Julho)" },
        { month: 8, label: "2.o Pagamento (Setembro)" },
        { month: 11, label: "3.o Pagamento (Dezembro)" },
      ]
      return months.map((m) => ({
        type: "irc_pagamento_conta" as const,
        name: "Pagamento por Conta IRC",
        description: `${m.label} - pagamento por conta de IRC ${year}`,
        dueDate: lastBusinessDay(year, m.month),
        referencePeriod: `${year}`,
        legalBasis: "Art. 104.o do CIRC",
      }))
    },
  },

  // IRC Pagamento Especial por Conta - último dia útil de Março
  {
    type: "irc_pagamento_especial",
    name: "Pagamento Especial por Conta IRC",
    description: "Pagamento especial por conta de IRC (ou pedido de dispensa)",
    frequency: "annual",
    applicableRegimes: ["micro_empresa", "pme", "sgps", "grande_empresa"],
    legalBasis: "Art. 106.o do CIRC",
    getDeadlines(year: number) {
      return [{
        type: "irc_pagamento_especial",
        name: "Pagamento Especial por Conta IRC",
        description: `Pagamento especial por conta de IRC ${year} (ou pedido de dispensa)`,
        dueDate: lastBusinessDay(year, 2), // March (0-indexed)
        referencePeriod: `${year}`,
        legalBasis: "Art. 106.o do CIRC",
      }]
    },
  },

  // IES - 15 de Julho
  {
    type: "ies",
    name: "IES (Informação Empresarial Simplificada)",
    description: "Entrega da declaração anual de informação contabilística e fiscal",
    frequency: "annual",
    applicableRegimes: ["micro_empresa", "pme", "sgps", "grande_empresa"],
    legalBasis: "DL 8/2007",
    getDeadlines(year: number) {
      return [{
        type: "ies",
        name: "IES / Declaração Anual",
        description: `Informação empresarial simplificada relativa a ${year - 1}. Prazo: 15 Julho ${year}`,
        dueDate: new Date(year, 6, 15), // July 15
        referencePeriod: `Ano ${year - 1}`,
        legalBasis: "DL 8/2007",
      }]
    },
  },

  // TSU - dia 10 a 20 do mês seguinte
  {
    type: "tsu",
    name: "TSU (Contribuições Segurança Social)",
    description: "Pagamento mensal das contribuições para a Segurança Social",
    frequency: "monthly",
    applicableRegimes: ["trabalhador_independente", "micro_empresa", "pme", "sgps", "grande_empresa"],
    legalBasis: "Código Contributivo",
    getDeadlines(year: number) {
      const deadlines: FiscalDeadlineInstance[] = []
      for (let month = 0; month < 12; month++) {
        const dueMonth = (month + 1) % 12
        const dueYear = month === 11 ? year + 1 : year
        deadlines.push({
          type: "tsu",
          name: "TSU - Segurança Social",
          description: `Contribuições referentes a ${MONTH_NAMES[month]} ${year}`,
          dueDate: new Date(dueYear, dueMonth, 20),
          referencePeriod: `${MONTH_NAMES[month]} ${year}`,
          legalBasis: "Código Contributivo",
        })
      }
      return deadlines
    },
  },

  // Comunicação de faturas AT - dia 5 do mês seguinte
  {
    type: "comunicação_faturas",
    name: "Comunicação de Faturas a AT",
    description: "Comunicação mensal dos elementos das faturas emitidas",
    frequency: "monthly",
    applicableRegimes: ["trabalhador_independente", "micro_empresa", "pme", "sgps", "grande_empresa"],
    legalBasis: "Art. 3.o do DL 198/2012",
    getDeadlines(year: number) {
      const deadlines: FiscalDeadlineInstance[] = []
      for (let month = 0; month < 12; month++) {
        const dueMonth = (month + 1) % 12
        const dueYear = month === 11 ? year + 1 : year
        deadlines.push({
          type: "comunicação_faturas",
          name: "Comunicação Faturas AT",
          description: `Comunicação de faturas de ${MONTH_NAMES[month]} ${year} via e-fatura ou SAF-T`,
          dueDate: new Date(dueYear, dueMonth, 5),
          referencePeriod: `${MONTH_NAMES[month]} ${year}`,
          legalBasis: "Art. 3.o do DL 198/2012",
        })
      }
      return deadlines
    },
  },

  // Retencoes na Fonte - dia 20 do mês seguinte
  {
    type: "retencoes_fonte",
    name: "Retencoes na Fonte (IRS/IRC)",
    description: "Entrega das retencoes na fonte de IRS ou IRC efetuadas no mes anterior",
    frequency: "monthly",
    applicableRegimes: ["pme", "sgps", "grande_empresa"],
    legalBasis: "Art. 98.o do CIRS / Art. 94.o do CIRC",
    getDeadlines(year: number) {
      const deadlines: FiscalDeadlineInstance[] = []
      for (let month = 0; month < 12; month++) {
        const dueMonth = (month + 1) % 12
        const dueYear = month === 11 ? year + 1 : year
        deadlines.push({
          type: "retencoes_fonte",
          name: "Retencoes na Fonte",
          description: `Retencoes efetuadas em ${MONTH_NAMES[month]} ${year}`,
          dueDate: new Date(dueYear, dueMonth, 20),
          referencePeriod: `${MONTH_NAMES[month]} ${year}`,
          legalBasis: "Art. 98.o do CIRS / Art. 94.o do CIRC",
        })
      }
      return deadlines
    },
  },
]

// ─── Funcoes utilitarias ───────────────────────────────────────────

export function getAllDeadlinesForYear(regime: BusinessRegime, year: number): FiscalDeadlineInstance[] {
  return FISCAL_OBLIGATIONS
    .filter((o) => o.applicableRegimes.includes(regime))
    .flatMap((o) => o.getDeadlines(year))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

export function getUpcomingDeadlines(
  regime: BusinessRegime,
  year: number,
  fromDate: Date,
  limit: number = 10
): FiscalDeadlineInstance[] {
  // Get deadlines from current year and next year to cover year boundaries
  const allDeadlines = [
    ...getAllDeadlinesForYear(regime, year),
    ...getAllDeadlinesForYear(regime, year + 1),
  ]
  return allDeadlines
    .filter((d) => d.dueDate >= fromDate)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, limit)
}

export function getOverdueDeadlines(
  regime: BusinessRegime,
  year: number,
  asOfDate: Date
): FiscalDeadlineInstance[] {
  // Check current year and previous year
  const allDeadlines = [
    ...getAllDeadlinesForYear(regime, year - 1),
    ...getAllDeadlinesForYear(regime, year),
  ]
  // Only show overdue from the last 90 days to avoid stale alerts
  const cutoff = new Date(asOfDate)
  cutoff.setDate(cutoff.getDate() - 90)
  return allDeadlines
    .filter((d) => d.dueDate < asOfDate && d.dueDate >= cutoff)
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
}

export function getDaysUntilDeadline(deadline: FiscalDeadlineInstance): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(deadline.dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining <= 0) return "overdue"
  if (daysRemaining <= 7) return "urgent"
  if (daysRemaining <= 30) return "soon"
  if (daysRemaining <= 60) return "upcoming"
  return "distant"
}

export function getDeadlinesForMonth(
  regime: BusinessRegime,
  year: number,
  month: number // 0-indexed
): FiscalDeadlineInstance[] {
  const allDeadlines = getAllDeadlinesForYear(regime, year)
  return allDeadlines.filter((d) => d.dueDate.getMonth() === month && d.dueDate.getFullYear() === year)
}

export const URGENCY_COLORS: Record<UrgencyLevel, { bg: string; text: string; border: string }> = {
  overdue: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-800" },
  urgent: { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-800" },
  soon: { bg: "bg-yellow-100 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-800" },
  upcoming: { bg: "bg-[hsl(172,100%,39%)]/10", text: "text-[hsl(172,80%,28%)] dark:text-[hsl(172,100%,60%)]", border: "border-[hsl(172,100%,39%)]/30" },
  distant: { bg: "bg-muted", text: "text-muted-foreground", border: "border-muted" },
}
