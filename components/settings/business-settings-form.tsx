"use client"

import { saveProfileAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormAvatar, FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { User } from "@/prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"

export default function BusinessSettingsForm({ user }: { user: User }) {
  const [saveState, saveAction, pending] = useActionState(saveProfileAction, null)

  return (
    <div>
      <form action={saveAction} className="space-y-4">
        <FormInput
          title="Nome da Empresa"
          name="businessName"
          placeholder="Empresa, Lda."
          defaultValue={user.businessName ?? ""}
        />

        <FormTextarea
          title="Morada da Empresa"
          name="businessAddress"
          placeholder="Rua, Cidade, Código Postal, País, NIF/NIPC"
          defaultValue={user.businessAddress ?? ""}
        />

        <FormTextarea
          title="Dados Bancários"
          name="businessBankDetails"
          placeholder="Banco, Número de Conta, BIC, IBAN, dados de pagamento"
          defaultValue={user.businessBankDetails ?? ""}
        />

        <FormAvatar
          title="Logótipo da Empresa"
          name="businessLogo"
          className="w-52 h-52"
          defaultValue={user.businessLogo ?? ""}
        />

        <div className="flex flex-row items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "A guardar..." : "Guardar"}
          </Button>
          {saveState?.success && (
            <p className="text-green-500 flex flex-row items-center gap-2">
              <CircleCheckBig />
              Guardado!
            </p>
          )}
        </div>

        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </form>
    </div>
  )
}
