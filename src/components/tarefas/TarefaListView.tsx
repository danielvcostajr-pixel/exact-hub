"use client"

import { useState } from "react"
import { format, isPast, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tarefa,
  StatusTarefa,
  PrioridadeTarefa,
  STATUS_CONFIG,
  PRIORIDADE_CONFIG,
} from "./tarefas-types"
import { cn } from "@/lib/utils"

interface TarefaListViewProps {
  tarefas: Tarefa[]
  onSelectTarefa: (tarefa: Tarefa) => void
  selectedTarefaId?: string
}

type SortField = "titulo" | "status" | "prioridade" | "responsavel" | "prazo" | "progresso"
type SortDir = "asc" | "desc"

const PRIORIDADE_ORDER: Record<PrioridadeTarefa, number> = {
  URGENTE: 0,
  ALTA: 1,
  MEDIA: 2,
  BAIXA: 3,
}

const STATUS_ORDER: Record<StatusTarefa, number> = {
  EM_PROGRESSO: 0,
  REVISAO: 1,
  A_FAZER: 2,
  BACKLOG: 3,
  CONCLUIDA: 4,
  CANCELADA: 5,
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function TarefaListView({
  tarefas,
  onSelectTarefa,
  selectedTarefaId,
}: TarefaListViewProps) {
  const [sortField, setSortField] = useState<SortField>("prioridade")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === tarefas.length) setSelected(new Set())
    else setSelected(new Set(tarefas.map((t) => t.id)))
  }

  const sorted = [...tarefas].sort((a, b) => {
    let cmp = 0
    if (sortField === "titulo") cmp = a.titulo.localeCompare(b.titulo)
    else if (sortField === "status") cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    else if (sortField === "prioridade") cmp = PRIORIDADE_ORDER[a.prioridade] - PRIORIDADE_ORDER[b.prioridade]
    else if (sortField === "responsavel") cmp = a.responsavel.localeCompare(b.responsavel)
    else if (sortField === "prazo") cmp = a.prazo.localeCompare(b.prazo)
    else if (sortField === "progresso") cmp = a.progresso - b.progresso
    return sortDir === "asc" ? cmp : -cmp
  })

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-4 py-3 text-left">
                <Checkbox
                  checked={selected.size === tarefas.length && tarefas.length > 0}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("titulo")}
                >
                  Titulo <SortIcon field="titulo" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon field="status" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("prioridade")}
                >
                  Prioridade <SortIcon field="prioridade" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("responsavel")}
                >
                  Responsavel <SortIcon field="responsavel" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("prazo")}
                >
                  Prazo <SortIcon field="prazo" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground min-w-[120px]">
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => handleSort("progresso")}
                >
                  Progresso <SortIcon field="progresso" />
                </button>
              </th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((tarefa) => {
              const statusCfg = STATUS_CONFIG[tarefa.status]
              const prioridadeCfg = PRIORIDADE_CONFIG[tarefa.prioridade]
              const isOverdue =
                tarefa.status !== "CONCLUIDA" &&
                tarefa.status !== "CANCELADA" &&
                isPast(parseISO(tarefa.prazo))
              const isSelected = selectedTarefaId === tarefa.id

              return (
                <tr
                  key={tarefa.id}
                  className={cn(
                    "border-b border-border cursor-pointer transition-colors hover:bg-muted/40",
                    isSelected && "bg-primary/5",
                    selected.has(tarefa.id) && "bg-muted/20"
                  )}
                  onClick={() => onSelectTarefa(tarefa)}
                >
                  <td
                    className="px-4 py-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelect(tarefa.id)
                    }}
                  >
                    <Checkbox
                      checked={selected.has(tarefa.id)}
                      onCheckedChange={() => toggleSelect(tarefa.id)}
                    />
                  </td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="font-medium text-foreground truncate">{tarefa.titulo}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {tarefa.descricao}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        statusCfg.bg,
                        statusCfg.color
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        prioridadeCfg.bg,
                        prioridadeCfg.color
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", prioridadeCfg.dot)} />
                      {prioridadeCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(tarefa.responsavel)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground truncate max-w-[100px]">
                        {tarefa.responsavel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isOverdue ? "text-red-500" : "text-foreground"
                      )}
                    >
                      {format(parseISO(tarefa.prazo), "dd/MM/yyyy", { locale: ptBR })}
                      {isOverdue && (
                        <span className="block text-xs text-red-500 font-normal">Atrasada</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Progress value={tarefa.progresso} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {tarefa.progresso}%
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhuma tarefa encontrada com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{sorted.length} tarefa{sorted.length !== 1 ? "s" : ""} exibida{sorted.length !== 1 ? "s" : ""}</span>
        {selected.size > 0 && (
          <span>{selected.size} selecionada{selected.size !== 1 ? "s" : ""}</span>
        )}
      </div>
    </div>
  )
}
