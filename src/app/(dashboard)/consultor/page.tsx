"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  CheckSquare,
  Clock,
  Calendar,
  ArrowUpRight,
  AlertCircle,
  Play,
  Square,
  ChevronRight,
  Timer,
  Building2,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Target,
  LayoutGrid,
  ListTodo,
  BarChart2,
  Plus,
  MoreHorizontal,
  Trash2,
  Loader2,
  FileText,
  DollarSign,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Area,
  Line,
  ComposedChart,
  CartesianGrid,
} from "recharts"
import { useClienteContext, ClienteInfo } from "@/hooks/useClienteContext"
import { createEmpresa, deleteEmpresa, getProjecaoByEmpresa, getCanvasByEmpresa, getOKRsByEmpresa, getReunioesByEmpresa, getTarefasByEmpresa, getAllTimesheet } from "@/lib/api/data-service"
import { cn } from "@/lib/utils"
import { gerarResultadoProfecia, calcularKPIs, formatarMoeda, MESES } from "@/lib/calculations/financeiro"
import { gerarProjecaoCenarios, getFaturamentoCenario } from "@/lib/calculations/cenarios"
import type { ProjecaoFinanceiraCompleta, BlocoCanvas, CanvasCard as CanvasCardType } from "@/types"
import type { OKR, KeyResult } from "@/components/planejamento/OKRCard"

// ─── Types ────────────────────────────────────────────────────────────────

type Phase = "DIAGNOSTICO" | "PLANEJAMENTO" | "EXECUCAO" | "ACOMPANHAMENTO"

interface Client {
  id: string
  name: string
  initials: string
  progress: number
  pendingItems: number
  lastActivity: string
  phase: Phase
  horasWeek?: number
  okrTotal?: number
  okrConcluidos?: number
}

function mapClienteToClient(c: ClienteInfo): Client {
  const faseMap: Record<string, Phase> = {
    "Diagnostico": "DIAGNOSTICO",
    "Planejamento": "PLANEJAMENTO",
    "Execucao": "EXECUCAO",
    "Acompanhamento": "ACOMPANHAMENTO",
  }
  return {
    id: c.id,
    name: c.nome,
    initials: c.initials,
    progress: 0,
    pendingItems: 0,
    lastActivity: "-",
    phase: faseMap[c.fase] ?? "DIAGNOSTICO",
    horasWeek: 0,
    okrTotal: 0,
    okrConcluidos: 0,
  }
}

type Priority = "Alta" | "Media" | "Baixa"
type TaskStatus = "Atrasada" | "Hoje" | "Esta Semana" | "Proxima Semana"

interface Task {
  id: string
  name: string
  client: string
  clientId: string
  priority: Priority
  deadline: string
  deadlineDate: Date
  status: TaskStatus
}

const today = new Date()
const d = (offsetDays: number) => {
  const dt = new Date(today)
  dt.setDate(dt.getDate() + offsetDays)
  return dt
}
const fmt = (dt: Date) =>
  dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })

// Tasks and hours are loaded from Supabase dynamically in each view

// ─── Phase Config ──────────────────────────────────────────────────────────────

