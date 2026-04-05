"use client"

import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Banknote,
  Brain,
  Building2,
  ChartBarStacked,
  FolderOpenDot,
  HardDrive,
  Sliders,
  TextCursorInput,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const iconMap: Record<string, React.ElementType> = {
  "/settings": Sliders,
  "/settings/profile": User,
  "/settings/business": Building2,
  "/settings/llm": Brain,
  "/settings/fields": TextCursorInput,
  "/settings/categories": ChartBarStacked,
  "/settings/projects": FolderOpenDot,
  "/settings/currencies": Banknote,
  "/settings/backups": HardDrive,
  "/settings/danger": AlertTriangle,
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

export function SideNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-wrap gap-1 lg:flex-col", className)} {...props}>
      {items.map((item) => {
        const Icon = iconMap[item.href]
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary border-l-[3px] border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
