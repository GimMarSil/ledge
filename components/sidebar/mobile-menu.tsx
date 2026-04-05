"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSidebar } from "@/components/ui/sidebar"
import config from "@/lib/config"
import Link from "next/link"

export default function MobileMenu({ unsortedFilesCount }: { unsortedFilesCount: number }) {
  const { toggleSidebar } = useSidebar()

  return (
    <menu className="flex flex-row gap-2 p-3 items-center justify-between fixed top-0 left-0 w-full z-50 border-b bg-background/80 backdrop-blur-xl shadow-sm md:hidden">
      <Avatar className="h-9 w-9 rounded-lg cursor-pointer" onClick={toggleSidebar}>
        <AvatarImage src="/logo/logo.svg" />
        <AvatarFallback className="rounded-lg">AI</AvatarFallback>
      </Avatar>
      <Link href="/" className="text-lg font-bold text-brand-gradient">
        {config.app.title}
      </Link>
      <Link
        href="/unsorted"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
      >
        {unsortedFilesCount}
      </Link>
    </menu>
  )
}
