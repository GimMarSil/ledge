import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import { PROVIDERS } from "@/lib/llm-providers"
import { getSelfHostedUser } from "@/models/users"
import { ShieldAlert } from "lucide-react"
import Image from "next/image"
import { redirect } from "next/navigation"
import SelfHostedSetupFormClient from "./setup-form-client"

export default async function SelfHostedWelcomePage() {
  if (!config.selfHosted.isEnabled) {
    return (
      <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" />
          <span>Modo Self-Hosted não está ativado</span>
        </CardTitle>
        <CardDescription className="text-center text-lg flex flex-col gap-2">
          <p>
            Para usar o Ledge em modo self-hosted, defina <code className="font-bold">SELF_HOSTED_MODE=true</code> no
            seu ambiente.
          </p>
          <p>No modo self-hosted pode usar a sua própria chave de API de IA e guardar os dados no seu servidor.</p>
        </CardDescription>
      </Card>
    )
  }

  const user = await getSelfHostedUser()
  if (user) {
    redirect(config.selfHosted.redirectUrl)
  }

  const defaultProvider = PROVIDERS[0].key
  const defaultApiKeys: Record<string, string> = {
    openai: config.ai.openaiApiKey ?? "",
    google: config.ai.googleApiKey ?? "",
    mistral: config.ai.mistralApiKey ?? "",
  }

  return (
    <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-4">
      <Image src="/logo/logo.svg" alt="Ledge" width={144} height={144} className="w-36 h-36" />
      <CardTitle className="text-3xl font-bold ">
        <ColoredText>Ledge</ColoredText>
      </CardTitle>
      <CardDescription className="flex flex-col gap-4 text-center text-lg">
        <p>Bem-vindo ao Ledge. Vamos configurar algumas definições para começar.</p>
        <SelfHostedSetupFormClient defaultProvider={defaultProvider} defaultApiKeys={defaultApiKeys} />
      </CardDescription>
    </Card>
  )
}

export const dynamic = "force-dynamic"
