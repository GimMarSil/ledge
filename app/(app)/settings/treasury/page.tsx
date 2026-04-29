import {
  addTreasuryAccountAction,
  deleteTreasuryAccountAction,
  editTreasuryAccountAction,
} from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getCurrentUser } from "@/lib/auth"
import { ensurePersonalTreasuryAccount, getTreasuryAccounts } from "@/models/treasury-accounts"

export default async function TreasurySettingsPage() {
  const user = await getCurrentUser()
  // Backfill: existing users provisioned before the treasury feature
  // landed don't have the auto-seeded personal account yet.
  await ensurePersonalTreasuryAccount(user.id, user.name)
  const accounts = await getTreasuryAccounts(user.id)
  const accountsWithActions = accounts.map((account) => ({
    ...account,
    isEditable: true,
    // Personal account is the system default — cannot be deleted, but
    // can still be edited (e.g. update IBAN/holder).
    isDeletable: account.code !== "personal",
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">Contas de Tesouraria</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-prose">
        Defina as contas que pagam despesas. As de tipo <strong>empresa</strong> são contas da sociedade
        (banco, caixa, cartão de crédito); as de tipo <strong>pessoal</strong> representam pagamentos
        feitos do bolso de um colaborador, que ficam à espera de reembolso. Cada utilizador tem por
        omissão uma conta pessoal.
      </p>
      <CrudTable
        items={accountsWithActions}
        columns={[
          { key: "name", label: "Nome", editable: true },
          {
            key: "type",
            label: "Tipo",
            type: "select",
            options: ["company", "personal"],
            defaultValue: "company",
            editable: true,
          },
          { key: "holderName", label: "Titular", editable: true },
          { key: "iban", label: "IBAN", editable: true },
          { key: "bankName", label: "Banco", editable: true },
        ]}
        onAdd={async (data) => {
          "use server"
          return await addTreasuryAccountAction(user.id, data)
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editTreasuryAccountAction(user.id, code, data)
        }}
        onDelete={async (code) => {
          "use server"
          return await deleteTreasuryAccountAction(user.id, code)
        }}
      />
    </div>
  )
}
