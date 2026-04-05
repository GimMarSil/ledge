import { addFieldAction, deleteFieldAction, editFieldAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getCurrentUser } from "@/lib/auth"
import { getFields } from "@/models/fields"
import { Prisma } from "@/prisma/client"

export default async function FieldsSettingsPage() {
  const user = await getCurrentUser()
  const fields = await getFields(user.id)
  const fieldsWithActions = fields.map((field) => ({
    ...field,
    isEditable: true,
    isDeletable: field.isExtra,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">Campos Personalizados</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-prose">
        Adicione campos personalizados às suas transações. Os campos padrão não podem ser removidos mas pode
        ajustar os prompts ou ocultá-los. Se não quiser que um campo seja analisado pela IA, deixe o
        &quot;Prompt LLM&quot; vazio.
      </p>
      <CrudTable
        items={fieldsWithActions}
        columns={[
          { key: "name", label: "Nome", editable: true },
          {
            key: "type",
            label: "Tipo",
            type: "select",
            options: ["string", "number", "boolean"],
            defaultValue: "string",
            editable: true,
          },
          { key: "llm_prompt", label: "Prompt LLM", editable: true },
          {
            key: "isVisibleInList",
            label: "Mostrar na tabela de transações",
            type: "checkbox",
            defaultValue: false,
            editable: true,
          },
          {
            key: "isVisibleInAnalysis",
            label: "Mostrar no formulário de análise",
            type: "checkbox",
            defaultValue: false,
            editable: true,
          },
          {
            key: "isRequired",
            label: "Obrigatório",
            type: "checkbox",
            defaultValue: false,
            editable: true,
          },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteFieldAction(user.id, code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addFieldAction(user.id, data as Prisma.FieldCreateInput)
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editFieldAction(user.id, code, data as Prisma.FieldUpdateInput)
        }}
      />
    </div>
  )
}
