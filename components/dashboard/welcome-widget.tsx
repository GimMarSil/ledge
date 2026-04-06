import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { getSettings, updateSettings } from "@/models/settings"
import { Banknote, ChartBarStacked, Check, FolderOpenDot, Key, TextCursorInput, X } from "lucide-react"
import { revalidatePath } from "next/cache"
import Link from "next/link"

export async function WelcomeWidget() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)

  const steps = [
    {
      label: "Configurar IA",
      icon: Key,
      href: "/settings/llm",
      done: settings.openai_api_key !== "" || settings.google_api_key !== "" || settings.mistral_api_key !== "",
    },
    {
      label: `Moeda: ${settings.default_currency || "EUR"}`,
      icon: Banknote,
      href: "/settings",
      done: true,
    },
    {
      label: "Categorias",
      icon: ChartBarStacked,
      href: "/settings/categories",
      done: true,
    },
  ]

  return (
    <Card className="relative overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 h-8 w-8 rounded-full"
        onClick={async () => {
          "use server"
          await updateSettings(user.id, "is_welcome_message_hidden", "true")
          revalidatePath("/")
        }}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              <ColoredText>Bem-vindo ao {config.app.title}</ColoredText>
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestão inteligente de despesas com análise automática por IA
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {steps.map((step) => (
              <Link key={step.href} href={step.href} className="flex-1">
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                    step.done
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/50 border-border hover:border-primary/40"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.done ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/settings/projects">
              <Button variant="outline" size="sm">
                <FolderOpenDot className="h-4 w-4" />
                Projetos
              </Button>
            </Link>
            <Link href="/settings/fields">
              <Button variant="outline" size="sm">
                <TextCursorInput className="h-4 w-4" />
                Campos Personalizados
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
