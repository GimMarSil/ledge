import { addProjectAction, deleteProjectAction, editProjectAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency, randomHexColor } from "@/lib/utils"
import { getProjects } from "@/models/projects"
import { Prisma } from "@/prisma/client"

export default async function ProjectsSettingsPage() {
  const user = await getCurrentUser()
  const projects = await getProjects(user.id)
  const projectsWithActions = projects.map((project) => ({
    ...project,
    budget: project.budget ? project.budget / 100 : null,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">Projetos</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-prose">
        Use projetos para diferenciar os tipos de atividades que realiza. Por exemplo: Freelancing, canal YouTube,
        Blogging. Os projetos sao uma forma conveniente de separar estatisticas e definir orcamentos.
      </p>
      <CrudTable
        items={projectsWithActions}
        columns={[
          { key: "name", label: "Nome", editable: true },
          { key: "llm_prompt", label: "Prompt LLM", editable: true },
          { key: "color", label: "Cor", type: "color", defaultValue: randomHexColor(), editable: true },
          { key: "budget", label: "Orcamento (EUR)", type: "number", editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteProjectAction(user.id, code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addProjectAction(user.id, data as Prisma.ProjectCreateInput)
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editProjectAction(user.id, code, data as Prisma.ProjectUpdateInput)
        }}
      />
    </div>
  )
}
