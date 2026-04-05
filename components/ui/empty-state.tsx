import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 rounded-xl border border-dashed bg-muted/30">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap gap-3 mt-2">{children}</div>}
    </div>
  )
}
