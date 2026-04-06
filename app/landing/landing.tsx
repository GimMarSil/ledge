import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import {
  BarChart3,
  Brain,
  Coins,
  FileText,
  Globe,
  Lock,
  Receipt,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={config.app.logo} alt={config.app.title} width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-bold text-brand-gradient">{config.app.title}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#comecar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Começar
            </a>
            <Link
              href={`mailto:${config.app.supportEmail}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contacto
            </Link>
          </nav>
          <Link
            href="/enter"
            className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              Gestão inteligente de{" "}
              <ColoredText>despesas</ColoredText>
              {" "}com IA
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Digitalize recibos, categorize transações e gere relatórios automaticamente.
              A sua contabilidade simplificada com inteligência artificial.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/self-hosted"
                className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-glow-teal text-sm"
              >
                Começar Gratuitamente
              </Link>
              <Link
                href={`mailto:${config.app.supportEmail}`}
                className="px-8 py-3 border border-border bg-background text-foreground font-semibold rounded-lg hover:bg-muted transition-all duration-200 text-sm"
              >
                Contactar-nos
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50">
            <video className="w-full h-auto" autoPlay loop muted playsInline poster="/landing/ai-scanner-big.webp">
              <source src="/landing/video.mp4" type="video/mp4" />
              <Image src="/landing/ai-scanner-big.webp" alt={`${config.app.title} Dashboard`} width={1728} height={1080} priority />
            </video>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-4 md:px-8 border-y bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "5s", label: "Tempo médio de análise" },
            { value: "170+", label: "Moedas suportadas" },
            { value: "99.9%", label: "Precisão de IA" },
            { value: "100%", label: "Privacidade dos dados" },
          ].map((metric) => (
            <div key={metric.label} className="text-center">
              <div className="text-3xl font-bold text-brand-gradient">{metric.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="funcionalidades" className="py-20 px-4 md:px-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Tudo o que precisa para gerir despesas
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Do reconhecimento automático de recibos à exportação para o contabilista
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Análise por IA",
                description: "Carregue recibos ou faturas e a IA extrai datas, valores, fornecedores e categorias automaticamente.",
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: Coins,
                title: "Multi-Moeda",
                description: "Suporte para 170+ moedas incluindo criptomoedas. Conversão automática com taxas históricas.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
              {
                icon: BarChart3,
                title: "Painel Inteligente",
                description: "Visualize receitas, despesas e lucro por período. Gráficos interativos e estatísticas por projeto.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: Receipt,
                title: "Gerador de Faturas",
                description: "Crie faturas profissionais em qualquer idioma. Exporte para PDF ou registe como transação.",
                color: "text-violet-500",
                bg: "bg-violet-500/10",
              },
              {
                icon: Brain,
                title: "Prompts Personalizáveis",
                description: "Configure a IA para extrair campos específicos. Categorize automaticamente por projeto ou tipo.",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                icon: FileText,
                title: "Exportação Completa",
                description: "Exporte para CSV com ficheiros anexados em ZIP. Campos personalizados incluídos para o contabilista.",
                color: "text-rose-500",
                bg: "bg-rose-500/10",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border bg-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bg} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcases */}
      <section className="py-20 px-4 md:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto space-y-24">
          {/* AI Scanner */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Powered by IA
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                Analise fotos e faturas com inteligência artificial
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Carregue recibos ou faturas em PDF para reconhecimento automático",
                  "Extraia informação chave como datas, itens e fornecedores",
                  "Funciona com qualquer idioma e qualidade de foto",
                  "Organize tudo automaticamente numa base de dados estruturada",
                  "Carregamento e análise em massa de múltiplos ficheiros",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50">
              <Image src="/landing/ai-scanner.webp" alt="Analisador de Documentos IA" width={1900} height={1524} />
            </div>
          </div>

          {/* Multi-currency */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50">
              <Image src="/landing/multi-currency.webp" alt="Conversor de Moedas" width={1400} height={1005} />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
                <Globe className="h-4 w-4" />
                Multi-Moeda
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                Converta moedas automaticamente, até criptomoedas
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Deteta moedas estrangeiras e converte para a sua",
                  "Taxas de câmbio históricas na data da transação",
                  "Suporte para 170+ moedas mundiais",
                  "Funciona com criptomoedas populares (BTC, ETH, LTC)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Transactions */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                <BarChart3 className="h-4 w-4" />
                Gestão Completa
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                Organize transações com categorias e projetos personalizáveis
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Liberdade total para criar categorias, projetos e campos",
                  "Filtre por qualquer coluna, categoria ou intervalo de datas",
                  "Personalize as colunas visíveis na tabela",
                  "Importe transações a partir de CSV",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50">
              <Image src="/landing/transactions.webp" alt="Tabela de Transações" width={2000} height={1279} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Get Started */}
      <section id="comecar" className="py-20 px-4 md:px-8 scroll-mt-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Comece a usar o <ColoredText>{config.app.title}</ColoredText>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Controlo total sobre os seus dados. Implemente na sua própria infraestrutura com as suas chaves de IA.
          </p>

          <div className="p-8 rounded-2xl border bg-card shadow-card">
            <div className="grid gap-4 text-left mb-8">
              {[
                { icon: Lock, text: "Controlo total sobre os seus dados" },
                { icon: Upload, text: "Implemente na sua própria infraestrutura" },
                { icon: Brain, text: "Traga as suas próprias chaves (OpenAI, Gemini, Mistral)" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            <Link
              href="/self-hosted"
              className="inline-flex items-center justify-center w-full px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-glow-teal text-sm"
            >
              Configurar Instância
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Image src={config.app.logo} alt={config.app.title} width={24} height={24} className="h-6 w-6" />
              <span className="font-bold text-brand-gradient">{config.app.title}</span>
              <span className="text-sm text-muted-foreground">{config.app.description}</span>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link
                href={`mailto:${config.app.supportEmail}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contacto
              </Link>
              <Link href="/docs/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos de Serviço
              </Link>
              <Link href="/docs/privacy_policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/docs/ai" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Divulgação de IA
              </Link>
              <Link href="/docs/cookie" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
