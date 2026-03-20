import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F2F5F9] via-white to-[#F2F5F9]">
      <header className="py-6 px-4 md:px-8 bg-white/90 backdrop-blur-xl shadow-lg border-b border-[#F2F5F9] fixed w-full z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Image
                src="/logo/logo.svg"
                alt="Ledge"
                width={32}
                height={32}
                className="h-8 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-2xl font-bold font-mono tracking-wide text-[#070E1C]">Ledge</span>
          </Link>
          <Link
            href="/enter"
            className="cursor-pointer font-medium px-4 py-2 rounded-full border-2 border-[#00C2A8] text-[#070E1C] hover:bg-[#00C2A8] hover:text-white transition-all duration-300 hover:scale-105 text-xs md:text-sm"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F2F5F9]/50 via-white/30 to-[#F2F5F9]/50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00C2A8] rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#009E88] rounded-full opacity-10 blur-3xl animate-pulse" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block px-6 py-3 rounded-full border-2 border-[#00C2A8]/50 text-sm font-medium mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
              🚀 Em Desenvolvimento Ativo
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-[#070E1C] via-[#0D1A30] to-[#009E88] bg-clip-text text-transparent pb-2">
              Deixe a IA tratar das suas despesas, digitalizar recibos e analisar transações
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto font-medium">
              Aplicação de gestão de despesas com IA para empresas e profissionais
            </p>
            <div className="flex gap-4 justify-center text-sm md:text-lg">
              <Link
                href="#start"
                className="px-8 py-4 bg-gradient-to-r from-[#00C2A8] to-[#009E88] text-white font-bold rounded-full hover:from-[#009E88] hover:to-[#00C2A8] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 border-2 border-white/20"
              >
                Começar
              </Link>
              <Link
                href={`mailto:${config.app.supportEmail}`}
                className="px-8 py-4 border-2 border-[#00C2A8]/30 text-[#070E1C] font-bold rounded-full hover:bg-[#F2F5F9] transition-all duration-300 hover:scale-105 bg-white/80"
              >
                Contactar-nos
              </Link>
            </div>
          </div>
          <div className="relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-[#00C2A8]/20">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00C2A8]/5 via-transparent to-[#009E88]/10 z-10" />
            <video className="w-full h-auto" autoPlay loop muted playsInline poster="/landing/ai-scanner-big.webp">
              <source src="/landing/video.mp4" type="video/mp4" />
              <Image src="/landing/ai-scanner-big.webp" alt="Ledge" width={1728} height={1080} priority />
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-[#F2F5F9]/50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="flex flex-col gap-3 mb-4">
              <span className="text-6xl font-bold bg-gradient-to-r from-[#00C2A8] to-[#009E88] bg-clip-text text-transparent">
                Simplifique
              </span>
              <span className="text-4xl font-bold bg-gradient-to-r from-[#070E1C] to-[#0D1A30] bg-clip-text text-transparent">
                O Ledge poupa-lhe tempo, dinheiro e preocupações
              </span>
            </h2>
          </div>

          {/* AI Scanner Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-[#F2F5F9]/30 to-[#F2F5F9]/30 p-8 rounded-3xl shadow-xl ring-2 ring-[#00C2A8]/20 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#00C2A8] to-[#009E88] text-white text-sm font-bold mb-4 shadow-lg">
                🤖 Powered by IA
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#070E1C]">
                Analise fotos e faturas com IA
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">✨</span>
                  Carregue recibos ou faturas em PDF para reconhecimento automático
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">✨</span>
                  Extraia informação chave como datas, itens e fornecedores
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">✨</span>
                  Funciona com qualquer idioma e qualidade de foto
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">✨</span>
                  Organize tudo automaticamente numa base de dados estruturada
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">✨</span>
                  Carregamento e análise em massa de múltiplos ficheiros
                </li>
              </ul>
            </div>
            <div className="flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-[#00C2A8]/20 hover:scale-105 transition-all duration-500">
              <Image src="/landing/ai-scanner.webp" alt="Analisador de Documentos IA" width={1900} height={1524} />
            </div>
          </div>

          {/* Multi-currency Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-emerald-50/30 to-emerald-50/30 p-8 rounded-3xl shadow-xl ring-2 ring-emerald-200/50 hover:shadow-2xl transition-all duration-500 group flex-row-reverse">
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold mb-4 shadow-lg">
                💱 Conversor de Moedas
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#070E1C]">
                Converta moedas automaticamente (até cripto!)
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-emerald-600 mr-3 text-lg">💰</span>
                  Deteta moedas estrangeiras e converte para a sua
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-600 mr-3 text-lg">💰</span>
                  Conhece taxas de câmbio históricas na data da transação
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-600 mr-3 text-lg">💰</span>
                  Suporta 170+ moedas mundiais
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-600 mr-3 text-lg">💰</span>
                  Funciona com criptomoedas populares (BTC, ETH, LTC, etc.)
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-600 mr-3 text-lg">💰</span>
                  Permite preenchimento manual
                </li>
              </ul>
            </div>
            <div className="flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-emerald-200/50 hover:scale-105 transition-all duration-500">
              <Image src="/landing/multi-currency.webp" alt="Conversor de Moedas" width={1400} height={1005} />
            </div>
          </div>

          {/* Transaction Table Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-[#F2F5F9]/30 to-[#F2F5F9]/30 p-8 rounded-3xl shadow-xl ring-2 ring-[#009E88]/20 hover:shadow-2xl transition-all duration-500 group flex-row-reverse">
            <div className="flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-[#009E88]/20 hover:scale-105 transition-all duration-500">
              <Image src="/landing/transactions.webp" alt="Tabela de Transações" width={2000} height={1279} />
            </div>
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#009E88] to-[#00C2A8] text-white text-sm font-bold mb-4 shadow-lg">
                🔍 Filtros e Categorias
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#070E1C]">
                Organize transações com categorias, projetos e campos totalmente personalizáveis
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-[#009E88] mr-3 text-lg">📊</span>
                  Liberdade total para criar categorias, projetos e campos personalizados
                </li>
                <li className="flex items-center">
                  <span className="text-[#009E88] mr-3 text-lg">📊</span>
                  Adicione, edite e gira as suas transações
                </li>
                <li className="flex items-center">
                  <span className="text-[#009E88] mr-3 text-lg">📊</span>
                  Filtre por qualquer coluna, categoria ou intervalo de datas
                </li>
                <li className="flex items-center">
                  <span className="text-[#009E88] mr-3 text-lg">📊</span>
                  Personalize as colunas visíveis na tabela
                </li>
                <li className="flex items-center">
                  <span className="text-[#009E88] mr-3 text-lg">📊</span>
                  Importe transações a partir de CSV
                </li>
              </ul>
            </div>
          </div>

          {/* Invoice Generator */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-slate-50/30 to-[#F2F5F9]/30 p-8 rounded-3xl shadow-xl ring-2 ring-slate-200/50 hover:shadow-2xl transition-all duration-500 group">
            <div className="max-w-sm flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-slate-200/50 hover:scale-105 transition-all duration-500">
              <Image src="/landing/invoice-generator.webp" alt="Gerador de Faturas" width={1800} height={1081} />
            </div>
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#0D1A30] to-[#070E1C] text-[#00C2A8] text-sm font-bold mb-4 shadow-lg">
                📋 Gerador de Faturas
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#070E1C]">
                Crie faturas personalizadas
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-[#0D1A30] mr-3 text-lg">📄</span>
                  Gerador avançado de faturas em qualquer idioma
                </li>
                <li className="flex items-center">
                  <span className="text-[#0D1A30] mr-3 text-lg">📄</span>
                  Edite qualquer campo, incluindo etiquetas e títulos
                </li>
                <li className="flex items-center">
                  <span className="text-[#0D1A30] mr-3 text-lg">📄</span>
                  Exporte faturas para PDF ou como transações
                </li>
                <li className="flex items-center">
                  <span className="text-[#0D1A30] mr-3 text-lg">📄</span>
                  Guarde faturas como modelos para reutilizar
                </li>
                <li className="flex items-center">
                  <span className="text-[#0D1A30] mr-3 text-lg">📄</span>
                  Suporte nativo para impostos incluídos e excluídos (IVA)
                </li>
              </ul>
            </div>
          </div>

          {/* Custom Fields & Categories */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-[#F2F5F9]/30 to-[#F2F5F9]/30 p-8 rounded-3xl shadow-xl ring-2 ring-[#00C2A8]/20 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#00C2A8] to-[#009E88] text-white text-sm font-bold mb-4 shadow-lg">
                🎨 Controlo da IA
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#070E1C]">
                Configure qualquer prompt de IA para extrair o que precisa
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">🔧</span>
                  Expanda a sua instância Ledge com prompts de IA personalizados
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">🔧</span>
                  Crie campos e categorias personalizados e configure a IA para os preencher
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">🔧</span>
                  Extraia qualquer informação adicional que necessite
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">🔧</span>
                  Categorize automaticamente por projeto ou categoria
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">🔧</span>
                  Peça à IA para avaliar nível de risco ou outros critérios
                </li>
              </ul>
            </div>
            <div className="flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-[#00C2A8]/20 hover:scale-105 transition-all duration-500">
              <Image src="/landing/custom-llm.webp" alt="Prompts de IA Personalizados" width={1800} height={1081} />
            </div>
          </div>

          {/* Data Export */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-gradient-to-br from-white via-[#F2F5F9]/30 to-[#F2F5F9]/30 p-8 rounded-3xl shadow-xl ring-2 ring-[#0D1A30]/10 hover:shadow-2xl transition-all duration-500 group flex-row-reverse">
            <div className="flex-1 min-w-60">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#070E1C] to-[#0D1A30] text-[#00C2A8] text-sm font-bold mb-4 shadow-lg">
                📦 Exportação de Dados
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#070E1C]">
                Os Seus Dados — As Suas Regras
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="text-[#070E1C] mr-3 text-lg">📤</span>
                  Implemente a sua instância para 100% de privacidade
                </li>
                <li className="flex items-center">
                  <span className="text-[#070E1C] mr-3 text-lg">📤</span>
                  Exporte transações para CSV para preparação fiscal
                </li>
                <li className="flex items-center">
                  <span className="text-[#070E1C] mr-3 text-lg">📤</span>
                  Pesquisa completa em documentos e faturas
                </li>
                <li className="flex items-center">
                  <span className="text-[#070E1C] mr-3 text-lg">📤</span>
                  Descarregue arquivo completo dos dados. Não limitamos o que faz com a sua informação
                </li>
              </ul>
            </div>
            <div className="flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-2xl ring-4 ring-[#0D1A30]/10 hover:scale-105 transition-all duration-500">
              <Image src="/landing/export.webp" alt="Exportação" width={1200} height={1081} />
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section
        id="start"
        className="py-20 px-8 bg-gradient-to-br from-white via-[#F2F5F9]/20 to-[#F2F5F9]/20 scroll-mt-20 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#F2F5F9]/20 to-[#F2F5F9]/20" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#00C2A8] to-[#009E88] bg-clip-text text-transparent">
              Comece a Usar o Ledge
            </h2>
          </div>
          <div className="grid md:grid-cols-1 gap-16 max-w-xl mx-auto">
            {/* Self-Hosted Version */}
            <div className="bg-gradient-to-br from-white via-[#F2F5F9]/50 to-[#F2F5F9]/50 p-8 rounded-3xl shadow-xl ring-2 ring-[#00C2A8]/20 hover:shadow-2xl transition-all duration-500 group">
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#00C2A8] to-[#009E88] text-white text-sm font-bold mb-6 shadow-lg">
                🏠 Instância Própria
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <ColoredText>Self-Hosted</ColoredText>
              </h3>
              <ul className="space-y-3 text-gray-700 mb-8">
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">🔒</span>
                  Controlo total sobre os seus dados
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">🏗️</span>
                  Implemente na sua própria infraestrutura
                </li>
                <li className="flex items-center">
                  <span className="text-[#00C2A8] mr-3 text-lg">🔑</span>
                  Traga as suas próprias chaves (OpenAI, Gemini, Mistral, etc.)
                </li>
              </ul>
              <Link
                href="/self-hosted"
                className="block w-full text-center px-6 py-4 bg-gradient-to-r from-[#00C2A8] to-[#009E88] text-white font-bold rounded-full hover:from-[#009E88] hover:to-[#00C2A8] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110"
              >
                Configurar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-8 bg-[#070E1C] border-t-2 border-[#0D1A30]">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          <span className="font-mono font-bold text-[#00C2A8]">Ledge</span> — Gestão inteligente de despesas
        </div>

        <section className="py-12 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`mailto:${config.app.supportEmail}`}
                className="text-sm text-gray-400 hover:text-[#00C2A8] font-medium transition-colors"
              >
                Contactar-nos
              </Link>
              <Link
                href="/docs/terms"
                className="text-sm text-gray-400 hover:text-[#00C2A8] font-medium transition-colors"
              >
                Termos de Serviço
              </Link>
              <Link
                href="/docs/privacy_policy"
                className="text-sm text-gray-400 hover:text-[#00C2A8] font-medium transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link href="/docs/ai" className="text-sm text-gray-400 hover:text-[#00C2A8] font-medium transition-colors">
                Divulgação de IA
              </Link>
              <Link
                href="/docs/cookie"
                className="text-sm text-gray-400 hover:text-[#00C2A8] font-medium transition-colors"
              >
                Política de Cookies
              </Link>
            </div>
          </div>
        </section>
      </footer>
    </div>
  )
}
