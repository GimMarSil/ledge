"use client"

import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BUSINESS_REGIME_LABELS, BusinessRegime } from "@/lib/fiscal/calendar"
import { Settings } from "lucide-react"
import Link from "next/link"

interface FiscalHeaderProps {
  regime: BusinessRegime
  year: number
  onRegimeChange: (regime: BusinessRegime) => void
  onYearChange: (year: number) => void
}

export function FiscalHeader({ regime, year, onRegimeChange, onYearChange }: FiscalHeaderProps) {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Painel Fiscal</h1>
        <Badge variant="secondary" className="text-xs">
          {BUSINESS_REGIME_LABELS[regime]}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <Select value={regime} onValueChange={(v) => onRegimeChange(v as BusinessRegime)}>
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BUSINESS_REGIME_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
          <SelectTrigger className="w-[100px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link
          href="/settings/business"
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Alterar regime fiscal"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </div>
  )
}
