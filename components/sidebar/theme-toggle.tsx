"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div onClick={toggleTheme} className="flex items-center gap-2 cursor-pointer">
      {theme === "dark" ? (
        <>
          <Sun className="h-5 w-5" />
          Modo Claro
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          Modo Escuro
        </>
      )}
    </div>
  )
}
