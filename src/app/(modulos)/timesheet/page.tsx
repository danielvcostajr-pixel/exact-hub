"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Play,
  Square,
  Pause,
  Plus,
  Pencil,
  Trash2,
  Clock,
  BarChart2,
  List,
  Timer,
  TrendingUp,
  Users,
  Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryType = "timer" | "manual"

interface TimeEntry {
  id: string
  date: string
  client: string
  activity: string
  duration: number // minutes
  type: EntryType
}

type ReportRange = "esta-semana" | "este-mes" | "mes-passado" | "personalizado"

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CLIENTS = [
  "Geny Eletros",
  "Casa Gramado",
  "Alumifont",
  "Confort Maison",
  "Pizzaria Bella",
  "Tech Solutions",
  "Farmacia Popular",
  "Auto Center JP",
]

const PLANNED_HOURS: Record<string, number> = {
  "Geny Eletros":    20,
  "Casa Gramado":    16,
  "Alumifont":       12,
  "Confort Maison":  10,
  "Pizzaria Bella":  8,
  "Tech Solutions":  18,
  "Farmacia Popular":14,
  "Auto Center JP":  6,
}

const RATE_PER_HOUR: Record<string, number> = {
  "Geny Eletros":    250,
  "Casa Gramado":    200,
  "Alumifont":       300,
  "Confort Maison":  220,
  "Pizzaria Bella":  180,
  "Tech Solutions":  280,
  "Farmacia Popular":210,
  "Auto Center JP":  190,
}

const today = new Date()
const fmtDate = (dt: Date) => dt.toLocaleDateString("pt-BR")
const dayOffset = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return fmtDate(d)
}

