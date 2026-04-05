/**
 * BuildFlow Module Manifest
 * Define as capacidades e metadados do módulo "Despesas & Fiscal"
 * para integração com a plataforma BuildFlow como serviço independente.
 */

export const buildflowManifest = {
  id: "despesas-fiscal",
  name: "Despesas & Fiscal",
  version: "1.0.0",
  description: "Gestão completa de despesas, recibos e exportação fiscal",
  longDescription:
    "Módulo de gestão de despesas e faturação com conformidade fiscal portuguesa. " +
    "Inclui OCR automático, exportação SAF-T (PT), gerador de faturas com QR code, " +
    "relatórios IVA e dashboard fiscal completo.",
  category: "Fiscal & Contabilidade",
  deployment: "standalone" as const,
  features: [
    {
      id: "ocr-automatico",
      name: "OCR Automático",
      description: "Digitalização inteligente de faturas e recibos com IA",
    },
    {
      id: "faturacao",
      name: "Faturação",
      description: "Gerador de faturas com numeração sequencial e QR code",
    },
    {
      id: "saft-export",
      name: "Exportação SAF-T",
      description: "Exportação conforme Portaria 321-A/2007 para Autoridade Tributária",
    },
    {
      id: "iva-reporting",
      name: "Relatórios IVA",
      description: "Resumo IVA periódico com dedutibilidade por categoria",
    },
    {
      id: "qrcode",
      name: "QR Code Fiscal",
      description: "Geração de QR code conforme Portaria 195/2020",
    },
  ],
  entryUrl: "/dashboard",
  apiBase: "/api/buildflow",
  requiredEnvVars: [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BUILDFLOW_API_KEY",
  ],
  optionalEnvVars: [
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
    "MISTRAL_API_KEY",
    "AT_SIGNING_PRIVATE_KEY",
    "STRIPE_SECRET_KEY",
  ],
}

export type BuildFlowManifest = typeof buildflowManifest
