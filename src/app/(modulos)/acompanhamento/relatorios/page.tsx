"use client"

import { useState } from "react"
import { FileText, Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle, ArrowRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Tarefa {
  titulo: string
  status: "concluida" | "andamento"
}

interface Relatorio {
  id: string
  semanaInicio: string
  semanaFim: string
  status: "rascunho" | "finalizado"
  resumoExecutivo: string
  tarefasConcluidas: Tarefa[]
  tarefasAndamento: Tarefa[]
  problemas: string[]
  proximaSemana: string[]
}

const mockRelatorios: Relatorio[] = [
  {
    id: "1",
    semanaInicio: "2026-03-24",
    semanaFim: "2026-03-28",
    status: "finalizado",
    resumoExecutivo:
      "Semana produtiva com foco na entrega do modulo de analytics para a Geny Eletrodomesticos. As principais metas foram atingidas e o dashboard de vendas foi aprovado pelo cliente. Pequenos ajustes de layout foram solicitados e serao entregues na proxima iteracao.",
    tarefasConcluidas: [
      { titulo: "Dashboard de vendas — Geny (aprovado pelo cliente)", status: "concluida" },
      { titulo: "Mapeamento de processos logisticos — TechVision", status: "concluida" },
      { titulo: "Relatorio mensal de marco — Nordeste Distribuidora", status: "concluida" },
      { titulo: "Configuracao do ambiente de staging", status: "concluida" },
    ],
    tarefasAndamento: [
      { titulo: "Integracao API ClickUp — modulo de tarefas", status: "andamento" },
      { titulo: "Revisao dos OKRs — TechVision (aguardando feedback)", status: "andamento" },
    ],
    problemas: [
      "Atraso na entrega de dados pela equipe financeira da Geny — impacto de 2 dias no cronograma",
      "Ambiente de producao da TechVision indisponivel na quarta-feira — reuniao reagendada",
    ],
    proximaSemana: [
      "Finalizar integracao ClickUp e iniciar testes",
      "Workshop de processos TechVision — dia 15/04",
      "Revisao dos KPIs do Q2 com equipe interna",
      "Entrega dos ajustes do dashboard Geny",
    ],
  },
  {
    id: "2",
    semanaInicio: "2026-03-17",
    semanaFim: "2026-03-21",
    status: "finalizado",
    resumoExecutivo:
      "Semana dedicada ao kick-off de novos projetos e levantamento de requisitos. Tres novas empresas iniciaram processo de onboarding. O modulo de entrevistas foi utilizado com sucesso para estruturar o diagnostico inicial da Nordeste Distribuidora.",
    tarefasConcluidas: [
      { titulo: "Kick-off Projeto Analytics — equipe completa presente", status: "concluida" },
      { titulo: "Entrevistas de diagnostico — Nordeste Distribuidora (6 entrevistados)", status: "concluida" },
      { titulo: "Proposta comercial — novo cliente (aguardando assinatura)", status: "concluida" },
    ],
    tarefasAndamento: [
      { titulo: "Analise dos dados de entrevistas — Nordeste", status: "andamento" },
      { titulo: "Desenvolvimento dashboard vendas — Geny", status: "andamento" },
    ],
    problemas: [
      "Dificuldade no acesso aos dados historicos da Nordeste — solicitando apoio do TI deles",
    ],
    proximaSemana: [
      "Concluir analise de entrevistas Nordeste",
      "Primeira versao do dashboard Geny para aprovacao",
      "Mapeamento de processos TechVision",
    ],
  },
]

function formatWeek(inicio: string, fim: string) {
  const fmtDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  const fmtYear = (d: string) => new Date(d + "T12:00:00").getFullYear()
  return `${fmtDate(inicio)} — ${fmtDate(fim)}, ${fmtYear(fim)}`
}

function RelatorioCard({ relatorio }: { relatorio: Relatorio }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left flex items-center justify-between gap-4 p-5"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                Relatorio Semanal
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  relatorio.status === "finalizado"
                    ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                )}
              >
                {relatorio.status === "finalizado" ? "Finalizado" : "Rascunho"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{formatWeek(relatorio.semanaInicio, relatorio.semanaFim)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-green-500" />
              {relatorio.tarefasConcluidas.length} concluidas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-yellow-500" />
              {relatorio.tarefasAndamento.length} em andamento
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">
          {/* Resumo Executivo */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Resumo Executivo</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{relatorio.resumoExecutivo}</p>
          </div>

          <Separator className="bg-border" />

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Tarefas Concluidas */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-green-500" />
                Tarefas Concluidas ({relatorio.tarefasConcluidas.length})
              </h4>
              <ul className="space-y-1.5">
                {relatorio.tarefasConcluidas.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 rounded-full bg-green-500 shrink-0" />
                    {t.titulo}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tarefas em Andamento */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="size-3.5 text-yellow-500" />
                Em Andamento ({relatorio.tarefasAndamento.length})
              </h4>
              <ul className="space-y-1.5">
                {relatorio.tarefasAndamento.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 rounded-full bg-yellow-500 shrink-0" />
                    {t.titulo}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Problemas */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-red-500" />
                Problemas / Impedimentos
              </h4>
              {relatorio.problemas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum problema registrado</p>
              ) : (
                <ul className="space-y-1.5">
                  {relatorio.problemas.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 size-1.5 rounded-full bg-red-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Proxima Semana */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <ArrowRight className="size-3.5 text-primary" />
                Proxima Semana
              </h4>
              <ul className="space-y-1.5">
                {relatorio.proximaSemana.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RelatoriosPage() {
  const [relatorios] = useState<Relatorio[]>(mockRelatorios)

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Relatorios Semanais
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {relatorios.length} relatorio{relatorios.length !== 1 ? "s" : ""} registrado{relatorios.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="size-4" />
            Novo Relatorio
          </Button>
        </div>

        {/* Lista de relatorios */}
        <div className="space-y-3">
          {relatorios.map((r) => (
            <RelatorioCard key={r.id} relatorio={r} />
          ))}
        </div>

        {relatorios.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum relatorio registrado ainda</p>
            <p className="text-xs mt-1">Crie seu primeiro relatorio semanal</p>
          </div>
        )}
      </div>
    </div>
  )
}
