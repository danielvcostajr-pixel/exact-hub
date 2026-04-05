"use client"

import { useMemo, useRef } from "react"
import {
  differenceInDays,
  parseISO,
  format,
  startOfWeek,
  addDays,
  addWeeks,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tarefa, STATUS_CONFIG, PRIORIDADE_CONFIG } from "./tarefas-types"
import { cn } from "@/lib/utils"

interface TarefaGanttViewProps {
  tarefas: Tarefa[]
  onSelectTarefa: (tarefa: Tarefa) => void
}

const LEFT_COL_WIDTH = 260
const ROW_HEIGHT = 48
const HEADER_HEIGHT = 56
const DAY_WIDTH = 32

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function TarefaGanttView({
  tarefas,
  onSelectTarefa,
}: TarefaGanttViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Filter out tasks without valid dates for Gantt rendering
  const tarefasComDatas = useMemo(
    () => tarefas.filter((t) => t.dataInicio && t.prazo && t.dataInicio.length >= 10 && t.prazo.length >= 10),
    [tarefas]
  )
  const tarefasSemDatas = tarefas.length - tarefasComDatas.length

  const { timelineStart, totalDays, weeks } = useMemo(() => {
    if (tarefasComDatas.length === 0) {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 })
      return {
        timelineStart: start,
        totalDays: 60,
        weeks: Array.from({ length: 9 }, (_, i) => addWeeks(start, i)),
      }
    }

    const allDates = tarefasComDatas.flatMap((t) => [
      parseISO(t.dataInicio),
      parseISO(t.prazo),
    ]).filter((d) => !isNaN(d.getTime()))
    if (allDates.length === 0) allDates.push(new Date())
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

    const start = startOfWeek(addDays(minDate, -7), { weekStartsOn: 1 })
    const end = addDays(maxDate, 14)
    const total = differenceInDays(end, start) + 1

    const weeksArr: Date[] = []
    let w = start
    while (w <= end) {
      weeksArr.push(w)
      w = addWeeks(w, 1)
    }

    return { timelineStart: start, totalDays: total, weeks: weeksArr }
  }, [tarefasComDatas])

  function dayOffset(dateStr: string) {
    return differenceInDays(parseISO(dateStr), timelineStart)
  }

  const totalWidth = totalDays * DAY_WIDTH
  const todayOffset = differenceInDays(new Date(), timelineStart)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex">
        {/* Left: Task names column */}
        <div
          className="flex-shrink-0 border-r border-border z-10 bg-card"
          style={{ width: LEFT_COL_WIDTH }}
        >
          {/* Header */}
          <div
            className="border-b border-border flex items-center px-4 font-semibold text-sm text-muted-foreground"
            style={{ height: HEADER_HEIGHT }}
          >
            Tarefa
          </div>
          {/* Task rows */}
          {tarefasComDatas.map((tarefa) => {
            const prioridadeCfg = PRIORIDADE_CONFIG[tarefa.prioridade]
            return (
              <div
                key={tarefa.id}
                className="border-b border-border flex items-center px-3 gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
                style={{ height: ROW_HEIGHT }}
                onClick={() => onSelectTarefa(tarefa)}
              >
                <span className={cn("h-2 w-2 rounded-full flex-shrink-0", prioridadeCfg.dot)} />
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getInitials(tarefa.responsavel)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground truncate">
                  {tarefa.titulo}
                </span>
              </div>
            )
          })}
        </div>

        {/* Right: Timeline */}
        <div className="flex-1 overflow-x-auto" ref={scrollRef}>
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Timeline header */}
            <div
              className="border-b border-border relative"
              style={{ height: HEADER_HEIGHT }}
            >
              {/* Week labels */}
              {weeks.map((weekStart, wi) => {
                const offset = differenceInDays(weekStart, timelineStart)
                if (offset < 0 || offset >= totalDays) return null
                return (
                  <div
                    key={wi}
                    className="absolute top-0 border-l border-border/50"
                    style={{ left: offset * DAY_WIDTH, width: 7 * DAY_WIDTH }}
                  >
                    <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {format(weekStart, "MMM", { locale: ptBR })}
                    </div>
                    <div className="px-2 text-xs text-foreground font-medium">
                      {format(weekStart, "dd")} – {format(addDays(weekStart, 6), "dd")}
                    </div>
                  </div>
                )
              })}

              {/* Today line in header */}
              {todayOffset >= 0 && todayOffset < totalDays && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                  style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                />
              )}
            </div>

            {/* Task bars */}
            <div className="relative">
              {/* Column grid lines */}
              {weeks.map((weekStart, wi) => {
                const offset = differenceInDays(weekStart, timelineStart)
                if (offset < 0) return null
                return (
                  <div
                    key={wi}
                    className="absolute top-0 bottom-0 border-l border-border/30"
                    style={{ left: offset * DAY_WIDTH }}
                  />
                )
              })}

              {/* Today line */}
              {todayOffset >= 0 && todayOffset < totalDays && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-400/60 z-10"
                  style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                />
              )}

              {/* Task rows */}
              {tarefasComDatas.map((tarefa) => {
                const startOffset = dayOffset(tarefa.dataInicio)
                const endOffset = dayOffset(tarefa.prazo)
                const duration = Math.max(endOffset - startOffset + 1, 1)
                const barWidth = duration * DAY_WIDTH
                const barLeft = startOffset * DAY_WIDTH

                const barColorClass = {
                  BACKLOG: "bg-gray-400",
                  A_FAZER: "bg-blue-500",
                  EM_PROGRESSO: "bg-orange-500",
                  REVISAO: "bg-purple-500",
                  CONCLUIDA: "bg-green-500",
                  CANCELADA: "bg-red-400",
                }[tarefa.status]

                const progressFillClass = {
                  BACKLOG: "bg-gray-600",
                  A_FAZER: "bg-blue-700",
                  EM_PROGRESSO: "bg-orange-700",
                  REVISAO: "bg-purple-700",
                  CONCLUIDA: "bg-green-700",
                  CANCELADA: "bg-red-600",
                }[tarefa.status]

                return (
                  <div
                    key={tarefa.id}
                    className="border-b border-border relative"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Bar */}
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 rounded-md cursor-pointer opacity-80 hover:opacity-100 transition-opacity overflow-hidden",
                        barColorClass
                      )}
                      style={{
                        left: barLeft,
                        width: barWidth,
                        height: 24,
                      }}
                      onClick={() => onSelectTarefa(tarefa)}
                      title={`${tarefa.titulo} | ${format(parseISO(tarefa.dataInicio), "dd/MM")} – ${format(parseISO(tarefa.prazo), "dd/MM")} | ${tarefa.progresso}%`}
                    >
                      {/* Progress fill */}
                      <div
                        className={cn("h-full rounded-md opacity-60", progressFillClass)}
                        style={{ width: `${tarefa.progresso}%` }}
                      />

                      {/* Label inside bar if wide enough */}
                      {barWidth > 80 && (
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-[10px] font-semibold text-white truncate">
                            {tarefa.titulo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-border flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium text-foreground">Status:</span>
        {(["BACKLOG", "A_FAZER", "EM_PROGRESSO", "REVISAO", "CONCLUIDA", "CANCELADA"] as const).map(
          (s) => {
            const cfg = STATUS_CONFIG[s]
            const dotColor = {
              BACKLOG: "bg-gray-400",
              A_FAZER: "bg-blue-500",
              EM_PROGRESSO: "bg-orange-500",
              REVISAO: "bg-purple-500",
              CONCLUIDA: "bg-green-500",
              CANCELADA: "bg-red-400",
            }[s]
            return (
              <span key={s} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-5 rounded-sm", dotColor)} />
                {cfg.label}
              </span>
            )
          }
        )}
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="h-2.5 w-px bg-red-500" />
          Hoje
        </span>
      </div>
      {tarefasSemDatas > 0 && (
        <div className="px-4 py-2 border-t border-border text-xs text-amber-500">
          {tarefasSemDatas} tarefa{tarefasSemDatas !== 1 ? 's' : ''} sem data de inicio ou prazo definido — nao exibida{tarefasSemDatas !== 1 ? 's' : ''} no Gantt.
        </div>
      )}
    </div>
  )
}
