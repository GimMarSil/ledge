"use client"

import { SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { ComponentProps } from "react"

export function SidebarMenuItemWithHighlight({
  href,
  children,
  className,
  ...props
}: { href: string } & ComponentProps<typeof SidebarMenuItem>) {
  const pathname = usePathname()
  let isActive = false
  if (href === "/") {
    isActive = pathname === href
  } else {
    isActive = pathname.startsWith(href)
  }

  return (
    <SidebarMenuItem
      className={cn(
        "font-medium rounded-lg transition-all duration-200",
        isActive && "border-l-[3px] border-primary bg-primary/5 text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </SidebarMenuItem>
  )
}
