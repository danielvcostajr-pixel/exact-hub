"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  List,
  LayoutGrid,
  Calendar,
  GanttChartSquare,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  ArrowLeft,
} from "lucide-react"
import { useClienteContext } from "@/hooks/useClienteContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import TarefaListView from "@/components/tarefas/TarefaListView"
import TarefaKanbanView from "@/components/tarefas/TarefaKanbanView"
import TarefaCalendarioView from "@/components/tarefas/TarefaCalendarioView"
import TarefaGanttView from "@/components/tarefas/TarefaGanttView"
import TarefaDetailPanel from "@/components/tarefas/TarefaDetailPanel"
import FormTarefa from "@/components/tarefas/FormTarefa"
import {
  Tarefa,
  StatusTarefa,
  STATUS_CONFIG,
  PRIORIDADE_CONFIG,
  Usuario,
} from "@/components/tarefas/tarefas-types"
import {
  getTarefasByEmpresa,
  createTarefa,
  updateTarefa,
  deleteTarefa,
  getCurrentUserId,
  getUsuarios,
} from "@/lib/api/data-service"

type ViewType = "lista" | "kanban" | "calendario" | "gantt"

const VIEWS: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: "lista", label: "Lista", icon: List },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
  { id: "calendario", label: "Calendario", icon: Calendar },
  { id: "gantt", label: "Gantt", icon: GanttChartSquare },
]

/** Map a DB row (with joined responsavel) into the local Tarefa shape */
function mapDbTarefa(row: Record<string, unknown>): Tarefa {
  const resp = row.responsavel as { id: string; nome: string } | null
  return {
    id: row.id as string,
    titulo: (row.titulo as string) ?? "",
    descricao: (row.descricao as string) ?? "",
    status: (row.status as StatusTarefa) ?? "BACKLOG",
    prioridade: (row.prioridade as Tarefa["prioridade"]) ?? "MEDIA",
    responsavel: resp?.nome ?? "Sem responsavel",
    responsavelId: (row.responsavelId as string) ?? resp?.id ?? null,
    dataInicio: (row.dataInicio as string) ?? "",
    prazo: (row.prazo as string) ?? "",
    estimativaHoras: (row.estimativaHoras as number) ?? 0,
    horasTrabalhadas: (row.horasTrabalhadas as number) ?? 0,
    progresso: 0,
    checklist: [],
    comentarios: [],
    anexos: [],
    atividades: [],
    comentariosCount: 0,
    anexosCount: 0,
    okrId: (row.okrId as string) ?? undefined,
    acaoId: (row.acaoId as string) ?? undefined,
    empresaId: (row.empresaId as string) ?? undefined,
  }
}

