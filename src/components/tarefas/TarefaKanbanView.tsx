"use client"

import { useState } from "react"
import { format, isPast, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MessageSquare, Paperclip, Calendar } from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tarefa,
  StatusTarefa,
  STATUS_CONFIG,
  PRIORIDADE_CONFIG,
} from "./tarefas-types"
import { cn } from "@/lib/utils"

interface TarefaKanbanViewProps {
  tarefas: Tarefa[]
  onSelectTarefa: (tarefa: Tarefa) => void
  onUpdateStatus?: (tarefaId: string, newStatus: StatusTarefa) => void
}

const COLUMNS: StatusTarefa[] = [
  "BACKLOG",
  "A_FAZER",
  "EM_PROGRESSO",
  "REVISAO",
  "CONCLUIDA",
  "CANCELADA",
]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface KanbanCardProps {
  tarefa: Tarefa
  onClick: () => void
  isDragging?: boolean
}

function KanbanCard({ tarefa, onClick, isDragging }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: tarefa.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const prioridadeCfg = PRIORIDADE_CONFIG[tarefa.prioridade]
  const isOverdue =
    tarefa.prazo &&
    tarefa.status !== "CONCLUIDA" &&
    tarefa.status !== "CANCELADA" &&
    isPast(parseISO(tarefa.prazo))

  const prioridadeBorderColor = {
    URGENTE: "border-l-red-500",
    ALTA: "border-l-orange-500",
    MEDIA: "border-l-yellow-500",
    BAIXA: "border-l-blue-500",
  }[tarefa.prioridade]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-background border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing border-l-4 shadow-sm hover:shadow-md transition-shadow",
        prioridadeBorderColor,
        isDragging && "shadow-lg rotate-2 scale-105"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Priority badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            prioridadeCfg.bg,
            prioridadeCfg.color
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", prioridadeCfg.dot)} />
          {prioridadeCfg.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground leading-snug mb-1.5 line-clamp-2">
        {tarefa.titulo}
      </h4>

      {/* Description */}
      {tarefa.descricao && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">
          {tarefa.descricao}
        </p>
      )}

      {/* Progress bar */}
      {tarefa.progresso > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Progresso</span>
            <span className="text-[10px] text-muted-foreground">{tarefa.progresso}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${tarefa.progresso}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {getInitials(tarefa.responsavel)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-2">
          {tarefa.comentariosCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {tarefa.comentariosCount}
            </span>
          )}
          {tarefa.anexosCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              {tarefa.anexosCount}
            </span>
          )}
          <span
            className={cn(
              "flex items-center gap-0.5 text-[10px]",
              isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            {tarefa.prazo ? format(parseISO(tarefa.prazo), "dd/MM", { locale: ptBR }) : "—"}
          </span>
        </div>
      </div>
    </div>
  )
}

interface KanbanColumnProps {
  status: StatusTarefa
  tarefas: Tarefa[]
  onSelectTarefa: (tarefa: Tarefa) => void
}

function KanbanColumn({ status, tarefas, onSelectTarefa }: KanbanColumnProps) {
  const cfg = STATUS_CONFIG[status]

  const columnTopBorder = {
    BACKLOG: "border-t-gray-400",
    A_FAZER: "border-t-blue-500",
    EM_PROGRESSO: "border-t-orange-500",
    REVISAO: "border-t-purple-500",
    CONCLUIDA: "border-t-green-500",
    CANCELADA: "border-t-red-500",
  }[status]

  return (
    <div
      className={cn(
        "flex flex-col bg-card border border-border rounded-xl min-h-[400px] w-[280px] flex-shrink-0 border-t-4",
        columnTopBorder
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", cfg.color)}>{cfg.label}</span>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            cfg.bg,
            cfg.color
          )}
        >
          {tarefas.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext
        items={tarefas.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2.5 p-2.5 flex-1 min-h-[100px]">
          {tarefas.map((tarefa) => (
            <KanbanCard
              key={tarefa.id}
              tarefa={tarefa}
              onClick={() => onSelectTarefa(tarefa)}
            />
          ))}
          {tarefas.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8">
              <span className="text-xs text-muted-foreground">Sem tarefas</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function TarefaKanbanView({
  tarefas: initialTarefas,
  onSelectTarefa,
  onUpdateStatus,
}: TarefaKanbanViewProps) {
  const [tarefas, setTarefas] = useState(initialTarefas)
  const [activeTarefa, setActiveTarefa] = useState<Tarefa | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function getTarefasByStatus(status: StatusTarefa) {
    return tarefas.filter((t) => t.status === status)
  }

  function handleDragStart(event: DragStartEvent) {
    const tarefa = tarefas.find((t) => t.id === event.active.id)
    setActiveTarefa(tarefa || null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if over a column status label
    const overStatus = COLUMNS.find((s) => s === overId)
    if (overStatus) {
      setTarefas((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overStatus } : t
        )
      )
      return
    }

    // Over another card - find its column
    const overTarefa = tarefas.find((t) => t.id === overId)
    if (!overTarefa) return

    const activeTar = tarefas.find((t) => t.id === activeId)
    if (!activeTar) return

    if (activeTar.status !== overTarefa.status) {
      setTarefas((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTarefa.status } : t
        )
      )
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active } = event
    const tarefa = tarefas.find((t) => t.id === active.id)
    if (tarefa && onUpdateStatus) {
      onUpdateStatus(tarefa.id, tarefa.status)
    }
    setActiveTarefa(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tarefas={getTarefasByStatus(status)}
            onSelectTarefa={onSelectTarefa}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTarefa && (
          <div className="rotate-3 scale-105">
            <div
              className={cn(
                "bg-background border border-border rounded-lg p-3 shadow-2xl border-l-4",
                {
                  URGENTE: "border-l-red-500",
                  ALTA: "border-l-orange-500",
                  MEDIA: "border-l-yellow-500",
                  BAIXA: "border-l-blue-500",
                }[activeTarefa.prioridade]
              )}
            >
              <h4 className="text-sm font-medium text-foreground">{activeTarefa.titulo}</h4>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
