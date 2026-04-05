"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  X,
  CheckSquare,
  Square,
  Plus,
  Paperclip,
  Activity,
  Trash2,
  Send,
  FileText,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tarefa,
  StatusTarefa,
  PrioridadeTarefa,
  STATUS_CONFIG,
  PRIORIDADE_CONFIG,
  ChecklistItem,
  Usuario,
} from "./tarefas-types"
import { cn } from "@/lib/utils"

interface TarefaDetailPanelProps {
  tarefa: Tarefa | null
  open: boolean
  onClose: () => void
  onUpdate?: (tarefa: Tarefa) => void
  usuarios?: Usuario[]
}

type Tab = "detalhes" | "checklist" | "comentarios" | "anexos" | "atividades"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function TarefaDetailPanel({
  tarefa,
  open,
  onClose,
  onUpdate,
  usuarios = [],
}: TarefaDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("detalhes")
  const [editedTarefa, setEditedTarefa] = useState<Tarefa | null>(null)
  const [newCheckItem, setNewCheckItem] = useState("")
  const [newComment, setNewComment] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  // Sync local state with prop
  const current = editedTarefa && editedTarefa.id === tarefa?.id ? editedTarefa : tarefa

  if (!current) return null

  function update(fields: Partial<Tarefa>) {
    const updated = { ...current!, ...fields }
    setEditedTarefa(updated)
    onUpdate?.(updated)
  }

  function toggleCheckItem(itemId: string) {
    const updated = current!.checklist.map((item) =>
      item.id === itemId ? { ...item, concluido: !item.concluido } : item
    )
    update({ checklist: updated })
  }

  function addCheckItem() {
    if (!newCheckItem.trim()) return
    const newItem: ChecklistItem = {
      id: `ci-${Date.now()}`,
      texto: newCheckItem.trim(),
      concluido: false,
    }
    update({ checklist: [...current!.checklist, newItem] })
    setNewCheckItem("")
  }

  function removeCheckItem(itemId: string) {
    update({ checklist: current!.checklist.filter((i) => i.id !== itemId) })
  }

  function addComment() {
    if (!newComment.trim()) return
    const comment = {
      id: `cm-${Date.now()}`,
      autor: "Voce",
      texto: newComment.trim(),
      data: new Date().toISOString().split("T")[0],
    }
    update({
      comentarios: [...current!.comentarios, comment],
      comentariosCount: current!.comentariosCount + 1,
    })
    setNewComment("")
  }

  function handleResponsavelChange(userId: string) {
    const user = usuarios.find((u) => u.id === userId)
    update({
      responsavelId: userId,
      responsavel: user?.nome ?? "Sem responsavel",
    })
  }

  const completedCheckItems = current.checklist.filter((i) => i.concluido).length
  const totalCheckItems = current.checklist.length
  const checklistProgress = totalCheckItems > 0
    ? Math.round((completedCheckItems / totalCheckItems) * 100)
    : 0

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "detalhes", label: "Detalhes" },
    { id: "checklist", label: "Checklist", count: totalCheckItems },
    { id: "comentarios", label: "Comentarios", count: current.comentarios.length },
    { id: "anexos", label: "Anexos", count: current.anexos.length },
    { id: "atividades", label: "Atividades" },
  ]

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:w-[540px] sm:max-w-[540px] p-0 flex flex-col bg-background border-l border-border"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={current.titulo}
                  onChange={(e) => update({ titulo: e.target.value })}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                  className="text-base font-semibold border-primary"
                />
              ) : (
                <SheetTitle
                  className="text-base font-semibold text-foreground leading-snug cursor-text hover:bg-muted/50 px-1 rounded transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {current.titulo}
                </SheetTitle>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status + Priority badges */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                STATUS_CONFIG[current.status].bg,
                STATUS_CONFIG[current.status].color
              )}
            >
              {STATUS_CONFIG[current.status].label}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                PRIORIDADE_CONFIG[current.prioridade].bg,
                PRIORIDADE_CONFIG[current.prioridade].color
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", PRIORIDADE_CONFIG[current.prioridade].dot)} />
              {PRIORIDADE_CONFIG[current.prioridade].label}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {current.progresso}% concluido
            </span>
          </div>

          <Progress value={current.progresso} className="h-1.5 mt-1" />
        </SheetHeader>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border px-5 shrink-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Detalhes Tab */}
          {activeTab === "detalhes" && (
            <div className="p-5 space-y-4">
              {/* Descricao */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Descricao
                </Label>
                {isEditingDesc ? (
                  <Textarea
                    autoFocus
                    value={current.descricao}
                    onChange={(e) => update({ descricao: e.target.value })}
                    onBlur={() => setIsEditingDesc(false)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                ) : (
                  <p
                    className="text-sm text-foreground leading-relaxed cursor-text hover:bg-muted/50 p-2 rounded transition-colors min-h-[60px]"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    {current.descricao || (
                      <span className="text-muted-foreground italic">
                        Clique para adicionar descricao...
                      </span>
                    )}
                  </p>
                )}
              </div>

              <Separator />

              {/* Fields grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </Label>
                  <Select
                    value={current.status}
                    onValueChange={(v) => update({ status: v as StatusTarefa })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridade */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Prioridade
                  </Label>
                  <Select
                    value={current.prioridade}
                    onValueChange={(v) => update({ prioridade: v as PrioridadeTarefa })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORIDADE_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Responsavel */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Responsavel
                  </Label>
                  <Select
                    value={current.responsavelId ?? ""}
                    onValueChange={handleResponsavelChange}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prazo */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Prazo
                  </Label>
                  <Input
                    type="date"
                    value={current.prazo}
                    onChange={(e) => update({ prazo: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Data Inicio */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Data Inicio
                  </Label>
                  <Input
                    type="date"
                    value={current.dataInicio}
                    onChange={(e) => update({ dataInicio: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Estimativa */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Estimativa (h)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={current.estimativaHoras}
                    onChange={(e) =>
                      update({ estimativaHoras: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <Separator />

              {/* Hours info */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <p className="font-semibold text-foreground">{current.estimativaHoras}h</p>
                  <p className="text-xs text-muted-foreground">Estimativa</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{current.horasTrabalhadas}h</p>
                  <p className="text-xs text-muted-foreground">Trabalhadas</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    {Math.max(0, current.estimativaHoras - current.horasTrabalhadas)}h
                  </p>
                  <p className="text-xs text-muted-foreground">Restantes</p>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === "checklist" && (
            <div className="p-5 space-y-3">
              {totalCheckItems > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Progress value={checklistProgress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {completedCheckItems}/{totalCheckItems}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                {current.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 group p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <button
                      onClick={() => toggleCheckItem(item.id)}
                      className="shrink-0 text-primary hover:text-primary/80 transition-colors"
                    >
                      {item.concluido ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        item.concluido
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {item.texto}
                    </span>
                    <button
                      onClick={() => removeCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new item */}
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Adicionar item ao checklist..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8 w-8 p-0" onClick={addCheckItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Comentarios Tab */}
          {activeTab === "comentarios" && (
            <div className="p-5 space-y-4">
              {current.comentarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum comentario ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {current.comentarios.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(comment.autor)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground">
                            {comment.autor}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(parseISO(comment.data), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment */}
              <div className="flex gap-2 mt-4">
                <Textarea
                  placeholder="Escrever comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
                <Button
                  size="sm"
                  className="h-auto self-end px-3"
                  onClick={addComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Anexos Tab */}
          {activeTab === "anexos" && (
            <div className="p-5 space-y-3">
              {current.anexos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum anexo encontrado.
                </div>
              ) : (
                <div className="space-y-2">
                  {current.anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {anexo.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {anexo.tipo} · {anexo.tamanho}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Paperclip className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Arraste arquivos aqui ou{" "}
                  <span className="text-primary cursor-pointer hover:underline">
                    clique para selecionar
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Atividades Tab */}
          {activeTab === "atividades" && (
            <div className="p-5 space-y-3">
              {current.atividades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma atividade registrada.
                </div>
              ) : (
                <div className="space-y-2">
                  {current.atividades.map((at) => (
                    <div key={at.id} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Activity className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1 w-px bg-border" />
                      </div>
                      <div className="pb-3">
                        <p className="text-sm text-foreground">{at.acao}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {at.usuario} ·{" "}
                          {format(parseISO(at.data), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
