"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ATNewsItem, ATServiceLink } from "@/lib/fiscal/at-portal"
import { BusinessRegime, BUSINESS_REGIME_LABELS } from "@/lib/fiscal/calendar"
import {
  Building2,
  Calculator,
  ClipboardList,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  Landmark,
  MessageSquare,
  Newspaper,
  Receipt,
  Settings,
  Upload,
  Zap,
} from "lucide-react"
import Link from "next/link"

// Map icon names to components
const ICON_MAP: Record<string, typeof Globe> = {
  Globe, FileText, MessageSquare, FileCheck, Zap, Calculator, Receipt,
  ClipboardList, Upload, Building2,
}

const CATEGORY_LABELS: Record<ATNewsItem["category"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  instrucao_administrativa: { label: "Instrucao", variant: "secondary" },
  legislacao: { label: "Legislacao", variant: "default" },
  informacao: { label: "Info", variant: "outline" },
}

// ─── Componente de Noticias AT ─────────────────────────────────────

export function ATNewsWidget({ news }: { news: ATNewsItem[] }) {
  if (news.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-muted-foreground" />
          Atualizacoes da Autoridade Tributaria
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Instrucoes administrativas e alteracoes legislativas recentes
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {news.slice(0, 6).map((item, i) => {
            const categoryConfig = CATEGORY_LABELS[item.category]
            return (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={categoryConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                      {categoryConfig.label}
                    </Badge>
                    {item.date && (
                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium line-clamp-2 group-hover:text-[hsl(172,100%,39%)] transition-colors">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )
          })}
        </div>
        <a
          href="https://info.portaldasfinancas.gov.pt/pt/atualidades/Paginas/default.aspx"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground hover:text-[hsl(172,100%,39%)] transition-colors"
        >
          <Landmark className="h-4 w-4" />
          Ver todas as atualizacoes no Portal das Financas
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  )
}

// ─── Componente de Links de Serviços AT ────────────────────────────

export function ATServiceLinksWidget({
  links,
  regime,
}: {
  links: ATServiceLink[]
  regime: BusinessRegime
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Landmark className="h-5 w-5 text-muted-foreground" />
          Serviços AT
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Acesso rápido aos serviços da Autoridade Tributária para {BUSINESS_REGIME_LABELS[regime]}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {links.map((link, i) => {
            const IconComponent = ICON_MAP[link.icon] || Globe
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-[hsl(172,100%,39%)]/30 transition-all group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted group-hover:bg-[hsl(172,100%,39%)]/10 transition-colors shrink-0">
                  <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(172,100%,39%)] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{link.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{link.description}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Banner de configuração de regime ──────────────────────────────

export function RegimeConfigBanner({ isConfigured }: { isConfigured: boolean }) {
  if (isConfigured) return null

  return (
    <div className="rounded-lg border-2 border-dashed border-[hsl(172,100%,39%)]/40 bg-[hsl(172,100%,39%)]/5 p-5">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(172,100%,39%)]/10 shrink-0">
          <Settings className="h-5 w-5 text-[hsl(172,100%,39%)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Configure o seu regime fiscal</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Para ver as obrigacoes fiscais e prazos corretos para a sua situacao,
            configure o tipo de contribuinte da sua empresa nas definicoes.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Link
              href="/settings/business"
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[hsl(172,100%,39%)] hover:bg-[hsl(172,80%,28%)] px-4 py-2 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configurar agora
            </Link>
            <span className="text-xs text-muted-foreground">
              Definicoes &gt; Dados da Empresa &gt; Regime Fiscal
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
