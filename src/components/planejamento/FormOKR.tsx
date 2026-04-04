'use client'

import { useState } from 'react'
import { Plus, Trash2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export interface KeyResultForm {
  id: string
  descricao: string
  metaInicial: number
  metaAlvo: number
  unidade: string
  responsavelId: string
}

export interface OKRFormData {
  objetivo: string
  descricao: string
  prazoInicio: string
  prazoFim: string
  responsavelId: string
  keyResults: KeyResultForm[]
}

interface FormOKRProps {
  open: boolean
  onClose: () => void
  onSave: (data: OKRFormData) => void
  initialData?: Partial<OKRFormData>
}

const RESPONSAVEIS = [
  { id: 'usr-1', nome: 'Ana Beatriz Costa' },
  { id: 'usr-2', nome: 'Carlos Eduardo Lima' },
  { id: 'usr-3', nome: 'Fernanda Oliveira' },
  { id: 'usr-4', nome: 'Rodrigo Mendes' },
  { id: 'usr-5', nome: 'Patricia Sousa' },
]

const UNIDADES = [
  '%', 'R$', 'un', 'dias', 'clientes', 'leads', 'contratos', 'NPS', 'h', 'pts',
]

function gerarId() {
  return Math.random().toString(36).substring(2, 10)
}

function krVazio(): KeyResultForm {
  return {
    id: gerarId(),
    descricao: '',
    metaInicial: 0,
    metaAlvo: 100,
    unidade: '%',
    responsavelId: '',
  }
}

export function FormOKR({ open, onClose, onSave, initialData }: FormOKRProps) {
  const [form, setForm] = useState<OKRFormData>({
    objetivo: initialData?.objetivo ?? '',
    descricao: initialData?.descricao ?? '',
    prazoInicio: initialData?.prazoInicio ?? '',
    prazoFim: initialData?.prazoFim ?? '',
    responsavelId: initialData?.responsavelId ?? '',
    keyResults: initialData?.keyResults ?? [krVazio()],
  })

  function handleField(field: keyof OKRFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleKRField(id: string, field: keyof KeyResultForm, value: string | number) {
    setForm((prev) => ({
      ...prev,
      keyResults: prev.keyResults.map((kr) =>
        kr.id === id ? { ...kr, [field]: value } : kr
      ),
    }))
  }

  function addKR() {
    setForm((prev) => ({
      ...prev,
      keyResults: [...prev.keyResults, krVazio()],
    }))
  }

  function removeKR(id: string) {
    setForm((prev) => ({
      ...prev,
      keyResults: prev.keyResults.filter((kr) => kr.id !== id),
    }))
  }

  function handleSubmit() {
    onSave(form)
    onClose()
  }

  const isValid =
    form.objetivo.trim().length > 0 &&
    form.prazoInicio.length > 0 &&
    form.prazoFim.length > 0 &&
    form.responsavelId.length > 0 &&
    form.keyResults.length > 0 &&
    form.keyResults.every((kr) => kr.descricao.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Target size={18} className="text-primary" />
            Novo OKR
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Objetivo */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-foreground text-sm font-medium">
              Objetivo <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ex: Tornar-se a loja mais lembrada da regiao"
              value={form.objetivo}
              onChange={(e) => handleField('objetivo', e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Descricao */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-foreground text-sm font-medium">Descricao</Label>
            <Textarea
              placeholder="Descreva o contexto e a motivacao deste objetivo..."
              value={form.descricao}
              onChange={(e) => handleField('descricao', e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground resize-none h-20"
            />
          </div>

          {/* Prazos e Responsavel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm font-medium">
                Inicio <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.prazoInicio}
                onChange={(e) => handleField('prazoInicio', e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm font-medium">
                Fim <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.prazoFim}
                onChange={(e) => handleField('prazoFim', e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm font-medium">
                Responsavel <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.responsavelId}
                onValueChange={(v) => handleField('responsavelId', v)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {RESPONSAVEIS.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-foreground">
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Key Results */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Key Results ({form.keyResults.length})
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addKR}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary gap-1.5 h-7 text-xs"
              >
                <Plus size={13} />
                Adicionar Key Result
              </Button>
            </div>

            {form.keyResults.map((kr, idx) => (
              <div
                key={kr.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    KR {idx + 1}
                  </span>
                  {form.keyResults.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeKR(kr.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">
                    Descricao <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: Aumentar NPS de 55 para 75 pontos"
                    value={kr.descricao}
                    onChange={(e) => handleKRField(kr.id, 'descricao', e.target.value)}
                    className="bg-card border-border text-foreground placeholder:text-muted-foreground text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-xs">Meta Inicial</Label>
                    <Input
                      type="number"
                      value={kr.metaInicial}
                      onChange={(e) =>
                        handleKRField(kr.id, 'metaInicial', parseFloat(e.target.value) || 0)
                      }
                      className="bg-card border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-xs">Meta Alvo</Label>
                    <Input
                      type="number"
                      value={kr.metaAlvo}
                      onChange={(e) =>
                        handleKRField(kr.id, 'metaAlvo', parseFloat(e.target.value) || 0)
                      }
                      className="bg-card border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-xs">Unidade</Label>
                    <Select
                      value={kr.unidade}
                      onValueChange={(v) => handleKRField(kr.id, 'unidade', v)}
                    >
                      <SelectTrigger className="bg-card border-border text-foreground text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {UNIDADES.map((u) => (
                          <SelectItem key={u} value={u} className="text-foreground">
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-xs">Responsavel</Label>
                    <Select
                      value={kr.responsavelId}
                      onValueChange={(v) => handleKRField(kr.id, 'responsavelId', v)}
                    >
                      <SelectTrigger className="bg-card border-border text-foreground text-sm">
                        <SelectValue placeholder="..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {RESPONSAVEIS.map((r) => (
                          <SelectItem key={r.id} value={r.id} className="text-foreground text-xs">
                            {r.nome.split(' ')[0]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>
          <Button
            disabled={!isValid}
            onClick={handleSubmit}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            Salvar OKR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
