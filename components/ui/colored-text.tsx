import { cn } from "@/lib/utils"

export function ColoredText({
  children,
  className,
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent", className)}>
      {children}
    </span>
  )
}
