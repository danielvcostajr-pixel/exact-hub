"use client"

import { useState } from "react"
import { Calendar, Plus, MapPin, Link2, Clock, Users, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormReuniao, type ReuniaoFormData } from "@/components/acompanhamento/FormReuniao"
import { AtaReuniao } from "@/components/acompanhamento/AtaReuniao"

type StatusReuniao = "AGENDADA" | "REALIZADA" | "CANCELADA"

interface Reuniao {
  id: string
  titulo: string
  descricao: string
  dataHora: string
  duracaoMinutos: number
  tipo: "presencial" | "online"
  local?: string
  link?: string
  participantes: string[]
  status: StatusReuniao
  pauta: string
}

const mockReunioes: Reuniao[] = [
  {
    id: "1",
    titulo: "Alinhamento Mensal — Geny",
    descricao: "Revisao dos resultados do mes e planejamento do proximo ciclo",
    dataHora: "2026-04-10T14:00",
    duracaoMinutos: 60,
    tipo: "online",
    link: "https://meet.google.com/abc-defg-hij",
    participantes: ["Roberto Ferreira", "Daniel Vieira", "Ana Lima"],
    status: "AGENDADA",
    pauta: "1. Revisao de resultados de marco\n2. KPIs do trimestre\n3. Proximas acoes",
  },
  {
    id: "2",
    titulo: "Workshop de Processos — TechVision",
    descricao: "Mapeamento dos processos internos de vendas",
    dataHora: "2026-04-15T09:00",
    duracaoMinutos: 120,
    tipo: "presencial",
    local: "Sede TechVision — Sala de Reunioes A",
    participantes: ["Carla Mendes", "Daniel Vieira", "Marcos Oliveira", "Felipe Santos"],
    status: "AGENDADA",
    pauta: "1. Apresentacao do metodo\n2. Mapeamento AS-IS\n3. Identificacao de gaps",
  },
  {
    id: "3",
    titulo: "Revisao de OKRs — Nordeste",
    descricao: "Acompanhamento trimestral dos OKRs definidos",
    dataHora: "2026-03-28T10:00",
    duracaoMinutos: 90,
    tipo: "online",
    link: "https://zoom.us/j/12345678",
    participantes: ["Felipe Santos", "Daniel Vieira"],
    status: "REALIZADA",
    pauta: "1. Status dos OKRs\n2. Indicadores de progresso\n3. Ajustes necessarios",
  },
  {
    id: "4",
    titulo: "Kick-off Projeto Analytics",
    descricao: "Reuniao inicial do projeto de analytics",
    dataHora: "2026-03-20T15:30",
    duracaoMinutos: 60,
    tipo: "presencial",
    local: "Escritorio Exact BI",
    participantes: ["Roberto Ferreira", "Carla Mendes", "Daniel Vieira", "Ana Lima", "Marcos Oliveira"],
    status: "REALIZADA",
    pauta: "1. Apresentacao da equipe\n2. Escopo do projeto\n3. Cronograma",
  },
]

