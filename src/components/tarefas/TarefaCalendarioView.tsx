"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tarefa, PRIORIDADE_CONFIG } from "./tarefas-types"
import { cn } from "@/lib/utils"

interface TarefaCalendarioViewProps {
  tarefas: Tarefa[]
  onSelectTarefa: (tarefa: Tarefa) => void
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export default function TarefaCalendarioView({
  tarefas,
  onSelectTarefa,
}: TarefaCalendarioViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // Build weeks grid
  const weeks: Date[][] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(day)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  function getTarefasForDay(date: Date) {
    return tarefas.filter((t) => {
      try {
        return isSameDay(parseISO(t.prazo), date)
      } catch {
        return false
      }
    })
  }

  const selectedDayTarefas = selectedDay ? getTarefasForDay(selectedDay) : []

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="h-8 px-3 text-xs"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK_DAYS.map((wd) => (
            <div
              key={wd}
              className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Weeks grid */}
        <div className="divide-y divide-border">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 divide-x divide-border">
              {week.map((date, di) => {
                const dayTarefas = getTarefasForDay(date)
                const isCurrentMonth = isSameMonth(date, currentMonth)
                const isTodayDate = isToday(date)
                const isSelected = selectedDay ? isSameDay(date, selectedDay) : false

                return (
                  <div
                    key={di}
                    className={cn(
                      "min-h-[100px] p-1.5 cursor-pointer transition-colors",
                      !isCurrentMonth && "bg-muted/20",
                      isSelected && "bg-primary/5",
                      isCurrentMonth && !isSelected && "hover:bg-muted/30"
                    )}
                    onClick={() =>
                      setSelectedDay(isSelected ? null : date)
                    }
                  >
                    {/* Day number */}
                    <div
                      className={cn(
                        "flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium mb-1 mx-auto",
                        isTodayDate
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                          ? "text-foreground hover:bg-muted"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {format(date, "d")}
                    </div>

                    {/* Task dots/chips */}
                    <div className="space-y-0.5">
                      {dayTarefas.slice(0, 3).map((tarefa) => {
                        const pCfg = PRIORIDADE_CONFIG[tarefa.prioridade]
                        return (
                          <div
                            key={tarefa.id}
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded truncate leading-tight",
                              pCfg.bg,
                              pCfg.color
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectTarefa(tarefa)
                            }}
                          >
                            {tarefa.titulo}
                          </div>
                        )
                      })}
                      {dayTarefas.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1.5 font-medium">
                          +{dayTarefas.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground capitalize">
              {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedDayTarefas.length} tarefa{selectedDayTarefas.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setSelectedDay(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {selectedDayTarefas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa com prazo neste dia.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayTarefas.map((tarefa) => {
                const pCfg = PRIORIDADE_CONFIG[tarefa.prioridade]
                return (
                  <div
                    key={tarefa.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onSelectTarefa(tarefa)}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 mt-0.5",
                        pCfg.bg,
                        pCfg.color
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", pCfg.dot)} />
                      {pCfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tarefa.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Responsavel: {tarefa.responsavel}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {tarefa.progresso}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Prioridade:</span>
        {(["URGENTE", "ALTA", "MEDIA", "BAIXA"] as const).map((p) => {
          const cfg = PRIORIDADE_CONFIG[p]
          return (
            <span key={p} className="flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