const phaseConfig: Record<Phase, { label: string; border: string; badge: string; text: string; bg: string }> = {
  DIAGNOSTICO:    { label: "Diagnostico",    border: "border-t-orange-500",  badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", text: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-500/8" },
  PLANEJAMENTO:   { label: "Planejamento",   border: "border-t-blue-500",    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",         text: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-500/8" },
  EXECUCAO:       { label: "Execucao",       border: "border-t-green-500",   badge: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",     text: "text-green-600 dark:text-green-400",    bg: "bg-green-500/8" },
  ACOMPANHAMENTO: { label: "Acompanhamento", border: "border-t-purple-500",  badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", text: "text-purple-600 dark:text-purple-400",  bg: "bg-purple-500/8" },
}

const phases: Phase[] = ["DIAGNOSTICO", "PLANEJAMENTO", "EXECUCAO", "ACOMPANHAMENTO"]

// ─── Priority Config ───────────────────────────────────────────────────────────

const priorityConfig: Record<Priority, string> = {
  Alta:  "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  Media: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  Baixa: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
}

type FilterKey = "Hoje" | "Esta Semana" | "Atrasadas" | "Todas"

type FocusTab = "visao-geral" | "projecao" | "canvas" | "okrs" | "tarefas" | "chat"

// ─── Sub-components ────────────────────────────────────────────────────────────

function ClientPipelineCard({ client, onDelete }: { client: Client; onDelete?: (id: string) => void }) {
  return (
    <div className="bg-background border border-border rounded-lg p-3 hover:border-primary/30 transition-colors cursor-pointer group space-y-2.5">
      <div className="flex items-center gap-2">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-[11px] font-bold bg-primary/15 text-primary">
            {client.initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight truncate flex-1">
          {client.name}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 cursor-pointer gap-2"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(client.id)
              }}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold text-foreground">{client.progress}%</span>
        </div>
        <Progress value={client.progress} className="h-1" />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className={`flex items-center gap-1 ${client.pendingItems > 5 ? "text-red-500" : ""}`}>
          <CheckSquare className="size-3" />
          {client.pendingItems} pendentes
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {client.lastActivity}
        </span>
      </div>
    </div>
  )
}

function TasksTable({ tasks }: { tasks: Task[] }) {
  const [taskFilter, setTaskFilter] = useState<FilterKey>("Todas")

  const filtered =
    taskFilter === "Todas"
      ? tasks
      : taskFilter === "Atrasadas"
      ? tasks.filter((t) => t.status === "Atrasada")
      : tasks.filter((t) => t.status === taskFilter)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {(["Hoje", "Esta Semana", "Atrasadas", "Todas"] as FilterKey[]).map((f) => (
          <button
            key={f}
            onClick={() => setTaskFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              taskFilter === f
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground border-border hover:border-primary/20 hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Tarefa</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Cliente</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 hidden md:table-cell">Prioridade</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Prazo</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 hidden lg:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma tarefa para o filtro selecionado
                </td>
              </tr>
            ) : (
              filtered.slice(0, 10).map((task) => {
                const isOverdue = task.status === "Atrasada"
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors hover:bg-secondary/30",
                      isOverdue && "bg-red-500/5"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isOverdue && <AlertCircle className="size-3.5 text-red-500 shrink-0" />}
                        <span className={`font-medium text-[13px] ${isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                          {task.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[13px] text-muted-foreground">{task.client}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge className={`text-[10px] h-auto py-0.5 px-2 border ${priorityConfig[task.priority]}`}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[13px] font-medium ${isOverdue ? "text-red-500" : "text-foreground"}`}>
                        {task.deadline}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        isOverdue
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : task.status === "Hoje"
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Mini Preview: Projecao ──────────────────────────────────────────────────

function MiniProjecaoPreview({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projecaoRaw, setProjecaoRaw] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getProjecaoByEmpresa(clientId)
        if (!cancelled) setProjecaoRaw(data)
      } catch (err) {
        console.error("Erro ao carregar projecao:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!projecaoRaw?.dados) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
          <BarChart2 className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhuma projecao cadastrada</p>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Acesse a pagina de Projecao Financeira para criar o PROFECIA de {clientName}.
        </p>
        <Link href="/projecao-financeira">
          <Button variant="outline" size="sm" className="gap-2 mt-1">
            Criar Projecao <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    )
  }

  // Calculate results from saved data
  const dados = projecaoRaw.dados as ProjecaoFinanceiraCompleta
  let resultado
  let kpis
  try {
    // Generate 12-month projection from historical data (same logic as the full page)
    const anoProjecao = (dados.anoBase ?? new Date().getFullYear())
    const projecoes = gerarProjecaoCenarios({
      historico: dados.premissasVendas?.historico ?? [],
      anoProjecao,
      taxaCrescimentoBase: dados.premissasVendas?.taxaCrescimentoBase ?? 0,
      cenarios: dados.premissasVendas?.cenarios ?? { pessimista: -14, realista: 0, otimista: 16, agressivo: 30, ativo: 'realista' },
    })
    const faturamentoMensal = getFaturamentoCenario(projecoes, dados.premissasVendas?.cenarios?.ativo ?? 'realista')

    resultado = gerarResultadoProfecia({
      projecao: dados,
      faturamentoMensal,
    })
    kpis = calcularKPIs({
      resultado,
      faturamentoMensal,
      metaPERS: dados.metaPERs ?? 0,
      metaPEPerc: dados.metaPEPerc ?? 0,
    })
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertTriangle className="size-5 text-yellow-500" />
        <p className="text-sm text-muted-foreground">Dados insuficientes para gerar projecao</p>
        <Link href="/projecao-financeira">
          <Button variant="outline" size="sm" className="gap-2">
            Completar Projecao <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    )
  }

  // Chart data
  const chartData = MESES.map((mes, i) => ({
    mes,
    saldoFinal: resultado.saldoFinal[i],
    geracaoAcumulada: resultado.geracaoAcumulada[i],
  }))

  const totalEntradas = resultado.totalEntradas.reduce((a, b) => a + b, 0)
  const totalSaidas = resultado.totalSaidas.reduce((a, b) => a + b, 0)
  const geracaoTotal = resultado.geracaoCaixa.reduce((a, b) => a + b, 0)
  const saldoFinalUltimo = resultado.saldoFinal[11]
  const exposicaoMax = Math.min(...resultado.saldoFinal)

  return (
    <div className="space-y-5">
      {/* Mini KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Total Entradas", value: formatarMoeda(totalEntradas), color: "text-green-500", icon: TrendingUp, iconBg: "bg-green-500/10" },
          { label: "Total Saidas", value: formatarMoeda(totalSaidas), color: "text-red-500", icon: TrendingDown, iconBg: "bg-red-500/10" },
          { label: "Geracao de Caixa", value: formatarMoeda(geracaoTotal), color: geracaoTotal >= 0 ? "text-green-500" : "text-red-500", icon: DollarSign, iconBg: geracaoTotal >= 0 ? "bg-green-500/10" : "bg-red-500/10" },
          { label: "Saldo Final Dez", value: formatarMoeda(saldoFinalUltimo), color: saldoFinalUltimo >= 0 ? "text-blue-500" : "text-red-500", icon: BarChart2, iconBg: "bg-blue-500/10" },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="rounded-xl">
              <CardContent className="px-3 pt-3 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</span>
                    <span className={cn("text-lg font-bold font-numbers", kpi.color)}>{kpi.value}</span>
                  </div>
                  <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0", kpi.iconBg)}>
                    <Icon className={cn("size-4", kpi.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Exposure alert */}
      {exposicaoMax < 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="size-4 text-red-500 shrink-0" />
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            Exposicao maxima de caixa: {formatarMoeda(exposicaoMax)} — risco de liquidez
          </span>
        </div>
      )}

      {/* Mini Cash Flow Chart */}
      <Card className="rounded-xl">
        <CardHeader className="px-5 pt-4 pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground">
            Fluxo de Caixa Projetado
          </CardTitle>
          <Link href="/projecao-financeira" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            Ver completo <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="px-3 pb-4 pt-0">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`
                  return `${v}`
                }}
              />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px", color: "var(--foreground)" }}
                formatter={(v: number) => [formatarMoeda(v)]}
              />
              <Area type="monotone" dataKey="saldoFinal" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} name="Saldo Final" />
              <Line type="monotone" dataKey="geracaoAcumulada" stroke="#10B981" strokeWidth={2} dot={false} name="Geracao Acumulada" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Mini Preview: Canvas ────────────────────────────────────────────────────

const CANVAS_BLOCKS: { key: BlocoCanvas; label: string; icon: string; color: string }[] = [
  { key: "parceiros", label: "Parceiros", icon: "🤝", color: "#8B5CF6" },
  { key: "atividades", label: "Atividades", icon: "⚙️", color: "#3B82F6" },
  { key: "recursos", label: "Recursos", icon: "🔧", color: "#06B6D4" },
  { key: "proposta", label: "Proposta de Valor", icon: "💎", color: "#F17522" },
  { key: "relacionamento", label: "Relacionamento", icon: "💬", color: "#10B981" },
  { key: "canais", label: "Canais", icon: "📡", color: "#F59E0B" },
  { key: "segmentos", label: "Segmentos", icon: "👥", color: "#EF4444" },
  { key: "custos", label: "Custos", icon: "💸", color: "#EC4899" },
  { key: "receitas", label: "Receitas", icon: "💰", color: "#10B981" },
]

function MiniCanvasPreview({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [canvasData, setCanvasData] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getCanvasByEmpresa(clientId)
        if (!cancelled) setCanvasData(data)
      } catch (err) {
        console.error("Erro ao carregar canvas:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canvasData?.blocos) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
          <Target className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhum Canvas cadastrado</p>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Acesse o Canvas de Negocio para modelar {clientName}.
        </p>
        <Link href="/canvas-negocio">
          <Button variant="outline" size="sm" className="gap-2 mt-1">
            Criar Canvas <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    )
  }

  const blocos = canvasData.blocos as Record<BlocoCanvas, CanvasCardType[]>
  const totalCards = Object.values(blocos).reduce((sum, cards) => sum + (Array.isArray(cards) ? cards.length : 0), 0)
  const filledBlocks = Object.values(blocos).filter((cards) => Array.isArray(cards) && cards.length > 0).length

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{filledBlocks}</span>/9 blocos preenchidos
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{totalCards}</span> itens no total
          </span>
        </div>
        <Link href="/canvas-negocio" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          Editar Canvas <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* Mini Canvas Grid - Business Model Canvas layout */}
      <div className="grid grid-cols-5 grid-rows-3 gap-2 min-h-[340px]">
        {/* Row 1: Partners | Activities | Value Prop | Relationships | Segments */}
        {/* Row 2: Partners | Resources  | Value Prop | Channels      | Segments */}
        {/* Row 3: Costs (span 2.5) | Revenue (span 2.5)                         */}
        {(
          [
            { key: "parceiros" as BlocoCanvas, row: "row-span-2", col: "col-span-1" },
            { key: "atividades" as BlocoCanvas, row: "row-span-1", col: "col-span-1" },
            { key: "proposta" as BlocoCanvas, row: "row-span-2", col: "col-span-1" },
            { key: "relacionamento" as BlocoCanvas, row: "row-span-1", col: "col-span-1" },
            { key: "segmentos" as BlocoCanvas, row: "row-span-2", col: "col-span-1" },
            { key: "recursos" as BlocoCanvas, row: "row-span-1", col: "col-span-1", gridArea: "2/2/3/3" },
            { key: "canais" as BlocoCanvas, row: "row-span-1", col: "col-span-1", gridArea: "2/4/3/5" },
          ] as { key: BlocoCanvas; row: string; col: string; gridArea?: string }[]
        ).map(({ key, row, col, gridArea }) => {
          const cfg = CANVAS_BLOCKS.find((b) => b.key === key)!
          const cards = Array.isArray(blocos[key]) ? blocos[key] : []
          return (
            <div
              key={key}
              className={cn("rounded-lg border border-border p-2 overflow-hidden", row, col)}
              style={gridArea ? { gridArea } : undefined}
            >
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs">{cfg.icon}</span>
                <span className="text-[10px] font-semibold text-muted-foreground truncate">{cfg.label}</span>
                <Badge className="text-[9px] h-4 px-1 ml-auto border-border" variant="outline">{cards.length}</Badge>
              </div>
              <div className="space-y-1">
                {cards.slice(0, 3).map((card) => (
                  <div key={card.id} className="text-[10px] text-foreground bg-secondary/60 rounded px-1.5 py-0.5 truncate">
                    {card.texto}
                  </div>
                ))}
                {cards.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">+{cards.length - 3} mais</span>
                )}
              </div>
            </div>
          )
        })}
        {/* Bottom row: Costs & Revenue */}
        {(["custos", "receitas"] as BlocoCanvas[]).map((key) => {
          const cfg = CANVAS_BLOCKS.find((b) => b.key === key)!
          const cards = Array.isArray(blocos[key]) ? blocos[key] : []
          const span = key === "custos" ? "3/1/4/3" : "3/3/4/6"
          return (
            <div key={key} className="rounded-lg border border-border p-2 overflow-hidden" style={{ gridArea: span }}>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs">{cfg.icon}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{cfg.label}</span>
                <Badge className="text-[9px] h-4 px-1 ml-auto border-border" variant="outline">{cards.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {cards.slice(0, 4).map((card) => (
                  <div key={card.id} className="text-[10px] text-foreground bg-secondary/60 rounded px-1.5 py-0.5 truncate max-w-[140px]">
                    {card.texto}
                  </div>
                ))}
                {cards.length > 4 && (
                  <span className="text-[9px] text-muted-foreground">+{cards.length - 4}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mini Preview: OKRs ──────────────────────────────────────────────────────

function MiniOKRsPreview({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [loading, setLoading] = useState(true)
  const [okrs, setOkrs] = useState<OKR[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getOKRsByEmpresa(clientId)
        if (!cancelled && data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: OKR[] = data.map((d: any) => ({
            id: d.id,
            objetivo: d.objetivo,
            descricao: d.descricao ?? "",
            status: d.status ?? "Ativo",
            prazoInicio: d.prazoInicio ?? "",
            prazoFim: d.prazoFim ?? "",
            responsavelId: d.responsavelId ?? "",
            responsavelNome: d.responsavelNome ?? "",
            keyResults: (d.KeyResult ?? []).map((kr: KeyResult) => ({
              id: kr.id,
              descricao: kr.descricao,
              metaInicial: kr.metaInicial ?? 0,
              metaAlvo: kr.metaAlvo ?? 100,
              valorAtual: kr.valorAtual ?? 0,
              unidade: kr.unidade ?? "%",
              responsavelId: kr.responsavelId ?? "",
              responsavelNome: kr.responsavelNome ?? "",
            })),
          }))
          setOkrs(mapped)
        }
      } catch (err) {
        console.error("Erro ao carregar OKRs:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (okrs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
          <TrendingUp className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhum OKR cadastrado</p>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Defina objetivos e metas para {clientName}.
        </p>
        <Link href="/planejamento/okrs">
          <Button variant="outline" size="sm" className="gap-2 mt-1">
            Criar OKR <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    )
  }

  function calcKRProgress(kr: KeyResult): number {
    const range = kr.metaAlvo - kr.metaInicial
    if (range === 0) return 100
    return Math.min(100, Math.max(0, ((kr.valorAtual - kr.metaInicial) / range) * 100))
  }

  function calcOKRProgress(okr: OKR): number {
    if (okr.keyResults.length === 0) return 0
    return Math.round(okr.keyResults.reduce((acc, kr) => acc + calcKRProgress(kr), 0) / okr.keyResults.length)
  }

  const ativos = okrs.filter((o) => o.status === "Ativo")
  const concluidos = okrs.filter((o) => o.status === "Concluido")
  const avgProgress = ativos.length > 0
    ? Math.round(ativos.reduce((sum, o) => sum + calcOKRProgress(o), 0) / ativos.length)
    : 0

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{ativos.length}</span> ativos
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{concluidos.length}</span> concluidos
          </span>
          <span className="text-xs text-muted-foreground">
            Progresso medio: <span className="font-semibold text-foreground">{avgProgress}%</span>
          </span>
        </div>
        <Link href="/planejamento/okrs" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          Ver todos <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* OKR List */}
      <div className="space-y-3">
        {okrs.slice(0, 5).map((okr) => {
          const progress = calcOKRProgress(okr)
          const barColor = progress >= 70 ? "bg-green-500" : progress >= 30 ? "bg-orange-500" : "bg-red-500"
          const textColor = progress >= 70 ? "text-green-500" : progress >= 30 ? "text-orange-500" : "text-red-500"
          const statusStyle: Record<string, string> = {
            Ativo: "bg-blue-500/15 text-blue-500 border-blue-500/30",
            Concluido: "bg-green-500/15 text-green-500 border-green-500/30",
            Rascunho: "bg-secondary text-muted-foreground border-border",
            Cancelado: "bg-red-500/15 text-red-500 border-red-500/30",
          }

          return (
            <Card key={okr.id} className="rounded-xl">
              <CardContent className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", statusStyle[okr.status] ?? statusStyle.Ativo)}>
                        {okr.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{okr.keyResults.length} KRs</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{okr.objetivo}</p>
                  </div>
                  <span className={cn("text-lg font-bold tabular-nums shrink-0", textColor)}>{progress}%</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${progress}%` }} />
                </div>
                {/* KR summary */}
                {okr.keyResults.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                    {okr.keyResults.slice(0, 3).map((kr) => {
                      const krPct = Math.round(calcKRProgress(kr))
                      return (
                        <span key={kr.id} className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {kr.descricao.slice(0, 40)}{kr.descricao.length > 40 ? "..." : ""} — <span className="font-semibold text-foreground">{krPct}%</span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {okrs.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">+{okrs.length - 5} OKRs adicionais</p>
        )}
      </div>
    </div>
  )
}

// ─── Mini Preview: Reunioes / Chat ───────────────────────────────────────────

function MiniReunioesPreview({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reunioes, setReunioes] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getReunioesByEmpresa(clientId)
        if (!cancelled) setReunioes(data ?? [])
      } catch (err) {
        console.error("Erro ao carregar reunioes:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (reunioes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
          <MessageSquare className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhuma reuniao registrada</p>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Registre reunioes e acompanhe {clientName}.
        </p>
        <Link href="/acompanhamento/reunioes">
          <Button variant="outline" size="sm" className="gap-2 mt-1">
            Agendar Reuniao <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{reunioes.length}</span> reunioes registradas
        </span>
        <Link href="/acompanhamento/reunioes" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          Ver todas <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {reunioes.slice(0, 6).map((r) => {
          const dt = r.dataHora ? new Date(r.dataHora) : null
          return (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                <FileText className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.titulo ?? r.tipo ?? "Reuniao"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {dt ? dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Sem data"}
                  {r.status && <span className="ml-2">{r.status}</span>}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick links */}
      <div className="flex gap-2">
        <Link href="/acompanhamento/chat" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
            <MessageSquare className="size-3.5" />
            Chat
          </Button>
        </Link>
        <Link href="/memoria-cliente" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
            <FileText className="size-3.5" />
            Memoria
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ─── Focused Client View ───────────────────────────────────────────────────────

function ClientFocusedView({ clientId }: { clientId: string }) {
  const { clientes } = useClienteContext()
  const [activeTab, setActiveTab] = useState<FocusTab>("visao-geral")
  const [okrSummary, setOkrSummary] = useState({ total: 0, concluidos: 0 })

  const clienteInfo = clientes.find((c) => c.id === clientId)
  const client = clienteInfo ? mapClienteToClient(clienteInfo) : null

  // Fetch OKR counts for the header stats
  useEffect(() => {
    async function loadOKRSummary() {
      try {
        const data = await getOKRsByEmpresa(clientId)
        if (data) {
          setOkrSummary({
            total: data.length,
            concluidos: data.filter((d: { status?: string }) => d.status === "Concluido").length,
          })
        }
      } catch { /* ignore */ }
    }
    loadOKRSummary()
  }, [clientId])

  if (!client) return null

  const [realTasks, setRealTasks] = useState<Task[]>([])

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await getTarefasByEmpresa(clientId)
        if (data) {
          const now = new Date()
          const mapped: Task[] = data.map((t: { id: string; titulo: string; empresaId: string; prioridade?: string; prazo?: string; status?: string }) => {
            const prazoDate = t.prazo ? new Date(t.prazo) : null
            const prioMap: Record<string, Priority> = { URGENTE: "Alta", ALTA: "Alta", MEDIA: "Media", BAIXA: "Baixa" }
            let taskStatus: TaskStatus = "Proxima Semana"
            if (prazoDate) {
              const diff = Math.floor((prazoDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              if (diff < 0) taskStatus = "Atrasada"
              else if (diff === 0) taskStatus = "Hoje"
              else if (diff <= 7) taskStatus = "Esta Semana"
            }
            if (t.status === "CONCLUIDA") taskStatus = "Proxima Semana"
            return {
              id: t.id,
              name: t.titulo,
              client: client?.name ?? "",
              clientId: t.empresaId,
              priority: prioMap[t.prioridade ?? "MEDIA"] ?? "Media",
              deadline: prazoDate ? fmt(prazoDate) : "-",
              deadlineDate: prazoDate ?? now,
              status: taskStatus,
            }
          }).filter((t: Task) => t.status !== "Proxima Semana")
          setRealTasks(mapped)
        }
      } catch { /* ignore */ }
    }
    loadTasks()
  }, [clientId, client?.name])

  const cfg = phaseConfig[client.phase]
  const clientTasks = realTasks
  const overdueTasks = clientTasks.filter((t) => t.status === "Atrasada").length
  const horasWeek = 0

  const tabs: { key: FocusTab; label: string; icon: React.ElementType }[] = [
    { key: "visao-geral", label: "Visao Geral",  icon: LayoutGrid },
    { key: "projecao",    label: "Projecao",      icon: BarChart2 },
    { key: "canvas",      label: "Canvas",        icon: Target },
    { key: "okrs",        label: "OKRs",          icon: TrendingUp },
    { key: "tarefas",     label: "Tarefas",       icon: ListTodo },
    { key: "chat",        label: "Reunioes",      icon: MessageSquare },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Client Header Banner ── */}
      <div className={cn("rounded-2xl border border-border p-5 sm:p-6", cfg.bg)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 sm:size-16 shrink-0">
              <AvatarFallback className="text-lg font-bold bg-background/60 text-foreground border border-border">
                {client.initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
                <Badge className={cn("text-[11px] h-auto py-0.5 px-2.5 border font-semibold", cfg.badge)}>
                  {cfg.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Ultima atividade: {client.lastActivity}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <Progress value={client.progress} className="h-2 w-40 sm:w-52" />
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {client.progress}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:ml-auto gap-4 sm:gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <span className="text-2xl font-bold text-foreground font-numbers">{clientTasks.length}</span>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Tarefas</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <span className={cn("text-2xl font-bold font-numbers", overdueTasks > 0 ? "text-red-500" : "text-foreground")}>{overdueTasks}</span>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Atrasadas</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <span className="text-2xl font-bold text-foreground font-numbers">{horasWeek.toFixed(1)}h</span>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Horas/Sem</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <span className="text-2xl font-bold text-foreground font-numbers">{okrSummary.concluidos}/{okrSummary.total}</span>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">OKRs</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar pb-0">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "visao-geral" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Progresso Geral", value: `${client.progress}%`, sub: "da consultoria", icon: TrendingUp, iconColor: "text-primary", iconBg: "bg-primary/10" },
              { label: "Tarefas Pendentes", value: client.pendingItems, sub: `${overdueTasks} atrasada${overdueTasks !== 1 ? "s" : ""}`, icon: CheckSquare, iconColor: overdueTasks > 0 ? "text-red-500" : "text-orange-500", iconBg: overdueTasks > 0 ? "bg-red-500/10" : "bg-orange-500/10" },
              { label: "Horas Registradas", value: `${horasWeek.toFixed(1)}h`, sub: "esta semana", icon: Clock, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
              { label: "OKRs Concluidos", value: `${okrSummary.concluidos}/${okrSummary.total}`, sub: "objetivos", icon: Target, iconColor: "text-purple-500", iconBg: "bg-purple-500/10" },
            ].map((kpi) => {
              const Icon = kpi.icon
              return (
                <Card key={kpi.label} className="rounded-xl">
                  <CardContent className="px-4 pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</span>
                        <span className="text-3xl font-bold text-foreground font-numbers">{kpi.value}</span>
                        <span className="text-xs text-muted-foreground">{kpi.sub}</span>
                      </div>
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.iconBg} shrink-0`}>
                        <Icon className={`size-5 ${kpi.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="rounded-xl">
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-foreground">
                Atividades Pendentes — {client.name}
              </CardTitle>
              <Link href="/tarefas" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Ver todas <ArrowUpRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <TasksTable tasks={clientTasks} />
            </CardContent>
          </Card>

          {/* Hours widget removed - use Timesheet page for detailed tracking */}
        </div>
      )}

      {activeTab === "projecao" && <MiniProjecaoPreview clientId={clientId} clientName={client.name} />}
      {activeTab === "canvas" && <MiniCanvasPreview clientId={clientId} clientName={client.name} />}
      {activeTab === "okrs" && <MiniOKRsPreview clientId={clientId} clientName={client.name} />}

      {activeTab === "tarefas" && (
        <Card className="rounded-xl">
          <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-foreground">Tarefas — {client.name}</CardTitle>
            <Link href="/tarefas" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              Ver todas <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <TasksTable tasks={clientTasks} />
          </CardContent>
        </Card>
      )}

      {activeTab === "chat" && <MiniReunioesPreview clientId={clientId} clientName={client.name} />}
    </div>
  )
}

// ─── Nova Empresa Dialog ──────────────────────────────────────────────────────

const emptyForm = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  segmento: "",
  porte: "",
  responsavel: "",
  telefone: "",
  email: "",
  cidade: "",
  estado: "",
}

function NovaEmpresaDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.razaoSocial.trim()) {
      setError("Razao Social e obrigatoria.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createEmpresa({
        razaoSocial: form.razaoSocial.trim(),
        nomeFantasia: form.nomeFantasia.trim() || undefined,
        cnpj: form.cnpj.trim() || undefined,
        segmento: form.segmento.trim() || undefined,
        porte: form.porte.trim() || undefined,
        responsavel: form.responsavel.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        email: form.email.trim() || undefined,
        cidade: form.cidade.trim() || undefined,
        estado: form.estado.trim() || undefined,
      })
      setForm(emptyForm)
      onOpenChange(false)
      onCreated()
    } catch (err) {
      console.error(err)
      setError("Erro ao criar empresa. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {([
            { field: "razaoSocial",  label: "Razao Social *",   placeholder: "Nome legal da empresa" },
            { field: "nomeFantasia", label: "Nome Fantasia",     placeholder: "Nome comercial" },
            { field: "cnpj",        label: "CNPJ",              placeholder: "00.000.000/0000-00" },
            { field: "segmento",    label: "Segmento",          placeholder: "Ex: Varejo, Servicos..." },
            { field: "porte",       label: "Porte",             placeholder: "Ex: Pequeno, Medio..." },
            { field: "responsavel", label: "Responsavel",       placeholder: "Nome do responsavel" },
            { field: "telefone",    label: "Telefone",          placeholder: "(00) 00000-0000" },
            { field: "email",       label: "E-mail",            placeholder: "contato@empresa.com" },
            { field: "cidade",      label: "Cidade",            placeholder: "Ex: Joao Pessoa" },
            { field: "estado",      label: "Estado",            placeholder: "Ex: PB" },
          ] as { field: keyof typeof emptyForm; label: string; placeholder: string }[]).map(({ field, label, placeholder }) => (
            <div key={field} className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
              <Input
                placeholder={placeholder}
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" className="gradient-exact text-white border-0" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Criar Empresa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Consolidated View ─────────────────────────────────────────────────────────

function ConsolidatedView() {
  const { clientes, loading, refreshClientes } = useClienteContext()
  const [taskFilter, setTaskFilter] = useState<FilterKey>("Todas")
  const [timerRunning] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [allTasks, setAllTasks] = useState<Task[]>([])

  // Load tasks from all clients
  useEffect(() => {
    async function loadAllTasks() {
      if (clientes.length === 0) return
      try {
        const now = new Date()
        const tasks: Task[] = []
        for (const c of clientes.slice(0, 10)) {
          const data = await getTarefasByEmpresa(c.id)
          if (data) {
            for (const t of data) {
              const prazoDate = t.prazo ? new Date(t.prazo) : null
              const prioMap: Record<string, Priority> = { URGENTE: "Alta", ALTA: "Alta", MEDIA: "Media", BAIXA: "Baixa" }
              let taskStatus: TaskStatus = "Proxima Semana"
              if (prazoDate) {
                const diff = Math.floor((prazoDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                if (diff < 0) taskStatus = "Atrasada"
                else if (diff === 0) taskStatus = "Hoje"
                else if (diff <= 7) taskStatus = "Esta Semana"
              }
              if (t.status === "CONCLUIDA") continue
              tasks.push({
                id: t.id,
                name: t.titulo,
                client: c.nome,
                clientId: c.id,
                priority: prioMap[t.prioridade ?? "MEDIA"] ?? "Media",
                deadline: prazoDate ? fmt(prazoDate) : "-",
                deadlineDate: prazoDate ?? now,
                status: taskStatus,
              })
            }
          }
        }
        setAllTasks(tasks)
      } catch { /* ignore */ }
    }
    loadAllTasks()
  }, [clientes])

  const pipelineClients = clientes.map(mapClienteToClient)
  const totalClients    = pipelineClients.length
  const totalPending    = allTasks.length
  const totalHorasWeek  = 0
  const reunioesWeek    = 0

  const filteredTasks =
    taskFilter === "Todas"
      ? allTasks
      : taskFilter === "Atrasadas"
      ? allTasks.filter((t) => t.status === "Atrasada")
      : allTasks.filter((t) => t.status === taskFilter)

  async function handleDelete(id: string) {
    try {
      await deleteEmpresa(id)
      await refreshClientes()
    } catch (err) {
      console.error("Erro ao excluir empresa:", err)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <NovaEmpresaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={refreshClientes}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard do Consultor</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visao consolidada de todos os seus clientes
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" />
            Nova Empresa
          </Button>
          <Link href="/timesheet">
            <Button className="gradient-exact text-white font-medium shadow-lg shadow-primary/20 border-0">
              <Timer className="size-4" />
              Registrar Tempo
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Clientes Ativos",    value: totalClients,              sub: `${totalClients} empresas ativas`, icon: Building2,   iconColor: "text-blue-500",   iconBg: "bg-blue-500/10" },
          { label: "Tarefas Pendentes",  value: totalPending,              sub: `${totalPending} pendentes`,       icon: CheckSquare, iconColor: "text-red-500",    iconBg: "bg-red-500/10" },
          { label: "Horas Registradas",  value: `${totalHorasWeek.toFixed(1)}h`, sub: "esta semana", icon: Clock,       iconColor: "text-primary",    iconBg: "bg-primary/10" },
          { label: "Proximas Reunioes",  value: reunioesWeek,              sub: "esta semana",       icon: Calendar,    iconColor: "text-purple-500", iconBg: "bg-purple-500/10" },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="rounded-xl">
              <CardContent className="px-4 pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {kpi.label}
                    </span>
                    <span className="text-3xl font-bold text-foreground font-numbers">
                      {kpi.value}
                    </span>
                    <span className="text-xs text-muted-foreground">{kpi.sub}</span>
                  </div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.iconBg} shrink-0`}>
                    <Icon className={`size-5 ${kpi.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Pipeline de Clientes ── */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground">
            Pipeline de Clientes
          </CardTitle>
          <span className="text-xs text-muted-foreground">{totalClients} clientes ativos</span>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando clientes...</p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {phases.map((phase) => {
              const cfg = phaseConfig[phase]
              const clients = pipelineClients.filter((c) => c.phase === phase)
              return (
                <div
                  key={phase}
                  className={`rounded-xl border border-border border-t-4 ${cfg.border} bg-card p-3 space-y-2`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    <Badge className={`text-[10px] h-auto py-0.5 px-1.5 border ${cfg.badge}`}>
                      {clients.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {clients.map((c) => (
                      <ClientPipelineCard key={c.id} client={c} onDelete={handleDelete} />
                    ))}
                    {clients.length === 0 && (
                      <p className="text-xs text-muted-foreground/50 text-center py-4">
                        Nenhum cliente
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </CardContent>
      </Card>

      {/* ── Atividades Pendentes ── */}
      <Card className="rounded-xl">
        <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground">
            Minhas Atividades Pendentes
          </CardTitle>
          <Link
            href="/tarefas"
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            Ver todas <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {(["Hoje", "Esta Semana", "Atrasadas", "Todas"] as FilterKey[]).map((f) => (
              <button
                key={f}
                onClick={() => setTaskFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  taskFilter === f
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "text-muted-foreground border-border hover:border-primary/20 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Tarefa</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Cliente</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 hidden md:table-cell">Prioridade</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Prazo</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.slice(0, 10).map((task) => {
                  const isOverdue = task.status === "Atrasada"
                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors hover:bg-secondary/30",
                        isOverdue && "bg-red-500/5"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isOverdue && <AlertCircle className="size-3.5 text-red-500 shrink-0" />}
                          <span className={`font-medium text-[13px] ${isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                            {task.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-[13px] text-muted-foreground">{task.client}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge className={`text-[10px] h-auto py-0.5 px-2 border ${priorityConfig[task.priority]}`}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[13px] font-medium ${isOverdue ? "text-red-500" : "text-foreground"}`}>
                          {task.deadline}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : task.status === "Hoje"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Timer + Resumo Semanal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timer Ativo */}
        <Card className="rounded-xl">
          <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Timer className="size-4 text-primary" />
              Timer Ativo
            </CardTitle>
            <Link href="/timesheet">
              <Button variant="outline" size="sm" className="text-xs h-7 px-3">
                Gerenciar
                <ChevronRight className="size-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {timerRunning ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Registrando tempo para</span>
                  <span className="text-base font-semibold text-foreground">Geny Eletros</span>
                  <span className="text-xs text-muted-foreground">Revisao de OKRs Q2</span>
                </div>
                <div className="flex items-center justify-center w-36 h-36 rounded-full border-4 border-primary/20 bg-primary/5">
                  <span className="text-3xl font-bold text-primary font-numbers tabular-nums">
                    01:23:45
                  </span>
                </div>
                <Button
                  size="sm"
                  className="gap-2 bg-red-500 hover:bg-red-600 text-white border-0"
                >
                  <Square className="size-3.5 fill-current" />
                  Parar Timer
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                <p className="text-sm text-muted-foreground">Nenhum timer ativo</p>
                <Link href="/timesheet?tab=timer">
                  <Button className="gradient-exact text-white border-0 gap-2">
                    <Play className="size-4 fill-current" />
                    Iniciar Timer
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo Semanal - use Timesheet page for details */}
      </div>
    </div>
  )
}

// ─── Page Entry Point ──────────────────────────────────────────────────────────

export default function ConsultorDashboard() {
  const { clienteAtivo, isFiltered } = useClienteContext()

  if (isFiltered && clienteAtivo) {
    return <ClientFocusedView clientId={clienteAtivo.id} />
  }

  return <ConsolidatedView />
}
