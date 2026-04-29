import { SideNav } from "@/components/settings/side-nav"
import { Separator } from "@/components/ui/separator"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Definições",
  description: "Personalize as suas definições aqui",
}

const settingsCategories = [
  {
    title: "Geral",
    href: "/settings",
  },
  {
    title: "Perfil e Plano",
    href: "/settings/profile",
  },
  {
    title: "Dados da Empresa",
    href: "/settings/business",
  },
  {
    title: "Definições IA",
    href: "/settings/llm",
  },
  {
    title: "Campos",
    href: "/settings/fields",
  },
  {
    title: "Categorias",
    href: "/settings/categories",
  },
  {
    title: "Projetos",
    href: "/settings/projects",
  },
  {
    title: "Moedas",
    href: "/settings/currencies",
  },
  {
    title: "Contas de Tesouraria",
    href: "/settings/treasury",
  },
  {
    title: "Cópias de Segurança",
    href: "/settings/backups",
  },
  {
    title: "Zona de Perigo",
    href: "/settings/danger",
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="space-y-6 p-10 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Definições</h2>
          <p className="text-muted-foreground">Personalize as suas definições aqui</p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SideNav items={settingsCategories} />
          </aside>
          <div className="flex w-full">{children}</div>
        </div>
      </div>
    </>
  )
}
