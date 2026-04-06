import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import { Lock, Shield } from "lucide-react"
import Image from "next/image"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  if (config.selfHosted.isEnabled) {
    redirect(config.selfHosted.redirectUrl)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md animate-fade-up">
        <Card className="p-8 flex flex-col items-center justify-center gap-6 shadow-2xl border-0 ring-1 ring-border/50">
          <Image src={config.app.logo} alt={config.app.title} width={80} height={80} className="w-20 h-20" />
          <CardTitle className="text-3xl font-bold">
            <ColoredText>{config.app.title}</ColoredText>
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            {config.app.description}
          </p>
          <CardContent className="w-full p-0">
            <LoginForm />
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span>Encriptação de ponta-a-ponta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Os seus dados permanecem seus</span>
          </div>
        </div>
      </div>
    </div>
  )
}
