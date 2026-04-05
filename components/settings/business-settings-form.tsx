"use client"

import { saveProfileAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormAvatar, FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "@/prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState, useRef } from "react"

const TAX_REGIMES = [
  { value: "trabalhador_dependente", label: "Trabalhador Dependente" },
  { value: "trabalhador_independente", label: "Trabalhador Independente" },
  { value: "micro_empresa", label: "Micro-empresa" },
  { value: "pme", label: "PME / Media Empresa" },
  { value: "sgps", label: "SGPS (Holding)" },
  { value: "grande_empresa", label: "Grande Empresa" },
] as const

export default function BusinessSettingsForm({ user }: { user: User }) {
  const [saveState, saveAction, pending] = useActionState(saveProfileAction, null)
  const taxRegimeRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <form action={saveAction} className="space-y-4">
        <FormInput
          title="Nome da Empresa"
          name="businessName"
          placeholder="Empresa, Lda."
          defaultValue={user.businessName ?? ""}
        />

        <FormInput
          title="NIF / NIPC"
          name="businessNif"
          placeholder="123456789"
          defaultValue={user.businessNif ?? ""}
        />

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Regime Fiscal</span>
          <input type="hidden" name="businessTaxRegime" ref={taxRegimeRef} defaultValue={user.businessTaxRegime ?? ""} />
          <Select
            defaultValue={user.businessTaxRegime ?? ""}
            onValueChange={(value) => {
              if (taxRegimeRef.current) taxRegimeRef.current.value = value
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Selecionar regime fiscal" />
            </SelectTrigger>
            <SelectContent>
              {TAX_REGIMES.map((regime) => (
                <SelectItem key={regime.value} value={regime.value}>
                  {regime.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormInput
          title="CAE (Atividade Economica)"
          name="businessActivity"
          placeholder="ex: 62010 - Atividades de programacao informatica"
          defaultValue={user.businessActivity ?? ""}
        />

        <FormTextarea
          title="Morada da Empresa"
          name="businessAddress"
          placeholder="Rua, Cidade, Codigo Postal, Pais"
          defaultValue={user.businessAddress ?? ""}
        />

        <FormTextarea
          title="Dados Bancarios"
          name="businessBankDetails"
          placeholder="Banco, Numero de Conta, BIC, IBAN, dados de pagamento"
          defaultValue={user.businessBankDetails ?? ""}
        />

        <FormAvatar
          title="Logotipo da Empresa"
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
