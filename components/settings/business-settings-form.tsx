"use client"

import { saveProfileAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormAvatar, FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "@/prisma/client"
import { CircleCheckBig, Landmark } from "lucide-react"
import { useActionState, useRef } from "react"

const TAX_REGIMES = [
  { value: "trabalhador_dependente", label: "Trabalhador Dependente", description: "Trabalhador por conta de outrem (IRS Cat. A)" },
  { value: "trabalhador_independente", label: "Trabalhador Independente", description: "Ato isolado, recibos verdes (IRS Cat. B)" },
  { value: "micro_empresa", label: "Micro-empresa", description: "Volume negocios < 2M EUR, < 10 trabalhadores" },
  { value: "pme", label: "PME / Media Empresa", description: "Pequena ou media empresa (IRC)" },
  { value: "sgps", label: "SGPS (Holding)", description: "Sociedade gestora de participacoes sociais" },
  { value: "grande_empresa", label: "Grande Empresa", description: "Volume negocios > 50M EUR ou > 250 trabalhadores" },
] as const

export default function BusinessSettingsForm({ user }: { user: User }) {
  const [saveState, saveAction, pending] = useActionState(saveProfileAction, null)
  const taxRegimeRef = useRef<HTMLInputElement>(null)
  const isRegimeConfigured = !!user.businessTaxRegime

  return (
    <div>
      <form action={saveAction} className="space-y-6">
        {/* Seccao fiscal - destacada */}
        <div className={`rounded-lg border-2 p-5 space-y-4 ${!isRegimeConfigured ? "border-[hsl(172,100%,39%)]/40 bg-[hsl(172,100%,39%)]/5" : "border-muted"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="h-4 w-4 text-[hsl(172,100%,39%)]" />
            <span className="text-sm font-semibold">Dados Fiscais</span>
            {!isRegimeConfigured && (
              <span className="text-[10px] font-medium text-[hsl(172,100%,39%)] bg-[hsl(172,100%,39%)]/10 px-2 py-0.5 rounded-full">
                Configurar
              </span>
            )}
          </div>
          {!isRegimeConfigured && (
            <p className="text-xs text-muted-foreground">
              Configure o regime fiscal para ver obrigacoes e prazos personalizados no Painel Fiscal.
            </p>
          )}

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
                    <div className="flex flex-col">
                      <span>{regime.label}</span>
                      <span className="text-[10px] text-muted-foreground">{regime.description}</span>
                    </div>
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
        </div>

        {/* Dados gerais da empresa */}
        <FormInput
          title="Nome da Empresa"
          name="businessName"
          placeholder="Empresa, Lda."
          defaultValue={user.businessName ?? ""}
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
