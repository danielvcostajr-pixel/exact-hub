"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Badge } from "@/components/ui/badge"
import { X, Calendar } from "lucide-react"

const participantesDisponiveis = [
  "Roberto Ferreira",
  "Carla Mendes",
  "Felipe Santos",
  "Daniel Vieira",
  "Ana Lima",
  "Marcos Oliveira",
]

interface FormReuniaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (data: ReuniaoFormData) => void
}

export interface ReuniaoFormData {
  titulo: string
  descricao: string
  dataHora: string
  duracaoMinutos: string
  tipo: "presencial" | "online"
  local: string
  link: string
  participantes: string[]
  pauta: string
  sincronizarCalendario: boolean
}

export function FormReuniao({ open, onOpenChange, onSave }: FormReuniaoProps) {
  const [form, setForm] = useState<ReuniaoFormData>({
    titulo: "",
    descricao: "",
    dataHora: "",
    duracaoMinutos: "60",
    tipo: "online",
    local: "",
    link: "",
    participantes: [],
    pauta: "",
    sincronizarCalendario: false,
  })

  const [participanteInput, setParticipanteInput] = useState("")

  const update = <K extends keyof ReuniaoFormData>(key: K, value: ReuniaoFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addParticipante = (nome: string) => {
    if (nome && !form.participantes.includes(nome)) {
      update("participantes", [...form.participantes, nome])
    }
    setParticipanteInput("")
  }

  const removeParticipante = (nome: string) => {
    update("participantes", form.participantes.filter((p) => p !== nome))
  }

  const handleSave = () => {
    if (!form.titulo || !form.dataHora) return
    onSave?.(form)
    onOpenChange(false)
    setForm({
      titulo: "",
      descricao: "",
      dataHora: "",
      duracaoMinutos: "60",
      tipo: "online",
      local: "",
      link: "",
      participantes: [],
      pauta: "",
      sincronizarCalendario: false,
    })
  }

  const suggestions = participantesDisponiveis.filter(
    (p) =>
      !form.participantes.includes(p) &&
      p.toLowerCase().includes(participanteInput.toLowerCase()) &&
      participanteInput.length > 0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="size-4 text-primary" />
            Nova Reuniao
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Titulo */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Titulo *</Label>
            <Input
              placeholder="Ex: Alinhamento mensal de resultados"
              value={form.titulo}
              onChange={(e) => update("titulo", e.target.value)}
              className="bg-background border-border"
            />
          </div>

          {/* Descricao */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Descricao</Label>
            <Textarea
              placeholder="Objetivo da reuniao..."
              value={form.descricao}
              onChange={(e) => update("descricao", e.target.value)}
              className="bg-background border-border resize-none"
              rows={2}
            />
          </div>

          {/* Data/Hora e Duracao */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Data e Hora *</Label>
              <Input
                type="datetime-local"
                value={form.dataHora}
                onChange={(e) => update("dataHora", e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Duracao</Label>
              <Select value={form.duracaoMinutos} onValueChange={(v) => update("duracaoMinutos", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h 30min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => update("tipo", v as "presencial" | "online")}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Local ou Link */}
          {form.tipo === "presencial" ? (
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Local</Label>
              <Input
                placeholder="Ex: Sala de reunioes - sede Campina Grande"
                value={form.local}
                onChange={(e) => update("local", e.target.value)}
                className="bg-background border-border"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Link da Reuniao</Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={form.link}
                onChange={(e) => update("link", e.target.value)}
                className="bg-background border-border"
              />
            </div>
          )}

          {/* Participantes */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Participantes</Label>
            <div className="relative">
              <Input
                placeholder="Buscar participante..."
                value={participanteInput}
                onChange={(e) => setParticipanteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && participanteInput) {
                    addParticipante(participanteInput)
                  }
                }}
                className="bg-background border-border"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => addParticipante(s)}
                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.participantes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.participantes.map((p) => (
                  <Badge key={p} variant="secondary" className="gap-1 pr-1 text-xs">
                    {p}
                    <button onClick={() => removeParticipante(p)} className="hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Pauta */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Pauta da Reuniao</Label>
            <Textarea
              placeholder="1. Revisao de resultados&#10;2. Definicao de proximas acoes&#10;3. ..."
              value={form.pauta}
              onChange={(e) => update("pauta", e.target.value)}
              className="bg-background border-border resize-none"
              rows={4}
            />
          </div>

          {/* Google Calendar */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
            <input
              type="checkbox"
              id="gcal"
              checked={form.sincronizarCalendario}
              onChange={(e) => update("sincronizarCalendario", e.target.checked)}
              className="size-4 accent-primary"
            />
            <label htmlFor="gcal" className="text-sm text-foreground cursor-pointer select-none">
              Sincronizar com Google Calendar
              <span className="ml-1 text-xs text-muted-foreground">(requer integracao configurada)</span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.titulo || !form.dataHora}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Criar Reuniao
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
