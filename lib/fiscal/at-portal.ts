/**
 * Integracao com o Portal da Autoridade Tributaria (AT)
 * https://info.portaldasfinancas.gov.pt
 *
 * Busca notícias, instruções administrativas e atualizações legislativas.
 * Fornece links diretos para serviços AT relevantes por regime fiscal.
 */

import { BusinessRegime } from "./calendar"

// ─── Tipos ─────────────────────────────────────────────────────────

export interface ATNewsItem {
  title: string
  description: string
  url: string
  date: string
  category: "instrucao_administrativa" | "legislacao" | "informacao"
}

export interface ATServiceLink {
  name: string
  description: string
  url: string
  icon: string // lucide icon name
}

// ─── Cache de notícias (15 min) ────────────────────────────────────

let newsCache: { items: ATNewsItem[]; fetchedAt: number } | null = null
const NEWS_CACHE_TTL = 15 * 60 * 1000 // 15 minutos

export async function getATNews(): Promise<ATNewsItem[]> {
  // Check cache
  if (newsCache && Date.now() - newsCache.fetchedAt < NEWS_CACHE_TTL) {
    return newsCache.items
  }

  try {
    const response = await fetch(
      "https://info.portaldasfinancas.gov.pt/pt/atualidades/Paginas/default.aspx",
      {
        next: { revalidate: 900 }, // Next.js 15 min cache
        headers: {
          "User-Agent": "BuildFlow-Expenses/1.0 (Expense Management)",
          "Accept": "text/html",
          "Accept-Language": "pt-PT,pt;q=0.9",
        },
      }
    )

    if (!response.ok) {
      console.warn(`AT portal fetch failed: ${response.status}`)
      return getFallbackNews()
    }

    const html = await response.text()
    const items = parseATNewsHTML(html)

    newsCache = { items, fetchedAt: Date.now() }
    return items
  } catch (error) {
    console.warn("Failed to fetch AT news:", error)
    return getFallbackNews()
  }
}

