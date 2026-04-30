"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BusinessRegime,
  FiscalDeadlineInstance,
  getDaysUntilDeadline,
  getUrgencyLevel,
  URGENCY_COLORS,
  getDeadlinesForMonth,
} from "@/lib/fiscal/calendar"
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useState } from "react"

interface FiscalCalendarWidgetProps {
  upcomingDeadlines: FiscalDeadlineInstance[]
  overdueDeadlines: FiscalDeadlineInstance[]
  regime: BusinessRegime
  year: number
}

const MONTH_NAMES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const WEEKDAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]

function DeadlineItem({ deadline }: { deadline: FiscalDeadlineInstance }) {
  const days = getDaysUntilDeadline(deadline)
  const urgency = getUrgencyLevel(days)
  const colors = URGENCY_COLORS[urgency]
  const dueDate = new Date(deadline.dueDate)

  const daysLabel = days === 0 ? "Hoje" :
    days === 1 ? "Amanha" :
    days < 0 ? `${Math.abs(days)}d atrasado` :
    `${days}d`

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors.border} ${colors.bg} transition-all`}>
      <div className="flex flex-col items-center min-w-[44px]">
        <span className={`text-xs font-medium uppercase ${colors.text}`}>
          {MONTH_NAMES_SHORT[dueDate.getMonth()]}
        </span>
        <span className={`text-xl font-bold ${colors.text}`}>
          {dueDate.getDate()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{deadline.name}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colors.text} ${colors.border} shrink-0`}>
            {daysLabel}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{deadline.description}</p>
        {deadline.legalBasis && (
          <p className="text-[10px] text-muted-foreground/70 mt-1">{deadline.legalBasis}</p>
        )}
      </div>
    </div>
  )
}

function MiniCalendar({ regime, year, initialMonth }: { regime: BusinessRegime; year: number; initialMonth: number }) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [currentYear, setCurrentYear] = useState(year)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const monthDeadlines = getDeadlinesForMonth(regime, currentYear, currentMonth)
  const deadlineDays = new Set(monthDeadlines.map((d) => new Date(d.dueDate).getDate()))

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Monday-based
  const totalDays = lastDay.getDate()

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1) }
    else setCurrentMonth(currentMonth - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1) }
    else setCurrentMonth(currentMonth + 1)
    setSelectedDay(null)
  }

  const selectedDeadlines = selectedDay
    ? monthDeadlines.filter((d) => new Date(d.dueDate).getDate() === selectedDay)
    : []

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_NAMES.map((day) => (
          <div key={day} className="text-[10px] font-medium text-muted-foreground py-1">{day}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1
          const hasDeadline = deadlineDays.has(day)
          const isToday = new Date().getDate() === day &&
            new Date().getMonth() === currentMonth &&
            new Date().getFullYear() === currentYear
          const isSelected = selectedDay === day

          return (
            <button
              key={day}
              onClick={() => hasDeadline ? setSelectedDay(isSelected ? null : day) : undefined}
              className={`
                relative h-8 w-full rounded text-xs font-medium transition-all
                ${isToday ? "ring-1 ring-[hsl(172,100%,39%)]" : ""}
                ${isSelected ? "bg-[hsl(172,100%,39%)] text-white" : "hover:bg-muted"}
                ${hasDeadline && !isSelected ? "font-bold" : ""}
                ${!hasDeadline ? "cursor-default" : "cursor-pointer"}
              `}
            >
              {day}
              {hasDeadline && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[hsl(172,100%,39%)]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day details */}
      {selectedDeadlines.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedDay} {MONTH_NAMES[currentMonth]}
          </span>
          {selectedDeadlines.map((d, i) => (
            <div key={i} className="text-xs p-2 rounded bg-muted">
              <span className="font-medium">{d.name}</span>
              <p className="text-muted-foreground mt-0.5">{d.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function FiscalCalendarWidget({
  upcomingDeadlines,
  overdueDeadlines,
  regime,
  year,
}: FiscalCalendarWidgetProps) {
  const [showAll, setShowAll] = useState(false)
  const urgentCount = upcomingDeadlines.filter((d) => {
    const days = getDaysUntilDeadline(d)
    return days <= 7
  }).length

  const displayDeadlines = showAll ? upcomingDeadlines : upcomingDeadlines.slice(0, 8)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario Fiscal
          </CardTitle>
          {(overdueDeadlines.length > 0 || urgentCount > 0) && (
            <div className="flex items-center gap-2">
              {overdueDeadlines.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueDeadlines.length} atrasada{overdueDeadlines.length > 1 ? "s" : ""}
                </Badge>
              )}
              {urgentCount > 0 && (
                <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
                  {urgentCount} urgente{urgentCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </div>
        {/* Natural language summary */}
        <p className="text-sm text-muted-foreground mt-1">
          {overdueDeadlines.length > 0
            ? `Tem ${overdueDeadlines.length} obrigação${overdueDeadlines.length > 1 ? "ões" : ""} em atraso.`
            : urgentCount > 0
              ? `Tem ${urgentCount} obrigação${urgentCount > 1 ? "ões" : ""} nos próximos 7 dias.`
              : upcomingDeadlines.length > 0
                ? `Proxima obrigacao: ${upcomingDeadlines[0].name} em ${getDaysUntilDeadline(upcomingDeadlines[0])} dias.`
                : "Sem obrigacoes pendentes."
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Timeline */}
          <div className="lg:col-span-2 space-y-3">
            {/* Overdue items */}
            {overdueDeadlines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  Em atraso
                </div>
                {overdueDeadlines.slice(0, 3).map((deadline, i) => (
                  <DeadlineItem key={`overdue-${i}`} deadline={deadline} />
                ))}
              </div>
            )}

            {/* Upcoming items */}
            <div className="space-y-2">
              {overdueDeadlines.length > 0 && (
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mt-2">
                  <Clock className="h-4 w-4" />
                  Proximas obrigacoes
                </div>
              )}
              {displayDeadlines.map((deadline, i) => (
                <DeadlineItem key={`upcoming-${i}`} deadline={deadline} />
              ))}
            </div>

            {!showAll && upcomingDeadlines.length > 8 && (
              <Button variant="ghost" size="sm" onClick={() => setShowAll(true)} className="w-full">
                Ver todas ({upcomingDeadlines.length - 8} mais)
              </Button>
            )}

            {upcomingDeadlines.length === 0 && overdueDeadlines.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Sem obrigacoes fiscais para este regime.</p>
              </div>
            )}
          </div>

          {/* Right: Mini calendar */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border p-4 bg-card">
              <MiniCalendar
                regime={regime}
                year={year}
                initialMonth={new Date().getMonth()}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