const INITIAL_ENTRIES: TimeEntry[] = [
  { id: "e1",  date: dayOffset(0),   client: "Geny Eletros",     activity: "Revisao de OKRs Q2",                  duration: 90,  type: "timer"  },
  { id: "e2",  date: dayOffset(0),   client: "Farmacia Popular",  activity: "Entrevista com gerente",               duration: 60,  type: "timer"  },
  { id: "e3",  date: dayOffset(-1),  client: "Casa Gramado",      activity: "Planejamento de rotinas",              duration: 75,  type: "timer"  },
  { id: "e4",  date: dayOffset(-1),  client: "Tech Solutions",    activity: "Apresentacao de resultados",           duration: 120, type: "manual" },
  { id: "e5",  date: dayOffset(-2),  client: "Alumifont",         activity: "Canvas de negocio — revisao",          duration: 90,  type: "timer"  },
  { id: "e6",  date: dayOffset(-2),  client: "Geny Eletros",      activity: "Analise de projecao financeira",       duration: 105, type: "timer"  },
  { id: "e7",  date: dayOffset(-3),  client: "Confort Maison",    activity: "Reuniao de acompanhamento mensal",     duration: 60,  type: "manual" },
  { id: "e8",  date: dayOffset(-3),  client: "Farmacia Popular",  activity: "Mapeamento de processos",              duration: 90,  type: "timer"  },
  { id: "e9",  date: dayOffset(-4),  client: "Casa Gramado",      activity: "OKR workshop com diretoria",           duration: 180, type: "timer"  },
  { id: "e10", date: dayOffset(-4),  client: "Pizzaria Bella",    activity: "Diagnostico inicial",                  duration: 60,  type: "manual" },
  { id: "e11", date: dayOffset(-5),  client: "Tech Solutions",    activity: "Revisao de planos de acao",            duration: 90,  type: "timer"  },
  { id: "e12", date: dayOffset(-5),  client: "Geny Eletros",      activity: "Alinhamento com lideranca",            duration: 60,  type: "timer"  },
  { id: "e13", date: dayOffset(-6),  client: "Auto Center JP",    activity: "Entrevista de diagnostico",            duration: 45,  type: "timer"  },
  { id: "e14", date: dayOffset(-7),  client: "Alumifont",         activity: "Revisao de canvas",                   duration: 75,  type: "manual" },
  { id: "e15", date: dayOffset(-8),  client: "Confort Maison",    activity: "Entrega de relatorio de resultados",   duration: 30,  type: "timer"  },
  { id: "e16", date: dayOffset(-8),  client: "Farmacia Popular",  activity: "Plano de acao — segunda etapa",       duration: 90,  type: "manual" },
  { id: "e17", date: dayOffset(-9),  client: "Geny Eletros",      activity: "Planejamento estrategico Q3",          duration: 120, type: "timer"  },
  { id: "e18", date: dayOffset(-9),  client: "Tech Solutions",    activity: "Canvas de negocio — sessao 2",         duration: 90,  type: "timer"  },
  { id: "e19", date: dayOffset(-10), client: "Casa Gramado",      activity: "Entrevistas com equipe operacional",   duration: 120, type: "timer"  },
  { id: "e20", date: dayOffset(-11), client: "Pizzaria Bella",    activity: "Revisao de metas mensais",             duration: 45,  type: "manual" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, "0")}m`
}

const fmtSeconds = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":")
}

const CLIENT_COLORS: Record<string, string> = {
  "Geny Eletros":    "#f97316",
  "Casa Gramado":    "#22c55e",
  "Alumifont":       "#a855f7",
  "Confort Maison":  "#ec4899",
  "Pizzaria Bella":  "#eab308",
  "Tech Solutions":  "#3b82f6",
  "Farmacia Popular":"#14b8a6",
  "Auto Center JP":  "#6366f1",
}

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]

// ─── Sub-components ───────────────────────────────────────────────────────────

function EntryTypeIcon({ type }: { type: EntryType }) {
  return type === "timer" ? (
    <Timer className="size-3 text-primary" />
  ) : (
    <Pencil className="size-3 text-blue-500" />
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TimesheetPage() {
  const [entries, setEntries] = useState<TimeEntry[]>(INITIAL_ENTRIES)
  const [activeTab, setActiveTab] = useState("registros")

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerClient, setTimerClient] = useState("")
  const [timerActivity, setTimerActivity] = useState("")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Filter state
  const [filterClient, setFilterClient] = useState("todos")

  // New entry dialog
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [newDate, setNewDate] = useState(fmtDate(today))
  const [newClient, setNewClient] = useState("")
  const [newActivity, setNewActivity] = useState("")
  const [newHours, setNewHours] = useState("")
  const [newMinutes, setNewMinutes] = useState("")

  // Report state
  const [reportRange, setReportRange] = useState<ReportRange>("esta-semana")

  // ── Load timer from localStorage ──────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("exacthub_timer")
      if (saved) {
        const data = JSON.parse(saved)
        if (data.running && data.startedAt) {
          const elapsed = Math.floor((Date.now() - data.startedAt) / 1000) + (data.pausedSeconds || 0)
          setTimerSeconds(elapsed)
          setTimerRunning(true)
          setTimerClient(data.client || "")
          setTimerActivity(data.activity || "")
        } else if (data.paused) {
          setTimerSeconds(data.pausedSeconds || 0)
          setTimerPaused(true)
          setTimerClient(data.client || "")
          setTimerActivity(data.activity || "")
        }
      }
    } catch {}
  }, [])

  // ── Timer interval ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRunning && !timerPaused) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerRunning, timerPaused])

  const persistTimer = useCallback(
    (running: boolean, paused: boolean, secs: number, client: string, activity: string) => {
      const data = {
        running,
        paused,
        client,
        activity,
        startedAt: running && !paused ? Date.now() - secs * 1000 : null,
        pausedSeconds: secs,
      }
      localStorage.setItem("exacthub_timer", JSON.stringify(data))
    },
    []
  )

  const handleStart = () => {
    if (!timerClient) return
    setTimerRunning(true)
    setTimerPaused(false)
    persistTimer(true, false, timerSeconds, timerClient, timerActivity)
  }

  const handlePause = () => {
    setTimerPaused(true)
    persistTimer(false, true, timerSeconds, timerClient, timerActivity)
  }

  const handleResume = () => {
    setTimerPaused(false)
    persistTimer(true, false, timerSeconds, timerClient, timerActivity)
  }

  const handleStop = () => {
    const duration = Math.max(1, Math.round(timerSeconds / 60))
    if (timerClient) {
      const newEntry: TimeEntry = {
        id: `e${Date.now()}`,
        date: fmtDate(today),
        client: timerClient,
        activity: timerActivity || "Sessao de trabalho",
        duration,
        type: "timer",
      }
      setEntries((prev) => [newEntry, ...prev])
    }
    setTimerRunning(false)
    setTimerPaused(false)
    setTimerSeconds(0)
    setTimerClient("")
    setTimerActivity("")
    localStorage.removeItem("exacthub_timer")
  }

  const handleAddEntry = () => {
    const h = parseInt(newHours || "0", 10)
    const m = parseInt(newMinutes || "0", 10)
    const duration = h * 60 + m
    if (!newClient || duration <= 0) return
    const entry: TimeEntry = {
      id: `e${Date.now()}`,
      date: newDate,
      client: newClient,
      activity: newActivity || "Atividade manual",
      duration,
      type: "manual",
    }
    setEntries((prev) => [entry, ...prev])
    setShowNewEntry(false)
    setNewClient("")
    setNewActivity("")
    setNewHours("")
    setNewMinutes("")
  }

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // ── Filtered entries ───────────────────────────────────────────────────────
  const filteredEntries =
    filterClient === "todos"
      ? entries
      : entries.filter((e) => e.client === filterClient)

  const weekTotal = entries
    .filter((e) => {
      const d = new Date(today)
      d.setDate(d.getDate() - 7)
      const entryDate = e.date.split("/").reverse().join("-")
      return new Date(entryDate) >= d
    })
    .reduce((s, e) => s + e.duration, 0)

  // ── Report data ────────────────────────────────────────────────────────────
  const reportEntries = (() => {
    const now = new Date(today)
    if (reportRange === "esta-semana") {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + 1)
      return entries.filter((e) => {
        const [d2, m2, y2] = e.date.split("/")
        return new Date(`${y2}-${m2}-${d2}`) >= weekStart
      })
    }
    if (reportRange === "este-mes") {
      return entries.filter((e) => {
        const [, m2, y2] = e.date.split("/")
        return parseInt(m2) === now.getMonth() + 1 && parseInt(y2) === now.getFullYear()
      })
    }
    if (reportRange === "mes-passado") {
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      return entries.filter((e) => {
        const [, m2, y2] = e.date.split("/")
        return parseInt(m2) === prevMonth && parseInt(y2) === prevYear
      })
    }
    return entries
  })()

  const hoursByClient = CLIENTS.map((c) => ({
    client: c,
    horas: Math.round((reportEntries.filter((e) => e.client === c).reduce((s, e) => s + e.duration, 0) / 60) * 10) / 10,
    fill: CLIENT_COLORS[c] || "#f97316",
  }))
    .filter((x) => x.horas > 0)
    .sort((a, b) => b.horas - a.horas)

  const hoursByDay = WEEK_DAYS.map((day, i) => {
    const dt = new Date(today)
    const dayOfWeek = dt.getDay() === 0 ? 6 : dt.getDay() - 1
    dt.setDate(dt.getDate() - dayOfWeek + i)
    const dateStr = fmtDate(dt)
    const horas = reportEntries
      .filter((e) => e.date === dateStr)
      .reduce((s, e) => s + e.duration, 0) / 60
    return { day, horas: Math.round(horas * 10) / 10 }
  })

  const totalReportHours = reportEntries.reduce((s, e) => s + e.duration, 0) / 60
  const avgDailyHours = Math.round((totalReportHours / 5) * 10) / 10
  const topClient = hoursByClient[0]?.client || "—"

  const META_HORAS = 40

  // ── Today's timer sessions (entries registered today via timer) ────────────
  const todayEntries = entries.filter((e) => e.date === fmtDate(today) && e.type === "timer")

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Timesheet — Controle de Tempo</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registre e acompanhe o tempo dedicado a cada cliente
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border border-border h-10">
          <TabsTrigger value="registros" className="gap-2 text-sm">
            <List className="size-3.5" />
            Registros
          </TabsTrigger>
          <TabsTrigger value="timer" className="gap-2 text-sm">
            <Timer className="size-3.5" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2 text-sm">
            <BarChart2 className="size-3.5" />
            Relatorios
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────── TAB: REGISTROS ─────────────────────── */}
        <TabsContent value="registros" className="space-y-4">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-48 h-9 text-sm">
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {CLIENTS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground px-3 py-2 bg-card border border-border rounded-lg">
                Semana: <span className="font-semibold text-foreground">{fmtDuration(weekTotal)}</span>
              </div>
            </div>
            <Button
              onClick={() => setShowNewEntry(true)}
              className="gradient-exact text-white border-0 gap-2 h-9"
            >
              <Plus className="size-4" />
              Novo Registro
            </Button>
          </div>

          {/* Entries table */}
          <Card className="rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Data</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Cliente</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Atividade / Tarefa</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Duracao</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Tipo</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-2 h-2 rounded-full shrink-0"
                            style={{ background: CLIENT_COLORS[entry.client] || "#f97316" }}
                          />
                          <span className="text-[13px] font-medium text-foreground whitespace-nowrap">
                            {entry.client}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground max-w-xs truncate">
                        {entry.activity}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold text-foreground tabular-nums">
                          {fmtDuration(entry.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full w-fit ${
                          entry.type === "timer"
                            ? "bg-primary/10 text-primary"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}>
                          <EntryTypeIcon type={entry.type} />
                          {entry.type === "timer" ? "Timer" : "Manual"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ─────────────────────── TAB: TIMER ─────────────────────── */}
        <TabsContent value="timer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Timer principal */}
            <Card className="rounded-xl">
              <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="text-sm font-semibold">Timer de Trabalho</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-6">
                {/* Client select */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Cliente
                  </Label>
                  <Select
                    value={timerClient}
                    onValueChange={setTimerClient}
                    disabled={timerRunning}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENTS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Activity input */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Atividade / Tarefa
                  </Label>
                  <Input
                    value={timerActivity}
                    onChange={(e) => setTimerActivity(e.target.value)}
                    placeholder="Descreva a atividade..."
                    disabled={timerRunning && !timerPaused}
                    className="h-10"
                  />
                </div>

                {/* Timer display */}
                <div className="flex flex-col items-center gap-6 py-4">
                  <div
                    className={`flex items-center justify-center w-44 h-44 rounded-full border-4 transition-all ${
                      timerRunning && !timerPaused
                        ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/20"
                        : timerPaused
                        ? "border-yellow-500/40 bg-yellow-500/5"
                        : "border-border bg-secondary/30"
                    }`}
                  >
                    <span
                      className={`text-4xl font-bold tabular-nums tracking-tight font-numbers ${
                        timerRunning && !timerPaused
                          ? "text-primary"
                          : timerPaused
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {fmtSeconds(timerSeconds)}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    {!timerRunning && !timerPaused && (
                      <Button
                        onClick={handleStart}
                        disabled={!timerClient}
                        className="gap-2 gradient-exact text-white border-0 px-8 h-11"
                      >
                        <Play className="size-4 fill-current" />
                        Iniciar
                      </Button>
                    )}
                    {timerRunning && !timerPaused && (
                      <>
                        <Button
                          onClick={handlePause}
                          variant="outline"
                          className="gap-2 h-11 px-6 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <Pause className="size-4" />
                          Pausar
                        </Button>
                        <Button
                          onClick={handleStop}
                          className="gap-2 h-11 px-6 bg-red-500 hover:bg-red-600 text-white border-0"
                        >
                          <Square className="size-4 fill-current" />
                          Parar
                        </Button>
                      </>
                    )}
                    {timerPaused && (
                      <>
                        <Button
                          onClick={handleResume}
                          className="gap-2 gradient-exact text-white border-0 h-11 px-6"
                        >
                          <Play className="size-4 fill-current" />
                          Retomar
                        </Button>
                        <Button
                          onClick={handleStop}
                          className="gap-2 h-11 px-6 bg-red-500 hover:bg-red-600 text-white border-0"
                        >
                          <Square className="size-4 fill-current" />
                          Parar
                        </Button>
                      </>
                    )}
                  </div>

                  {timerClient && (
                    <p className="text-xs text-muted-foreground text-center">
                      {timerRunning && !timerPaused && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          Registrando para <strong>{timerClient}</strong>
                        </span>
                      )}
                      {timerPaused && (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          Pausado — {timerClient}
                        </span>
                      )}
                      {!timerRunning && !timerPaused && timerClient && (
                        <span>Pronto para iniciar — {timerClient}</span>
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's sessions */}
            <Card className="rounded-xl">
              <CardHeader className="px-6 pt-6 pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold">Sessoes de Hoje</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {fmtDate(today)}
                </span>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-3">
                {todayEntries.length > 0 ? (
                  <>
                    {todayEntries.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                      >
                        <div
                          className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                          style={{ background: CLIENT_COLORS[e.client] || "#f97316" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{e.activity}</p>
                          <p className="text-xs text-muted-foreground">{e.client}</p>
                        </div>
                        <span className="text-[13px] font-semibold text-foreground tabular-nums shrink-0">
                          {fmtDuration(e.duration)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 flex items-center justify-between text-sm border-t border-border">
                      <span className="text-muted-foreground">Total do dia</span>
                      <span className="font-bold text-foreground">
                        {fmtDuration(todayEntries.reduce((s, e) => s + e.duration, 0))}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Clock className="size-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma sessao registrada hoje
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─────────────────────── TAB: RELATORIOS ─────────────────────── */}
        <TabsContent value="relatorios" className="space-y-6">

          {/* Range selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                ["esta-semana", "Esta Semana"],
                ["este-mes", "Este Mes"],
                ["mes-passado", "Mes Passado"],
                ["personalizado", "Personalizado"],
              ] as [ReportRange, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setReportRange(val)}
                className={`text-sm px-4 py-2 rounded-lg border font-medium transition-all ${
                  reportRange === val
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "text-muted-foreground border-border hover:border-primary/20 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                label: "Total Horas",
                value: `${Math.round(totalReportHours * 10) / 10}h`,
                sub: "no periodo",
                icon: Clock,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                label: "Media Diaria",
                value: `${avgDailyHours}h`,
                sub: "por dia util",
                icon: TrendingUp,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                label: "Cliente Mais Demandante",
                value: topClient,
                sub: hoursByClient[0] ? `${hoursByClient[0].horas}h registradas` : "",
                icon: Users,
                color: "text-green-500",
                bg: "bg-green-500/10",
              },
              {
                label: "Horas vs Meta",
                value: `${Math.min(100, Math.round((totalReportHours / META_HORAS) * 100))}%`,
                sub: `meta: ${META_HORAS}h`,
                icon: Target,
                color: "text-purple-500",
                bg: "bg-purple-500/10",
              },
            ].map((kpi) => {
              const Icon = kpi.icon
              return (
                <Card key={kpi.label} className="rounded-xl">
                  <CardContent className="px-4 pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {kpi.label}
                        </span>
                        <span className="text-2xl font-bold text-foreground font-numbers truncate">
                          {kpi.value}
                        </span>
                        <span className="text-xs text-muted-foreground">{kpi.sub}</span>
                      </div>
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.bg} shrink-0`}>
                        <Icon className={`size-5 ${kpi.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Horas por Cliente */}
            <Card className="rounded-xl">
              <CardHeader className="px-5 pt-5 pb-3">
                <CardTitle className="text-sm font-semibold">Horas por Cliente</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {hoursByClient.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={hoursByClient}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                      barSize={14}
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
                        {hoursByClient.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">
                    Sem dados no periodo
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Horas por Dia */}
            <Card className="rounded-xl">
              <CardHeader className="px-5 pt-5 pb-3">
                <CardTitle className="text-sm font-semibold">Horas por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={hoursByDay}
                    margin={{ top: 0, right: 8, bottom: 0, left: -20 }}
                    barSize={28}
                  >
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--secondary)", opacity: 0.5, radius: 4 }}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--foreground)",
                      }}
                      formatter={(v) => [`${v}h`, "Horas"]}
                    />
                    <Bar dataKey="horas" radius={[6, 6, 0, 0]} fill="#f97316" fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary table */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold">Resumo por Cliente</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-5 py-3">Cliente</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Planejado</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Realizado</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">%</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-5 py-3">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CLIENTS.map((client) => {
                      const realized =
                        reportEntries
                          .filter((e) => e.client === client)
                          .reduce((s, e) => s + e.duration, 0) / 60
                      const planned = PLANNED_HOURS[client] || 0
                      const pct = planned > 0 ? Math.round((realized / planned) * 100) : 0
                      const value = Math.round(realized * (RATE_PER_HOUR[client] || 200))
                      return (
                        <tr
                          key={client}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: CLIENT_COLORS[client] || "#f97316" }}
                              />
                              <span className="text-[13px] font-medium text-foreground">{client}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-[13px] text-muted-foreground tabular-nums">
                            {planned}h
                          </td>
                          <td className="px-4 py-3 text-right text-[13px] font-semibold text-foreground tabular-nums">
                            {Math.round(realized * 10) / 10}h
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`text-[12px] font-semibold tabular-nums ${
                                pct >= 100
                                  ? "text-green-600 dark:text-green-400"
                                  : pct >= 60
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {pct}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-[13px] font-semibold text-foreground tabular-nums">
                            {value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-secondary/60">
                      <td className="px-5 py-3 text-[13px] font-bold text-foreground">Total</td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold text-foreground tabular-nums">
                        {Object.values(PLANNED_HOURS).reduce((s, v) => s + v, 0)}h
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold text-primary tabular-nums">
                        {Math.round(totalReportHours * 10) / 10}h
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold text-foreground tabular-nums">
                        {Math.round(
                          (totalReportHours /
                            Object.values(PLANNED_HOURS).reduce((s, v) => s + v, 0)) *
                            100
                        )}%
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] font-bold text-foreground tabular-nums">
                        {CLIENTS.reduce((sum, client) => {
                          const realized =
                            reportEntries
                              .filter((e) => e.client === client)
                              .reduce((s, e) => s + e.duration, 0) / 60
                          return sum + Math.round(realized * (RATE_PER_HOUR[client] || 200))
                        }, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── New Entry Dialog ── */}
      <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Novo Registro Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Data
              </Label>
              <Input
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                placeholder="dd/mm/aaaa"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Cliente
              </Label>
              <Select value={newClient} onValueChange={setNewClient}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {CLIENTS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Atividade / Tarefa
              </Label>
              <Input
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Descreva a atividade..."
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Duracao
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newHours}
                  onChange={(e) => setNewHours(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="h-10 text-center"
                  maxLength={2}
                />
                <span className="text-sm text-muted-foreground font-medium">h</span>
                <Input
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value.replace(/\D/g, ""))}
                  placeholder="00"
                  className="h-10 text-center"
                  maxLength={2}
                />
                <span className="text-sm text-muted-foreground font-medium">min</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewEntry(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddEntry}
              className="gradient-exact text-white border-0"
              disabled={!newClient || (!newHours && !newMinutes)}
            >
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
