import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import { getCurrentUser } from "@/lib/auth"
import { getSettings, updateSettings } from "@/models/settings"
import { Banknote, ChartBarStacked, FolderOpenDot, Key, TextCursorInput, X } from "lucide-react"
import { revalidatePath } from "next/cache"
import Image from "next/image"
import Link from "next/link"

export async function WelcomeWidget() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)

  return (
    <Card className="flex flex-col lg:flex-row items-start gap-10 p-10 w-full">
      <Image src="/logo/logo.svg" alt="Ledge" width={256} height={256} className="w-64 h-64" />
      <div className="flex flex-col">
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            <ColoredText>Bem-vindo ao Ledge 👋</ColoredText>
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              "use server"
              await updateSettings(user.id, "is_welcome_message_hidden", "true")
              revalidatePath("/")
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription className="mt-5">
          <p className="mb-3">
            Sou uma aplicação de contabilidade que ajuda a lidar com recibos, faturas e despesas usando
            Inteligência Artificial. Eis o que posso fazer:
          </p>
          <ul className="mb-5 list-disc pl-5 space-y-1">
            <li>
              <strong>Carregue uma foto ou PDF</strong> e eu reconheço, categorizo e guardo como transação
              para o seu contabilista.
            </li>
            <li>
              Posso <strong>converter moedas automaticamente</strong> e consultar taxas de câmbio para uma data específica.
            </li>
            <li>
              Também <strong>suporto criptomoedas!</strong> Taxas de câmbio históricas incluídas.
            </li>
            <li>
              Todos os <strong>prompts de IA são configuráveis</strong>: para campos, categorias e projetos. Pode ir às
              definições e alterá-los como quiser.
            </li>
            <li>
              Guardo os dados numa <strong>base de dados PostgreSQL</strong> e posso exportar para CSV e arquivos ZIP.
            </li>
            <li>
              Pode até <strong>criar campos personalizados</strong> para análise e serão incluídos na
              exportação CSV para o seu contabilista.
            </li>
            <li>
              Extraio automaticamente o <strong>NIF do fornecedor</strong> e as taxas de IVA portuguesas (6%, 13%, 23%).
            </li>
          </ul>
          <p className="mb-3">
            Embora possa poupar muito tempo a categorizar transações e gerar relatórios, recomendo
            que entregue os resultados a um contabilista profissional para revisão!
          </p>
        </CardDescription>
        <div className="mt-2">
          <Link href="mailto:portal.rh@ramosferreira.com" className="text-teal-600 hover:underline">
            Contactar Suporte
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 mt-8">
          {settings.openai_api_key === "" && (
            <Link href="/settings/llm">
              <Button>
                <Key className="h-4 w-4" />
                Insira a sua chave de IA aqui
              </Button>
            </Link>
          )}
          <Link href="/settings">
            <Button variant="outline">
              <Banknote className="h-4 w-4" />
              Moeda: {settings.default_currency}
            </Button>
          </Link>
          <Link href="/settings/categories">
            <Button variant="outline">
              <ChartBarStacked className="h-4 w-4" />
              Categorias
            </Button>
          </Link>
          <Link href="/settings/projects">
            <Button variant="outline">
              <FolderOpenDot className="h-4 w-4" />
              Projetos
            </Button>
          </Link>
          <Link href="/settings/fields">
            <Button variant="outline">
              <TextCursorInput className="h-4 w-4" />
              Campos Personalizados
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
