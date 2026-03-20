import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { resetFieldsAndCategories, resetLLMSettings } from "./actions"

export default async function DangerSettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2 text-red-500">Zona de Perigo</h1>
      <p className="text-sm text-red-400 mb-8 max-w-prose">
        As definições aqui irão substituir os seus campos, categorias e prompts existentes. Use apenas se algo estiver
        avariado.
      </p>
      <div className="space-y-10">
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Definições de IA</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-prose">
            Isto irá repor o prompt do sistema e outras definições de IA para os valores predefinidos
          </p>
          <form
            action={async () => {
              "use server"
              await resetLLMSettings(user)
            }}
          >
            <Button variant="destructive" type="submit">
              Repor prompt principal de IA
            </Button>
          </form>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Campos, moedas e categorias</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-prose">
            Isto irá repor todos os campos, moedas e categorias para os valores predefinidos
          </p>
          <form
            action={async () => {
              "use server"
              await resetFieldsAndCategories(user)
            }}
          >
            <Button variant="destructive" type="submit">
              Repor campos, moedas e categorias
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
