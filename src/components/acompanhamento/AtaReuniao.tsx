"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Trash2, FileText, CheckSquare, ListTodo } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Decisao {
  id: string
  descricao: string
  responsavel: string
}

interface ProximoPasso {
  id: string
  acao: string
  responsavel: string
  prazo: string
}

interface Reuniao {
  id: string
  titulo: string
  dataHora: string
  participantes: string[]
  pauta: string
}

interface AtaReuniaoProps {
  reuniao: Reuniao
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (rascunho: boolean) => void
}

const participantesOptions = [
  "Roberto Ferreira",
  "Daniel Vieira",
  "Carla Mendes",
  "Felipe Santos",
  "Ana Lima",
]

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export function AtaReuniao({ reuniao, open, onOpenChange, onSave }: AtaReuniaoProps) {
  const [pauta, setPauta] = useState(reuniao.pauta || "")
  const [discussao, setDiscussao] = useState("")
  const [decisoes, setDecisoes] = useState<Decisao[]>([
    { id: generateId(), descricao: "", responsavel: "" },
  ])
  const [proximosPassos, setProximosPassos] = useState<ProximoPasso[]>([
    { id: generateId(), acao: "", responsavel: "", prazo: "" },
  ])

  // Decisoes
  const addDecisao = () => setDecisoes((prev) => [...prev, { id: generateId(), descricao: "", responsavel: "" }])
  const removeDecisao = (id: string) => setDecisoes((prev) => prev.filter((d) => d.id !== id))
  const updateDecisao = (id: string, key: keyof Decisao, value: string) => {
    setDecisoes((prev) => prev.map((d) => (d.id === id ? { ...d, [key]: value } : d)))
  }

  // Proximos Passos
  const addPasso = () => setProximosPassos((prev) => [...prev, { id: generateId(), acao: "", responsavel: "", prazo: "" }])
  const removePasso = (id: string) => setProximosPassos((prev) => prev.filter((p) => p.id !== id))
  const updatePasso = (id: string, key: keyof ProximoPasso, value: string) => {
    setProximosPassos((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)))
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="size-4 text-primary" />
            Ata de Reuniao
          </DialogTitle>
        </DialogHeader>

        {/* Meeting Header */}
        <div className="rounded-lg bg-background border border-border p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground">{reuniao.titulo}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(reuniao.dataHora)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {reuniao.participantes.map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <Avatar className="size-6">
                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
                    {p.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 py-2">
          {/* Pauta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-primary/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">1</span>
              </div>
              <Label className="text-sm font-semibold text-foreground">Pauta</Label>
            </div>
            <Textarea
              value={pauta}
              onChange={(e) => setPauta(e.target.value)}
              placeholder="Pauta da reuniao..."
              className="bg-background border-border resize-none"
              rows={4}
            />
          </div>

          <Separator className="bg-border" />

          {/* Discussao */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-primary/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">2</span>
              </div>
              <Label className="text-sm font-semibold text-foreground">Discussao</Label>
            </div>
            <Textarea
              value={discussao}
              onChange={(e) => setDiscussao(e.target.value)}
              placeholder="Resuma os principais pontos discutidos na reuniao..."
              className="bg-background border-border resize-none"
              rows={5}
            />
          </div>

          <Separator className="bg-border" />

          {/* Decisoes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Decisoes</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addDecisao}
                className="h-7 text-xs border-border gap-1"
              >
                <Plus className="size-3" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {decisoes.map((d, index) => (
                <div key={d.id} className="flex gap-2 items-start">
                  <span className="text-xs text-muted-foreground mt-2.5 w-4 shrink-0">{index + 1}.</span>
                  <Input
                    placeholder="Descricao da decisao..."
                    value={d.descricao}
                    onChange={(e) => updateDecisao(d.id, "descricao", e.target.value)}
                    className="bg-background border-border text-sm flex-1"
                  />
                  <Select value={d.responsavel} onValueChange={(v) => updateDecisao(d.id, "responsavel", v)}>
                    <SelectTrigger className="w-40 bg-background border-border text-sm">
                      <SelectValue placeholder="Responsavel" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {participantesOptions.map((p) => (
                        <SelectItem key={p} value={p}>{p.split(" ")[0]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDecisao(d.id)}
                    disabled={decisoes.length === 1}
                    className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Proximos Passos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Proximos Passos</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addPasso}
                className="h-7 text-xs border-border gap-1"
              >
                <Plus className="size-3" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {proximosPassos.map((p, index) => (
                <div key={p.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-border">Acao {index + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePasso(p.id)}
                      disabled={proximosPassos.length === 1}
                      className="size-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Descricao da acao..."
                    value={p.acao}
                    onChange={(e) => updatePasso(p.id, "acao", e.target.value)}
                    className="bg-card border-border text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={p.responsavel} onValueChange={(v) => updatePasso(p.id, "responsavel", v)}>
                      <SelectTrigger className="bg-card border-border text-sm">
                        <SelectValue placeholder="Responsavel" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {participantesOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt.split(" ")[0]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={p.prazo}
                      onChange={(e) => updatePasso(p.id, "prazo", e.target.value)}
                      className="bg-card border-border text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border order-last sm:order-first"
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => { onSave?.(true); onOpenChange(false) }}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => { onSave?.(false); onOpenChange(false) }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <CheckSquare className="size-4" />
            Finalizar Ata
          </Button>
          <Button
            variant="secondary"
            onClick={() => { onSave?.(false); onOpenChange(false) }}
            className="gap-2"
          >
            <ListTodo className="size-4" />
            Criar Tarefas dos Proximos Passos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
