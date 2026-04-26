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
    // Customer-facing copy. Do NOT show developer instructions
    // (`SELF_HOSTED_MODE=true`) on a public CTA destination — visitors
    // who land here from "Começar Gratuitamente" need to be funnelled
    // toward conversion (talk to sales / start trial) instead.
    redirect("/")
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
      <Image src={config.app.logo} alt={config.app.title} width={144} height={144} className="w-36 h-36" />
      <CardTitle className="text-3xl font-bold ">
        <ColoredText>{config.app.title}</ColoredText>
      </CardTitle>
      <CardDescription className="flex flex-col gap-4 text-center text-lg">
        <p>Bem-vindo ao {config.app.title}. Vamos configurar algumas definições para começar.</p>
        <SelfHostedSetupFormClient defaultProvider={defaultProvider} defaultApiKeys={defaultApiKeys} />
      </CardDescription>
    </Card>
  )
}

export const dynamic = "force-dynamic"