function parseATNewsHTML(html: string): ATNewsItem[] {
  const items: ATNewsItem[] = []
  const baseUrl = "https://info.portaldasfinancas.gov.pt"

  // Parse administrative instructions
  // Pattern: links with title text containing "Circular", "Oficio", "Despacho", etc.
  const linkPattern = /<a[^>]*href="([^"]*(?:atualidades|instrucoes)[^"]*)"[^>]*>([^<]+)<\/a>/gi
  let match

  while ((match = linkPattern.exec(html)) !== null) {
    const [, href, title] = match
    if (title.trim().length < 10) continue

    const cleanTitle = title.trim().replace(/\s+/g, " ")
    const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`

    // Determine category
    let category: ATNewsItem["category"] = "informacao"
    if (/circular|of[ií]cio|despacho|instru[çc]/i.test(cleanTitle)) {
      category = "instrucao_administrativa"
    } else if (/lei|decreto|portaria|regulamento/i.test(cleanTitle)) {
      category = "legislacao"
    }

    // Extract date from title (pattern: dd/mm or dd/mm/yyyy)
    const dateMatch = cleanTitle.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)
    const date = dateMatch
      ? `${dateMatch[1]}/${dateMatch[2]}${dateMatch[3] ? `/${dateMatch[3]}` : "/2026"}`
      : ""

    items.push({
      title: cleanTitle,
      description: "",
      url: fullUrl,
      date,
      category,
    })
  }

  // Deduplicate by title and limit
  const seen = new Set<string>()
  return items
    .filter((item) => {
      if (seen.has(item.title)) return false
      seen.add(item.title)
      return true
    })
    .slice(0, 10)
}

function getFallbackNews(): ATNewsItem[] {
  // Notícias estáticas como fallback quando o fetch falha
  return [
    {
      title: "IRS 2025 - Declaração Modelo 3",
      description: "Periodo de entrega: 1 de Abril a 30 de Junho de 2026",
      url: "https://irs.portaldasfinancas.gov.pt/home.action",
      date: "01/04/2026",
      category: "informacao",
    },
    {
      title: "Orcamento do Estado 2026",
      description: "Principais alteracoes fiscais para 2026",
      url: "https://info.portaldasfinancas.gov.pt/pt/atualidades/Paginas/default.aspx",
      date: "30/12/2025",
      category: "legislacao",
    },
  ]
}

// ─── Links de serviços AT por regime ───────────────────────────────

const COMMON_LINKS: ATServiceLink[] = [
  {
    name: "Portal das Financas",
    description: "Acesso geral ao portal da AT",
    url: "https://www.portaldasfinancas.gov.pt",
    icon: "Globe",
  },
  {
    name: "e-Fatura",
    description: "Consultar e comunicar faturas",
    url: "https://faturas.portaldasfinancas.gov.pt",
    icon: "FileText",
  },
  {
    name: "e-Balcao",
    description: "Contactar a AT e submeter pedidos",
    url: "https://sitfiscal.portaldasfinancas.gov.pt/ebalcao/formularioContacto",
    icon: "MessageSquare",
  },
]

const REGIME_SPECIFIC_LINKS: Record<BusinessRegime, ATServiceLink[]> = {
  trabalhador_dependente: [
    {
      name: "IRS - Declaração",
      description: "Submeter declaracao anual de IRS",
      url: "https://irs.portaldasfinancas.gov.pt/home.action",
      icon: "FileCheck",
    },
    {
      name: "IRS Automatico",
      description: "Consultar declaracao automatica de IRS",
      url: "https://irs.portaldasfinancas.gov.pt/home.action",
      icon: "Zap",
    },
  ],
  trabalhador_independente: [
    {
      name: "IRS - Declaração",
      description: "Submeter declaracao de IRS (Anexo B)",
      url: "https://irs.portaldasfinancas.gov.pt/home.action",
      icon: "FileCheck",
    },
    {
      name: "IVA - Declaração Periódica",
      description: "Entregar declaração periódica de IVA",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Calculator",
    },
    {
      name: "Recibos Verdes",
      description: "Emitir recibos verdes eletrónicos",
      url: "https://faturas.portaldasfinancas.gov.pt",
      icon: "Receipt",
    },
  ],
  micro_empresa: [
    {
      name: "IRC - Modelo 22",
      description: "Submeter declaracao anual de IRC",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "FileCheck",
    },
    {
      name: "IVA - Declaração Periódica",
      description: "Entregar declaração periódica de IVA",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Calculator",
    },
    {
      name: "IES - Declaração Anual",
      description: "Submeter IES/Declaração Anual",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "ClipboardList",
    },
  ],
  pme: [
    {
      name: "IRC - Modelo 22",
      description: "Submeter declaracao anual de IRC",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "FileCheck",
    },
    {
      name: "IVA - Declaração Periódica",
      description: "Entregar declaração periódica de IVA",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Calculator",
    },
    {
      name: "IES - Declaração Anual",
      description: "Submeter IES/Declaração Anual",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "ClipboardList",
    },
    {
      name: "SAF-T - Submissao",
      description: "Submeter ficheiro SAF-T a AT",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Upload",
    },
  ],
  sgps: [
    {
      name: "IRC - Modelo 22",
      description: "Submeter declaracao anual de IRC",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "FileCheck",
    },
    {
      name: "IVA - Declaração Periódica",
      description: "Entregar declaração periódica de IVA",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Calculator",
    },
    {
      name: "IES - Declaração Anual",
      description: "Submeter IES/Declaração Anual",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "ClipboardList",
    },
    {
      name: "SAF-T - Submissao",
      description: "Submeter ficheiro SAF-T a AT",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Upload",
    },
  ],
  grande_empresa: [
    {
      name: "IRC - Modelo 22",
      description: "Submeter declaracao anual de IRC",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "FileCheck",
    },
    {
      name: "IVA - Declaração Periódica",
      description: "Entregar declaração periódica de IVA",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Calculator",
    },
    {
      name: "IES - Declaração Anual",
      description: "Submeter IES/Declaração Anual",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "ClipboardList",
    },
    {
      name: "SAF-T - Submissao",
      description: "Submeter ficheiro SAF-T a AT",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Upload",
    },
    {
      name: "Grandes Contribuintes",
      description: "Serviços para grandes contribuintes",
      url: "https://sitfiscal.portaldasfinancas.gov.pt/geral/home?areaDestino=TR",
      icon: "Building2",
    },
  ],
}

export function getATServiceLinks(regime: BusinessRegime): ATServiceLink[] {
  return [...REGIME_SPECIFIC_LINKS[regime], ...COMMON_LINKS]
}
