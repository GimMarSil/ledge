import LLMSettingsForm from "@/components/settings/llm-settings-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { getFields } from "@/models/fields"
import { getSettings } from "@/models/settings"
import { Sparkles } from "lucide-react"

export default async function LlmSettingsPage() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)
  const fields = await getFields(user.id)

  // Azure-managed mode: app uses operator's Azure OpenAI deployment.
  // Per-user provider configuration is hidden — there's nothing to configure.
  if (config.ai.azure.isEnabled) {
    return (
      <div className="w-full max-w-2xl space-y-4">
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>IA gerida pela plataforma</AlertTitle>
          <AlertDescription>
            A análise inteligente de ficheiros é fornecida pelo BuildFlow através do
            Azure OpenAI. Não precisa de configurar fornecedores nem chaves de API
            — está tudo pronto a usar.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-2xl">
        <LLMSettingsForm settings={settings} fields={fields} showApiKey={config.selfHosted.isEnabled} />
      </div>
    </>
  )
}
