"use client"

import { useNotification } from "@/app/(app)/context"
import { UploadButton } from "@/components/files/upload-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserProfile } from "@/lib/auth"
import config from "@/lib/config"
import { Calculator, ClockArrowUp, FileText, HandCoins, House, Import, Settings, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { ColoredText } from "../ui/colored-text"
import { Blinker } from "./blinker"
import { SidebarMenuItemWithHighlight } from "./sidebar-item"
import SidebarUser from "./sidebar-user"
import { ThemeToggle } from "./theme-toggle"

export function AppSidebar({
  profile,
  unsortedFilesCount,
  isSelfHosted,
}: {
  profile: UserProfile
  unsortedFilesCount: number
  isSelfHosted: boolean
}) {
  const { open, setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const { notification } = useNotification()

  // Hide sidebar on mobile when clicking an item
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 px-1 py-1">
            <Image src={config.app.logo} alt={config.app.title} className="h-9 w-9 rounded-lg" width={36} height={36} />
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-lg">
                <ColoredText>{config.app.title}</ColoredText>
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <UploadButton className="w-full mt-2 mb-1 bg-gradient-to-r from-[hsl(172,100%,39%)] to-[hsl(172,80%,28%)] text-white shadow-md hover:shadow-glow-teal hover:brightness-110 transition-all duration-200 rounded-lg">
              <Upload className="h-5 w-5" />
              {open ? <span>Carregar</span> : ""}
            </UploadButton>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold px-2">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItemWithHighlight href="/dashboard">
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                      <House className="h-5 w-5" />
                      <span>Início</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/transactions">
                  <SidebarMenuButton asChild>
                    <Link href="/transactions">
                      <FileText className="h-5 w-5" />
                      <span>Transações</span>
                      {notification && notification.code === "sidebar.transactions" && notification.message && (
                        <Blinker />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/unsorted">
                  <SidebarMenuButton asChild>
                    <Link href="/unsorted">
                      <ClockArrowUp className="h-5 w-5" />
                      <span>Por Classificar</span>
                      {unsortedFilesCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {unsortedFilesCount}
                        </span>
                      )}
                      {notification && notification.code === "sidebar.unsorted" && notification.message && <Blinker />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/fiscal">
                  <SidebarMenuButton asChild>
                    <Link href="/fiscal">
                      <Calculator className="h-5 w-5" />
                      <span>Painel Fiscal</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/reimbursements">
                  <SidebarMenuButton asChild>
                    <Link href="/reimbursements">
                      <HandCoins className="h-5 w-5" />
                      <span>Reembolsos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/import/e-fatura">
                  <SidebarMenuButton asChild>
                    <Link href="/import/e-fatura">
                      <Import className="h-5 w-5" />
                      <span>Importar e-Fatura</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/settings">
                  <SidebarMenuButton asChild>
                    <Link href="/settings">
                      <Settings className="h-5 w-5" />
                      <span>Definições</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold px-2">
              Ferramentas
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/import/csv">
                      <Import className="h-5 w-5" />
                      Importar CSV
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <ThemeToggle />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {!open && (
                  <SidebarMenuItem>
                    <SidebarTrigger />
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarUser profile={profile} isSelfHosted={isSelfHosted} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
