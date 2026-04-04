"use client"

import { useState } from "react"
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
  MessageSquare,
  Target,
  LayoutGrid,
  ListTodo,
  BarChart2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useClienteContext, ClienteInfo } from "@/hooks/useClienteContext"
import { cn } from "@/lib/utils"

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

const mockTasks: Task[] = []

const weeklyHours: { client: string; clientId: string; horas: number; fill: string }[] = []

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

function ClientPipelineCard({ client }: { client: Client }) {
  return (
    <div className="bg-background border border-border rounded-lg p-3 hover:border-primary/30 transition-colors cursor-pointer group space-y-2.5">
      <div className="flex items-center gap-2">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-[11px] font-bold bg-primary/15 text-primary">
            {client.initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight truncate">
          {client.name}
        </p>
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

// ─── Focused Client View ───────────────────────────────────────────────────────

function ClientFocusedView({ clientId }: { clientId: string }) {
  const { clientes } = useClienteContext()
  const [activeTab, setActiveTab] = useState<FocusTab>("visao-geral")

  const clienteInfo = clientes.find((c) => c.id === clientId)
  const client = clienteInfo ? mapClienteToClient(clienteInfo) : null
  if (!client) return null

  const cfg = phaseConfig[client.phase]
  const clientTasks = mockTasks.filter((t) => t.clientId === clientId)
  const clientHours = weeklyHours.find((h) => h.clientId === clientId)
  const overdueTasks = clientTasks.filter((t) => t.status === "Atrasada").length
  const horasWeek = clientHours?.horas ?? 0

  const tabs: { key: FocusTab; label: string; icon: React.ElementType }[] = [
    { key: "visao-geral", label: "Visao Geral",  icon: LayoutGrid },
    { key: "projecao",    label: "Projecao",      icon: BarChart2 },
    { key: "canvas",      label: "Canvas",        icon: Target },
    { key: "okrs",        label: "OKRs",          icon: TrendingUp },
    { key: "tarefas",     label: "Tarefas",       icon: ListTodo },
    { key: "chat",        label: "Chat",          icon: MessageSquare },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Client Header Banner ── */}
      <div className={cn("rounded-2xl border border-border p-5 sm:p-6", cfg.bg)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar + Info */}
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
              {/* Progress bar */}
              <div className="flex items-center gap-3 mt-1">
                <Progress value={client.progress} className="h-2 w-40 sm:w-52" />
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {client.progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="flex sm:ml-auto gap-4 sm:gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <span className="text-2xl font-bold text-foreground font-numbers">
                {clientTasks.length}
              </span>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                Tarefas
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <span className={cn("text-2xl font-bold font-numbers", overdueTasks > 0 ? "text-red-500" : "text-foreground")}>
                {overdueTasks}
              </span>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                Atrasadas
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <span className="text-2xl font-bold text-foreground font-numbers">
                {horasWeek.toFixed(1)}h
              </span>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                Horas/Sem
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <span className="text-2xl font-bold text-foreground font-numbers">
                {client.okrConcluidos}/{client.okrTotal}
              </span>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                OKRs
              </span>
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
          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                label: "Progresso Geral",
                value: `${client.progress}%`,
                sub: "da consultoria",
                icon: TrendingUp,
                iconColor: "text-primary",
                iconBg: "bg-primary/10",
              },
              {
                label: "Tarefas Pendentes",
                value: client.pendingItems,
                sub: `${overdueTasks} atrasada${overdueTasks !== 1 ? "s" : ""}`,
                icon: CheckSquare,
                iconColor: overdueTasks > 0 ? "text-red-500" : "text-orange-500",
                iconBg: overdueTasks > 0 ? "bg-red-500/10" : "bg-orange-500/10",
              },
              {
                label: "Horas Registradas",
                value: `${horasWeek.toFixed(1)}h`,
                sub: "esta semana",
                icon: Clock,
                iconColor: "text-blue-500",
                iconBg: "bg-blue-500/10",
              },
              {
                label: "OKRs Concluidos",
                value: `${client.okrConcluidos}/${client.okrTotal}`,
                sub: "objetivos",
                icon: Target,
                iconColor: "text-purple-500",
                iconBg: "bg-purple-500/10",
              },
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

          {/* Tasks for this client */}
          <Card className="rounded-xl">
            <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-foreground">
                Atividades Pendentes — {client.name}
              </CardTitle>
              <Link
                href="/tarefas"
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                Ver todas <ArrowUpRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <TasksTable tasks={clientTasks} />
            </CardContent>
          </Card>

          {/* Hours widget */}
          {clientHours && (
            <Card className="rounded-xl">
              <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Horas Registradas — Esta Semana
                </CardTitle>
                <span className="text-xs font-semibold text-primary">
                  {horasWeek.toFixed(1)}h
                </span>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart
                    data={[clientHours]}
                    layout="vertical"
                    margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                    barSize={20}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="client"
                      width={120}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--foreground)",
                      }}
                      formatter={(v) => [`${v}h`, "Horas"]}
                    />
                    <Bar dataKey="horas" radius={[0, 6, 6, 0]}>
                      <Cell fill={clientHours.fill} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "tarefas" && (
        <Card className="rounded-xl">
          <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-foreground">
              Tarefas — {client.name}
            </CardTitle>
            <Link
              href="/tarefas"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              Ver todas <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <TasksTable tasks={clientTasks} />
          </CardContent>
        </Card>
      )}

      {(activeTab === "projecao" || activeTab === "canvas" || activeTab === "okrs" || activeTab === "chat") && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            {activeTab === "projecao" && <BarChart2 className="size-6 text-muted-foreground" />}
            {activeTab === "canvas"   && <Target className="size-6 text-muted-foreground" />}
            {activeTab === "okrs"     && <TrendingUp className="size-6 text-muted-foreground" />}
            {activeTab === "chat"     && <MessageSquare className="size-6 text-muted-foreground" />}
          </div>
          <p className="text-base font-semibold text-foreground">
            {activeTab === "projecao" && "Projecao Financeira"}
            {activeTab === "canvas"   && "Canvas de Negocio"}
            {activeTab === "okrs"     && "OKRs e Metas"}
            {activeTab === "chat"     && "Chat com o Cliente"}
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Acesse a pagina dedicada para {client.name} ou use a navegacao lateral.
          </p>
          <Link
            href={
              activeTab === "projecao"
                ? "/projecao-financeira"
                : activeTab === "canvas"
                ? "/canvas-negocio"
                : activeTab === "chat"
                ? "/memoria-cliente"
                : "/consultor"
            }
          >
            <Button variant="outline" size="sm" className="gap-2">
              Ir para a pagina
              <ChevronRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Consolidated View ─────────────────────────────────────────────────────────

function ConsolidatedView() {
  const { clientes, loading } = useClienteContext()
  const [taskFilter, setTaskFilter] = useState<FilterKey>("Todas")
  const [timerRunning] = useState(true)

  const pipelineClients = clientes.map(mapClienteToClient)
  const totalClients    = pipelineClients.length
  const totalPending    = mockTasks.filter((t) => t.status !== "Proxima Semana").length
  const totalHorasWeek  = weeklyHours.reduce((s, h) => s + h.horas, 0)
  const reunioesWeek    = 3

  const filteredTasks =
    taskFilter === "Todas"
      ? mockTasks
      : taskFilter === "Atrasadas"
      ? mockTasks.filter((t) => t.status === "Atrasada")
      : mockTasks.filter((t) => t.status === taskFilter)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bom dia, Daniel</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visao consolidada de todos os seus clientes
          </p>
        </div>
        <Link href="/timesheet">
          <Button className="shrink-0 gradient-exact text-white font-medium shadow-lg shadow-primary/20 border-0">
            <Timer className="size-4" />
            Registrar Tempo
          </Button>
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Clientes Ativos",    value: totalClients,              sub: `${totalClients} empresas ativas`, icon: Building2,   iconColor: "text-blue-500",   iconBg: "bg-blue-500/10" },
          { label: "Tarefas Pendentes",  value: totalPending,              sub: "2 atrasadas",       icon: CheckSquare, iconColor: "text-red-500",    iconBg: "bg-red-500/10" },
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
                      <ClientPipelineCard key={c.id} client={c} />
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

        {/* Resumo Semanal */}
        <Card className="rounded-xl">
          <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-foreground">
              Horas por Cliente — Esta Semana
            </CardTitle>
            <span className="text-xs font-semibold text-primary">
              {totalHorasWeek.toFixed(1)}h total
            </span>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={weeklyHours}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                barSize={12}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="client"
                  width={110}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--foreground)",
                  }}
                  formatter={(v) => [`${v}h`, "Horas"]}
                />
                <Bar dataKey="horas" radius={[0, 6, 6, 0]}>
                  {weeklyHours.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
