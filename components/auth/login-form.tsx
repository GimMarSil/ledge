"use client"

import { FormError } from "@/components/forms/error"
import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

export function LoginForm({ defaultEmail }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail || "")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // SECURITY: account enumeration prevention.
    // Always advance to the OTP screen with the same generic message,
    // regardless of whether the email is registered. The auth backend
    // silently no-ops for unknown emails, so an attacker cannot use this
    // form to scrape which addresses have accounts.
    try {
      await authClient.emailOtp
        .sendVerificationOtp({ email, type: "sign-in" })
        .catch(() => {
          // Swallow failures (network, unknown email, rate-limit) so the
          // UI never reveals account existence. Real errors are still
          // logged server-side via the auth provider's logger.
        })
    } finally {
      setIsLoading(false)
      // Always show the OTP screen — same UX whether the email is real or not.
      setIsOtpSent(true)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }

  const handleVerifyOtp = async (otpString?: string) => {
    const code = otpString || otp.join("")
    if (code.length !== 6) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp: code,
      })
      if (result.error) {
        setError("O código é inválido ou expirou")
        return
      }
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao verificar o código")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    const fullOtp = newOtp.join("")
    if (fullOtp.length === 6) {
      handleVerifyOtp(fullOtp)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      const newOtp = pasted.split("")
      setOtp(newOtp)
      handleVerifyOtp(pasted)
    }
  }

  const handleBack = () => {
    setIsOtpSent(false)
    setOtp(["", "", "", "", "", ""])
    setError(null)
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {!isOtpSent ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4 w-full">
          <FormInput
            title="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="o-seu@email.com"
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4 w-full animate-fade-up">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Enviámos um código de verificação para
            </p>
            <p className="text-sm font-medium mt-1">{email}</p>
          </div>

          <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-input bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all duration-200"
              />
            ))}
          </div>

          <Button
            onClick={() => handleVerifyOtp()}
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar Código"}
          </Button>

          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>
        </div>
      )}

      {error && <FormError className="text-center">{error}</FormError>}
    </div>
  )
}
