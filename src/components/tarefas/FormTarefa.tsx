"use client"

import { useState } from "react"
import { Plus, Trash2, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tarefa,
  StatusTarefa,
  PrioridadeTarefa,
  STATUS_CONFIG,
  PRIORIDADE_CONFIG,
  ChecklistItem,
} from "./tarefas-types"
import { cn } from "@/lib/utils"

interface FormTarefaProps {
  open: boolean
  onClose: () => void
  onSave: (tarefa: Omit<Tarefa, "id" | "comentarios" | "anexos" | "atividades" | "horasTrabalhadas" | "comentariosCount" | "anexosCount">) => void
  initialData?: Partial<Tarefa>
}

const RESPONSAVEIS = ["Daniel Vieira", "Ana Silva", "Carlos Mendes", "Roberto Lima"]

const DEFAULT_FORM = {
  titulo: "",
  descricao: "",
  status: "A_FAZER" as StatusTarefa,
  prioridade: "MEDIA" as PrioridadeTarefa,
  responsavel: "Daniel Vieira",
  dataInicio: new Date().toISOString().split("T")[0],
  prazo: "",
  estimativaHoras: 8,
  progresso: 0,
  okrId: "",
  acaoId: "",
  checklist: [] as ChecklistItem[],
}

export default function FormTarefa({
  open,
  onClose,
  onSave,
  initialData,
}: FormTarefaProps) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initialData })
  const [newCheckItem, setNewCheckItem] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  function updateField<K extends keyof typeof DEFAULT_FORM>(
    key: K,
    value: (typeof DEFAULT_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }))
  }

  function addCheckItem() {
    if (!newCheckItem.trim()) return
    const item: ChecklistItem = {
      id: `ci-${Date.now()}`,
      texto: newCheckItem.trim(),
      concluido: false,
    }
    setForm((prev) => ({ ...prev, checklist: [...prev.checklist, item] }))
    setNewCheckItem("")
  }

  function removeCheckItem(id: string) {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((i) => i.id !== id),
    }))
  }

  function toggleCheckItem(id: string) {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((i) =>
        i.id === id ? { ...i, concluido: !i.concluido } : i
      ),
    }))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.titulo.trim()) newErrors.titulo = "Titulo e obrigatorio"
    if (!form.prazo) newErrors.prazo = "Prazo e obrigatorio"
    if (!form.responsavel) newErrors.responsavel = "Responsavel e obrigatorio"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      titulo: form.titulo,
      descricao: form.descricao,
      status: form.status,
      prioridade: form.prioridade,
      responsavel: form.responsavel,
      dataInicio: form.dataInicio,
      prazo: form.prazo,
      estimativaHoras: form.estimativaHoras,
      progresso: form.progresso,
      checklist: form.checklist,
      okrId: form.okrId || undefined,
      acaoId: form.acaoId || undefined,
    })
    setForm(DEFAULT_FORM)
    onClose()
  }

  function handleClose() {
    setForm(DEFAULT_FORM)
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nova Tarefa</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Titulo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Titulo <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ex: Renegociar contrato com fornecedor..."
              value={form.titulo}
              onChange={(e) => updateField("titulo", e.target.value)}
              className={cn(errors.titulo && "border-red-500")}
            />
            {errors.titulo && (
              <p className="text-xs text-red-500">{errors.titulo}</p>
            )}
          </div>

          {/* Descricao */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Descricao
            </Label>
            <Textarea
              placeholder="Descreva os objetivos e escopo da tarefa..."
              value={form.descricao}
              onChange={(e) => updateField("descricao", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Status + Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => updateField("status", v as StatusTarefa)}
              >
                <SelectTrigger>
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

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prioridade
              </Label>
              <Select
                value={form.prioridade}
                onValueChange={(v) => updateField("prioridade", v as PrioridadeTarefa)}
              >
                <SelectTrigger>
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
          </div>

          {/* Responsavel + Estimativa */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Responsavel <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.responsavel}
                onValueChange={(v) => updateField("responsavel", v)}
              >
                <SelectTrigger className={cn(errors.responsavel && "border-red-500")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSAVEIS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.responsavel && (
                <p className="text-xs text-red-500">{errors.responsavel}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Estimativa (horas)
              </Label>
              <Input
                type="number"
                min={0}
                value={form.estimativaHoras}
                onChange={(e) =>
                  updateField("estimativaHoras", parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Data de Inicio
              </Label>
              <Input
                type="date"
                value={form.dataInicio}
                onChange={(e) => updateField("dataInicio", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prazo <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.prazo}
                onChange={(e) => updateField("prazo", e.target.value)}
                className={cn(errors.prazo && "border-red-500")}
              />
              {errors.prazo && (
                <p className="text-xs text-red-500">{errors.prazo}</p>
              )}
            </div>
          </div>

          {/* Vinculos opcionais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                OKR Relacionado (opcional)
              </Label>
              <Input
                placeholder="ID do OKR..."
                value={form.okrId}
                onChange={(e) => updateField("okrId", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Acao Relacionada (opcional)
              </Label>
              <Input
                placeholder="ID da acao..."
                value={form.acaoId}
                onChange={(e) => updateField("acaoId", e.target.value)}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Checklist
            </Label>
            <div className="border border-border rounded-lg p-3 space-y-2">
              {form.checklist.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum item adicionado ainda.
                </p>
              )}
              {form.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() => toggleCheckItem(item.id)}
                    className="shrink-0 text-primary/60 hover:text-primary transition-colors"
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
                      item.concluido && "line-through text-muted-foreground"
                    )}
                  >
                    {item.texto}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCheckItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add item */}
              <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                <Input
                  placeholder="Adicionar item..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCheckItem())}
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={addCheckItem}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
          >
            Criar Tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
