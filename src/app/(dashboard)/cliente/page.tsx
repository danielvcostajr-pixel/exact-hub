"use client"

import {
  TrendingUp,
  Grid3x3,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type ModuleStatus = "complete" | "in_progress" | "pending"

interface Module {
  id: string
  title: string
  description: string
  icon: React.ElementType
  status: ModuleStatus
  progress: number
  href: string
  lastUpdate?: string
}

const modules: Module[] = [
  {
    id: "projecao",
    title: "Projecao Financeira",
    description: "Cenarios financeiros, DRE projetado e fluxo de caixa",
    icon: TrendingUp,
    status: "complete",
    progress: 100,
    href: "/cliente/projecao",
    lastUpdate: "3 dias atras",
  },
  {
    id: "canvas",
    title: "Canvas de Negocio",
    description: "Modelo de negocio, proposta de valor e segmentos",
    icon: Grid3x3,
    status: "in_progress",
    progress: 65,
    href: "/cliente/canvas",
    lastUpdate: "Ontem",
  },
  {
    id: "entrevistas",
    title: "Entrevistas",
    description: "Diagnostico organizacional e entrevistas com a equipe",
    icon: MessageSquare,
    status: "in_progress",
    progress: 40,
    href: "/cliente/entrevistas",
    lastUpdate: "Ha 2 dias",
  },
  {
    id: "memoria",
    title: "Memoria",
    description: "Base de conhecimento e historico da consultoria",
    icon: BookOpen,
    status: "pending",
    progress: 0,
    href: "/cliente/memoria",
    lastUpdate: undefined,
  },
]

const statusConfig: Record<ModuleStatus, {
  label: string
  badgeClass: string
  icon: React.ElementType
  iconClass: string
}> = {
  complete: {
    label: "Concluido",
    badgeClass: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: CheckCircle2,
    iconClass: "text-green-400",
  },
  in_progress: {
    label: "Em Andamento",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: Clock,
    iconClass: "text-primary",
  },
  pending: {
    label: "Pendente",
    badgeClass: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
    icon: Circle,
    iconClass: "text-muted-foreground",
  },
}

function getOverallProgress(mods: Module[]) {
  return Math.round(mods.reduce((acc, m) => acc + m.progress, 0) / mods.length)
}

export default function ClienteDashboard() {
  const overallProgress = getOverallProgress(modules)
  const completedCount = modules.filter((m) => m.status === "complete").length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Bem-vindo, Empresa
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Acompanhe o progresso da sua consultoria
        </p>
      </div>

      {/* Overall progress card */}
      <Card className="bg-card border-border ring-0 rounded-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#F17522] to-[#E85D0A]" style={{ width: `${overallProgress}%` }} />
        <CardContent className="px-6 py-5">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Progresso Geral do Projeto
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {completedCount} de {modules.length} modulos concluidos
                  </p>
                </div>
                <span className="text-3xl font-bold text-foreground font-numbers">
                  {overallProgress}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>

          {/* Module mini indicators */}
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
            {modules.map((mod) => {
              const config = statusConfig[mod.status]
              const StatusIcon = config.icon
              return (
                <div key={mod.id} className="flex items-center gap-1.5 text-xs">
                  <StatusIcon className={`size-3.5 ${config.iconClass}`} />
                  <span className="text-muted-foreground hidden sm:block">{mod.title}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Module cards grid */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">
          Modulos da Consultoria
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon
            const config = statusConfig[mod.status]
            const StatusIcon = config.icon

            return (
              <Card
                key={mod.id}
                className="bg-card border-border ring-0 rounded-xl hover:border-primary/20 transition-all cursor-pointer group"
              >
                <CardHeader className="px-5 pt-5 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${
                          mod.status === "complete"
                            ? "bg-green-400/10"
                            : mod.status === "in_progress"
                            ? "bg-primary/10"
                            : "bg-secondary"
                        }`}
                      >
                        <Icon
                          className={`size-5 ${
                            mod.status === "complete"
                              ? "text-green-400"
                              : mod.status === "in_progress"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {mod.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`shrink-0 text-[10px] h-auto py-0.5 px-2 border flex items-center gap-1 ${config.badgeClass}`}
                    >
                      <StatusIcon className="size-2.5" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-4">
                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Progresso</span>
                      <span className="text-xs font-semibold text-foreground font-numbers">
                        {mod.progress}%
                      </span>
                    </div>
                    <Progress value={mod.progress} className="h-1.5" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {mod.lastUpdate ? (
                      <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="size-3" />
                        {mod.lastUpdate}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">
                        Nao iniciado
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary gap-1"
                    >
                      {mod.status === "pending" ? "Iniciar" : "Acessar"}
                      <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Info card */}
      <Card className="bg-[#F17522]/5 border-[#F17522]/15 ring-0 rounded-xl">
        <CardContent className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F17522]/10 shrink-0 mt-0.5">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Consultoria em andamento
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Seu consultor esta ativo e acompanhando seu projeto. Entre em contato
                para agendar a proxima reuniao de alinhamento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