const statusConfig: Record<StatusReuniao, { label: string; className: string }> = {
  AGENDADA: { label: "Agendada", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  REALIZADA: { label: "Realizada", className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
  CANCELADA: { label: "Cancelada", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" },
}

function formatDatetime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function ReuniaoCard({
  reuniao,
  onCriarAta,
  onCancelar,
}: {
  reuniao: Reuniao
  onCriarAta: (r: Reuniao) => void
  onCancelar: (id: string) => void
}) {
  const status = statusConfig[reuniao.status]

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm">{reuniao.titulo}</h3>
            <Badge variant="outline" className={`text-xs ${status.className}`}>
              {status.label}
            </Badge>
          </div>
          {reuniao.descricao && (
            <p className="text-xs text-muted-foreground">{reuniao.descricao}</p>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-primary shrink-0" />
          <span>{formatDatetime(reuniao.dataHora)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-primary shrink-0" />
          <span>{formatDuration(reuniao.duracaoMinutos)}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          {reuniao.tipo === "presencial" ? (
            <MapPin className="size-3.5 text-primary shrink-0" />
          ) : (
            <Link2 className="size-3.5 text-primary shrink-0" />
          )}
          <span className="truncate">{reuniao.local || reuniao.link || "—"}</span>
        </div>
      </div>

      {/* Participantes */}
      <div className="flex items-center gap-2">
        <Users className="size-3.5 text-muted-foreground shrink-0" />
        <div className="flex -space-x-1.5">
          {reuniao.participantes.slice(0, 5).map((p) => (
            <Avatar key={p} className="size-6 ring-2 ring-card">
              <AvatarFallback className="bg-primary/20 text-primary text-[9px] font-semibold">
                {getInitials(p)}
              </AvatarFallback>
            </Avatar>
          ))}
          {reuniao.participantes.length > 5 && (
            <div className="size-6 rounded-full bg-secondary ring-2 ring-card flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground font-medium">+{reuniao.participantes.length - 5}</span>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{reuniao.participantes.length} participante{reuniao.participantes.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Actions */}
      {(reuniao.status === "REALIZADA" || reuniao.status === "AGENDADA") && (
        <div className="flex gap-2 pt-1 border-t border-border">
          {reuniao.status === "REALIZADA" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCriarAta(reuniao)}
              className="gap-1.5 text-xs h-7 border-primary/40 text-primary hover:bg-primary/10"
            >
              <FileText className="size-3" />
              Criar Ata
            </Button>
          )}
          {reuniao.status === "AGENDADA" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCancelar(reuniao.id)}
              className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" />
              Cancelar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReunioesPage() {
  const [reunioes, setReunioes] = useState<Reuniao[]>(mockReunioes)
  const [formOpen, setFormOpen] = useState(false)
  const [ataReuniao, setAtaReuniao] = useState<Reuniao | null>(null)

  const proximas = reunioes.filter((r) => r.status === "AGENDADA")
  const realizadas = reunioes.filter((r) => r.status === "REALIZADA")
  const todas = reunioes

  const handleSaveReuniao = (data: ReuniaoFormData) => {
    const nova: Reuniao = {
      id: Math.random().toString(36).slice(2, 9),
      titulo: data.titulo,
      descricao: data.descricao,
      dataHora: data.dataHora,
      duracaoMinutos: parseInt(data.duracaoMinutos),
      tipo: data.tipo,
      local: data.local || undefined,
      link: data.link || undefined,
      participantes: data.participantes,
      status: "AGENDADA",
      pauta: data.pauta,
    }
    setReunioes((prev) => [nova, ...prev])
  }

  const handleCancelar = (id: string) => {
    setReunioes((prev) => prev.map((r) => r.id === id ? { ...r, status: "CANCELADA" } : r))
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Reunioes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {proximas.length} agendada{proximas.length !== 1 ? "s" : ""} · {realizadas.length} realizada{realizadas.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => setFormOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="size-4" />
            Nova Reuniao
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="proximas">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="proximas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Proximas ({proximas.length})
            </TabsTrigger>
            <TabsTrigger value="realizadas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Realizadas ({realizadas.length})
            </TabsTrigger>
            <TabsTrigger value="todas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Todas ({todas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="mt-4">
            {proximas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="size-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhuma reuniao agendada</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {proximas.map((r) => (
                  <ReuniaoCard key={r.id} reuniao={r} onCriarAta={setAtaReuniao} onCancelar={handleCancelar} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="realizadas" className="mt-4">
            {realizadas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="size-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhuma reuniao realizada</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {realizadas.map((r) => (
                  <ReuniaoCard key={r.id} reuniao={r} onCriarAta={setAtaReuniao} onCancelar={handleCancelar} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="todas" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {todas.map((r) => (
                <ReuniaoCard key={r.id} reuniao={r} onCriarAta={setAtaReuniao} onCancelar={handleCancelar} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <FormReuniao open={formOpen} onOpenChange={setFormOpen} onSave={handleSaveReuniao} />
      {ataReuniao && (
        <AtaReuniao
          reuniao={ataReuniao}
          open={!!ataReuniao}
          onOpenChange={(open) => { if (!open) setAtaReuniao(null) }}
        />
      )}
    </div>
  )
}
