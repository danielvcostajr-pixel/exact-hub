"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, CheckSquare, Square, Target, TrendingUp, ListChecks } from "lucide-react"
import { getOKRsByEmpresa, getPlanosAcaoByEmpresa } from "@/lib/api/data-service"
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
  Usuario,
} from "./tarefas-types"
import { cn } from "@/lib/utils"

function getPlanoIdFromAcao(acaoId: string, planos: PlanoOption[]): string {
  for (const p of planos) if (p.acoes.some((a) => a.id === acaoId)) return p.id
  return ""
}

interface FormTarefaProps {
  open: boolean
  onClose: () => void
  onSave: (tarefa: Omit<Tarefa, "id" | "comentarios" | "anexos" | "atividades" | "horasTrabalhadas" | "comentariosCount" | "anexosCount">) => void
  initialData?: Partial<Tarefa>
  usuarios?: Usuario[]
  empresaId?: string
}

interface OKROption {
  id: string
  objetivo: string
  keyResults: { id: string; descricao: string }[]
}

interface PlanoOption {
  id: string
  titulo: string
  acoes: { id: string; descricao: string }[]
}

const DEFAULT_FORM = {
  titulo: "",
  descricao: "",
  status: "A_FAZER" as StatusTarefa,
  prioridade: "MEDIA" as PrioridadeTarefa,
  responsavelId: "",
  dataInicio: new Date().toISOString().split("T")[0],
  prazo: "",
  estimativaHoras: 8,
  progresso: 0,
  okrId: "",
  keyResultId: "",
  acaoId: "",
  checklist: [] as ChecklistItem[],
}

export default function FormTarefa({
  open,
  onClose,
  onSave,
  initialData,
  usuarios = [],
  empresaId,
}: FormTarefaProps) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initialData })
  const [newCheckItem, setNewCheckItem] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [okrOptions, setOkrOptions] = useState<OKROption[]>([])
  const [planoOptions, setPlanoOptions] = useState<PlanoOption[]>([])

  // Carrega OKRs e Planos de Acao da empresa para os selects
  useEffect(() => {
    if (!open || !empresaId) return
    let cancelled = false
    async function load() {
      try {
        const [okrsRaw, planosRaw] = await Promise.all([
          getOKRsByEmpresa(empresaId!).catch(() => []),
          getPlanosAcaoByEmpresa(empresaId!).catch(() => []),
        ])
        if (cancelled) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOkrOptions((okrsRaw ?? []).map((o: any) => ({
          id: o.id,
          objetivo: o.objetivo,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          keyResults: (o.KeyResult ?? []).map((k: any) => ({ id: k.id, descricao: k.descricao })),
        })))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPlanoOptions((planosRaw ?? []).map((p: any) => ({
          id: p.id,
          titulo: p.titulo,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          acoes: (p.Acao ?? []).map((a: any) => ({ id: a.id, descricao: a.descricao })),
        })))
      } catch {
        // ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, empresaId])

  // Se OKR mudar, limpar keyResultId que nao pertence mais
  const okrSelecionado = okrOptions.find((o) => o.id === form.okrId)
  useEffect(() => {
    if (!form.okrId) return
    if (form.keyResultId && okrSelecionado) {
      const krValido = okrSelecionado.keyResults.some((k) => k.id === form.keyResultId)
      if (!krValido) setForm((p) => ({ ...p, keyResultId: "" }))
    }
  }, [form.okrId, form.keyResultId, okrSelecionado])

  const planoSelecionado = planoOptions.find((p) => p.id === getPlanoIdFromAcao(form.acaoId, planoOptions))

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
    if (!form.responsavelId) newErrors.responsavelId = "Responsavel e obrigatorio"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const selectedUser = usuarios.find((u) => u.id === form.responsavelId)
    onSave({
      titulo: form.titulo,
      descricao: form.descricao,
      status: form.status,
      prioridade: form.prioridade,
      responsavel: selectedUser?.nome ?? "",
      responsavelId: form.responsavelId,
      dataInicio: form.dataInicio,
      prazo: form.prazo,
      estimativaHoras: form.estimativaHoras,
      progresso: form.progresso,
      checklist: form.checklist,
      okrId: form.okrId || undefined,
      keyResultId: form.keyResultId || undefined,
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
                value={form.responsavelId ?? ''}
                onValueChange={(v) => updateField("responsavelId", v)}
              >
                <SelectTrigger className={cn(errors.responsavelId && "border-red-500")}>
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
              {errors.responsavelId && (
                <p className="text-xs text-red-500">{errors.responsavelId}</p>
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

          {/* Vinculos de planejamento — OKR / KR / Plano / Acao */}
          <div className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Vincular a planejamento (opcional)
            </p>

            {/* Linha OKR + Key Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Target size={11} />
                  Objetivo (OKR)
                </Label>
                <Select
                  value={form.okrId || "none"}
                  onValueChange={(v) => updateField("okrId", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um OKR..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {okrOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.objetivo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <TrendingUp size={11} />
                  Key Result
                </Label>
                <Select
                  value={form.keyResultId || "none"}
                  onValueChange={(v) => updateField("keyResultId", v === "none" ? "" : v)}
                  disabled={!form.okrId || !okrSelecionado || okrSelecionado.keyResults.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!form.okrId ? "Selecione um OKR antes" : "Selecione um KR..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (vincula ao OKR como um todo)</SelectItem>
                    {(okrSelecionado?.keyResults ?? []).map((kr) => (
                      <SelectItem key={kr.id} value={kr.id}>{kr.descricao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha Plano + Acao (alternativo ao OKR direto) */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ListChecks size={11} />
                Acao de Plano de Acao (alternativa)
              </Label>
              <Select
                value={form.acaoId || "none"}
                onValueChange={(v) => updateField("acaoId", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma acao..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {planoOptions.flatMap((p) =>
                    p.acoes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {p.titulo} — {a.descricao}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {planoSelecionado && (
                <p className="text-[10px] text-muted-foreground">
                  Plano: <span className="text-foreground">{planoSelecionado.titulo}</span>
                </p>
              )}
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