export default function TarefasPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<ViewType>("lista")
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  // Load usuarios from Supabase
  useEffect(() => {
    getUsuarios()
      .then((data) => setUsuarios(data as Usuario[]))
      .catch(() => setUsuarios([]))
  }, [])

  const loadTarefas = useCallback(async () => {
    if (!clienteAtivo) return
    setLoading(true)
    try {
      const data = await getTarefasByEmpresa(clienteAtivo.id)
      setTarefas((data as Record<string, unknown>[]).map(mapDbTarefa))
    } catch {
      setTarefas([])
    } finally {
      setLoading(false)
    }
  }, [clienteAtivo])

  useEffect(() => {
    loadTarefas()
  }, [loadTarefas])

  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters state
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS")
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("TODOS")
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("TODOS")
  const [filtroPrazoInicio, setFiltroPrazoInicio] = useState<string>("")
  const [filtroPrazoFim, setFiltroPrazoFim] = useState<string>("")
  const [busca, setBusca] = useState<string>("")

  // Filtered tasks
  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter((t) => {
      if (filtroStatus !== "TODOS" && t.status !== filtroStatus) return false
      if (filtroResponsavel !== "TODOS" && t.responsavelId !== filtroResponsavel) return false
      if (filtroPrioridade !== "TODOS" && t.prioridade !== filtroPrioridade) return false
      if (filtroPrazoInicio && t.prazo < filtroPrazoInicio) return false
      if (filtroPrazoFim && t.prazo > filtroPrazoFim) return false
      if (
        busca.trim() &&
        !t.titulo.toLowerCase().includes(busca.toLowerCase()) &&
        !t.descricao.toLowerCase().includes(busca.toLowerCase()) &&
        !t.responsavel.toLowerCase().includes(busca.toLowerCase())
      )
        return false
      return true
    })
  }, [tarefas, filtroStatus, filtroResponsavel, filtroPrioridade, filtroPrazoInicio, filtroPrazoFim, busca])

  function handleSelectTarefa(tarefa: Tarefa) {
    setSelectedTarefa(tarefa)
  }

  async function handleUpdateTarefa(updated: Tarefa) {
    try {
      await updateTarefa(updated.id, {
        titulo: updated.titulo,
        descricao: updated.descricao,
        status: updated.status,
        prioridade: updated.prioridade,
        responsavelId: updated.responsavelId || null,
        dataInicio: updated.dataInicio || null,
        prazo: updated.prazo || null,
        estimativaHoras: updated.estimativaHoras,
      })
      // Reload from DB to stay in sync
      await loadTarefas()
      // Keep selected tarefa updated
      setSelectedTarefa((prev) => {
        if (!prev || prev.id !== updated.id) return prev
        return updated
      })
    } catch (err) {
      console.error("Erro ao atualizar tarefa:", err)
    }
  }

  async function handleUpdateStatus(tarefaId: string, newStatus: StatusTarefa) {
    try {
      const updates: Record<string, unknown> = { status: newStatus }
      if (newStatus === "CONCLUIDA") {
        updates.dataConclusao = new Date().toISOString()
      }
      await updateTarefa(tarefaId, updates)
      await loadTarefas()
    } catch (err) {
      console.error("Erro ao atualizar status:", err)
    }
  }

  async function handleDeleteTarefa(tarefaId: string) {
    try {
      await deleteTarefa(tarefaId)
      setSelectedTarefa(null)
      await loadTarefas()
    } catch (err) {
      console.error("Erro ao excluir tarefa:", err)
    }
  }

  async function handleDeleteTarefas(ids: string[]) {
    try {
      for (const id of ids) {
        await deleteTarefa(id)
      }
      setSelectedTarefa(null)
      await loadTarefas()
    } catch (err) {
      console.error("Erro ao excluir tarefas:", err)
    }
  }

  async function handleCreateTarefa(
    data: Omit<
      Tarefa,
      "id" | "comentarios" | "anexos" | "atividades" | "horasTrabalhadas" | "comentariosCount" | "anexosCount"
    >
  ) {
    if (!clienteAtivo) return
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        console.error("Usuario nao autenticado")
        return
      }
      await createTarefa({
        empresaId: clienteAtivo.id,
        titulo: data.titulo,
        descricao: data.descricao || undefined,
        status: data.status,
        prioridade: data.prioridade,
        prazo: data.prazo || undefined,
        responsavelId: data.responsavelId || undefined,
        criadoPorId: userId,
      })
      // Reload tasks from DB
      await loadTarefas()
    } catch (err) {
      console.error("Erro ao criar tarefa:", err)
    }
  }

  function clearFilters() {
    setFiltroStatus("TODOS")
    setFiltroResponsavel("TODOS")
    setFiltroPrioridade("TODOS")
    setFiltroPrazoInicio("")
    setFiltroPrazoFim("")
    setBusca("")
  }

  const hasActiveFilters =
    filtroStatus !== "TODOS" ||
    filtroResponsavel !== "TODOS" ||
    filtroPrioridade !== "TODOS" ||
    filtroPrazoInicio !== "" ||
    filtroPrazoFim !== "" ||
    busca !== ""

  // Summary stats
  const stats = useMemo(() => {
    const total = tarefas.length
    const emProgresso = tarefas.filter((t) => t.status === "EM_PROGRESSO").length
    const concluidas = tarefas.filter((t) => t.status === "CONCLUIDA").length
    const atrasadas = tarefas.filter((t) => {
      if (t.status === "CONCLUIDA" || t.status === "CANCELADA") return false
      return t.prazo < new Date().toISOString().split("T")[0]
    }).length
    return { total, emProgresso, concluidas, atrasadas }
  }, [tarefas])

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (tarefas.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-background">
        <div className="border-b border-border bg-card px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
              Voltar
            </Link>
            {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <List size={24} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma tarefa cadastrada</h3>
            <p className="text-sm text-muted-foreground max-w-md">Crie a primeira tarefa.</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gradient-exact text-white mt-2">
            <Plus className="h-4 w-4" />
            Criar Primeira Tarefa
          </Button>
        </div>
        <FormTarefa
          open={showForm}
          onClose={() => setShowForm(false)}
          onSave={handleCreateTarefa}
          usuarios={usuarios}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestao de Tarefas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats.total} tarefas · {stats.emProgresso} em progresso ·{" "}
              {stats.concluidas} concluidas{" "}
              {stats.atrasadas > 0 && (
                <span className="text-red-500 font-medium">
                  · {stats.atrasadas} atrasada{stats.atrasadas !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
              {VIEWS.map((view) => {
                const Icon = view.icon
                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                      activeView === view.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{view.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Filter toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((p) => !p)}
              className={cn(
                "gap-1.5",
                hasActiveFilters && "border-primary text-primary"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                  {[filtroStatus !== "TODOS", filtroResponsavel !== "TODOS", filtroPrioridade !== "TODOS", filtroPrazoInicio !== "", filtroPrazoFim !== "", busca !== ""].filter(Boolean).length}
                </span>
              )}
            </Button>

            {/* Nova tarefa */}
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-md"
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Filters bar */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap items-end gap-3 pb-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefa, responsavel..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Status */}
            <div className="w-40">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsavel */}
            <div className="w-44">
              <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Responsavel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="w-36">
              <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  {Object.entries(PRIORIDADE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prazo range */}
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={filtroPrazoInicio}
                onChange={(e) => setFiltroPrazoInicio(e.target.value)}
                className="h-8 text-xs w-36"
                placeholder="De"
                title="Prazo inicial"
              />
              <span className="text-muted-foreground text-xs">ate</span>
              <Input
                type="date"
                value={filtroPrazoFim}
                onChange={(e) => setFiltroPrazoFim(e.target.value)}
                className="h-8 text-xs w-36"
                placeholder="Ate"
                title="Prazo final"
              />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-6">
        {activeView === "lista" && (
          <TarefaListView
            tarefas={tarefasFiltradas}
            onSelectTarefa={handleSelectTarefa}
            onUpdateStatus={handleUpdateStatus}
            onDeleteTarefas={handleDeleteTarefas}
            selectedTarefaId={selectedTarefa?.id}
          />
        )}

        {activeView === "kanban" && (
          <TarefaKanbanView
            tarefas={tarefasFiltradas}
            onSelectTarefa={handleSelectTarefa}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeView === "calendario" && (
          <TarefaCalendarioView
            tarefas={tarefasFiltradas}
            onSelectTarefa={handleSelectTarefa}
          />
        )}

        {activeView === "gantt" && (
          <TarefaGanttView
            tarefas={tarefasFiltradas}
            onSelectTarefa={handleSelectTarefa}
          />
        )}
      </div>

      {/* Detail Panel */}
      <TarefaDetailPanel
        tarefa={selectedTarefa}
        open={selectedTarefa !== null}
        onClose={() => setSelectedTarefa(null)}
        onUpdate={handleUpdateTarefa}
        onDelete={handleDeleteTarefa}
        usuarios={usuarios}
      />

      {/* Create Form */}
      <FormTarefa
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleCreateTarefa}
        usuarios={usuarios}
      />
    </div>
  )
}
