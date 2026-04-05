"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { FileText, Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle, ArrowRight, Calendar, ArrowLeft, Loader2 } from "lucide-react"
import { useClienteContext } from "@/hooks/useClienteContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getRelatoriosByEmpresa, createRelatorio, getCurrentUserId } from "@/lib/api/data-service"

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

function parseLinesToTarefas(text: string, status: "concluida" | "andamento"): Tarefa[] {
  if (!text) return []
  return text.split("\n").filter((l) => l.trim()).map((l) => ({ titulo: l.trim(), status }))
}

function parseLines(text: string): string[] {
  if (!text) return []
  return text.split("\n").filter((l) => l.trim()).map((l) => l.trim())
}

function dbToRelatorio(row: Record<string, unknown>): Relatorio {
  return {
    id: row.id as string,
    semanaInicio: row.semanaInicio as string,
    semanaFim: row.semanaFim as string,
    status: row.enviadoEm ? "finalizado" : "rascunho",
    resumoExecutivo: (row.resumoExecutivo as string) ?? "",
    tarefasConcluidas: parseLinesToTarefas((row.tarefasConcluidas as string) ?? "", "concluida"),
    tarefasAndamento: parseLinesToTarefas((row.tarefasEmAndamento as string) ?? "", "andamento"),
    problemas: parseLines((row.problemas as string) ?? ""),
    proximaSemana: parseLines((row.proximaSemana as string) ?? ""),
  }
}

function formatWeek(inicio: string, fim: string) {
  const fmtDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  const fmtYear = (d: string) => new Date(d + "T12:00:00").getFullYear()
  return `${fmtDate(inicio)} — ${fmtDate(fim)}, ${fmtYear(fim)}`
}

function getWeekRange(): { inicio: string; fim: string } {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const fmt = (d: Date) => d.toISOString().split("T")[0]
  return { inicio: fmt(monday), fim: fmt(friday) }
}

function RelatorioCard({ relatorio }: { relatorio: Relatorio }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      {/* Header -- always visible */}
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
            <p className="text-sm text-muted-foreground leading-relaxed">{relatorio.resumoExecutivo || "Sem resumo registrado."}</p>
          </div>

          <Separator className="bg-border" />

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Tarefas Concluidas */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-green-500" />
                Tarefas Concluidas ({relatorio.tarefasConcluidas.length})
              </h4>
              {relatorio.tarefasConcluidas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma registrada</p>
              ) : (
                <ul className="space-y-1.5">
                  {relatorio.tarefasConcluidas.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 size-1.5 rounded-full bg-green-500 shrink-0" />
                      {t.titulo}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tarefas em Andamento */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="size-3.5 text-yellow-500" />
                Em Andamento ({relatorio.tarefasAndamento.length})
              </h4>
              {relatorio.tarefasAndamento.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma registrada</p>
              ) : (
                <ul className="space-y-1.5">
                  {relatorio.tarefasAndamento.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 size-1.5 rounded-full bg-yellow-500 shrink-0" />
                      {t.titulo}
                    </li>
                  ))}
                </ul>
              )}
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
              {relatorio.proximaSemana.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma meta registrada</p>
              ) : (
                <ul className="space-y-1.5">
                  {relatorio.proximaSemana.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RelatoriosPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formInicio, setFormInicio] = useState("")
  const [formFim, setFormFim] = useState("")
  const [formResumo, setFormResumo] = useState("")
  const [formConcluidas, setFormConcluidas] = useState("")
  const [formAndamento, setFormAndamento] = useState("")
  const [formProblemas, setFormProblemas] = useState("")
  const [formProxima, setFormProxima] = useState("")

  const loadRelatorios = useCallback(async () => {
    if (!clienteAtivo) return
    setLoading(true)
    try {
      const data = await getRelatoriosByEmpresa(clienteAtivo.id)
      setRelatorios((data ?? []).map((r: Record<string, unknown>) => dbToRelatorio(r)))
    } catch (err) {
      console.error("Erro ao carregar relatorios:", err)
    } finally {
      setLoading(false)
    }
  }, [clienteAtivo])

  useEffect(() => {
    loadRelatorios()
  }, [loadRelatorios])

  function openDialog() {
    const week = getWeekRange()
    setFormInicio(week.inicio)
    setFormFim(week.fim)
    setFormResumo("")
    setFormConcluidas("")
    setFormAndamento("")
    setFormProblemas("")
    setFormProxima("")
    setDialogOpen(true)
  }

  async function handleCriarRelatorio() {
    if (!clienteAtivo || !formInicio || !formFim) return
    setSaving(true)
    try {
      const userId = await getCurrentUserId()
      if (!userId) { alert("Usuario nao autenticado"); return }

      await createRelatorio({
        empresaId: clienteAtivo.id,
        semanaInicio: formInicio,
        semanaFim: formFim,
        resumoExecutivo: formResumo.trim() || undefined,
        tarefasConcluidas: formConcluidas.trim() || undefined,
        tarefasEmAndamento: formAndamento.trim() || undefined,
        problemas: formProblemas.trim() || undefined,
        proximaSemana: formProxima.trim() || undefined,
        criadoPorId: userId,
      })

      setDialogOpen(false)
      await loadRelatorios()
    } catch (err) {
      console.error("Erro ao criar relatorio:", err)
      alert("Erro ao criar relatorio.")
    } finally {
      setSaving(false)
    }
  }

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
        </div>
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
          <Button onClick={openDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="size-4" />
            Novo Relatorio
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Carregando relatorios...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Lista de relatorios */}
            <div className="space-y-3">
              {relatorios.map((r) => (
                <RelatorioCard key={r.id} relatorio={r} />
              ))}
            </div>

            {relatorios.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <FileText size={24} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum relatorio gerado</h3>
                  <p className="text-sm text-muted-foreground max-w-md">Crie o primeiro relatorio semanal para este cliente.</p>
                </div>
                <Button onClick={openDialog} className="gradient-exact text-white mt-2">
                  <Plus className="size-4" />
                  Criar Primeiro Relatorio
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog Novo Relatorio */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Relatorio Semanal</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rel-inicio">Inicio da Semana *</Label>
                <Input
                  id="rel-inicio"
                  type="date"
                  value={formInicio}
                  onChange={(e) => setFormInicio(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rel-fim">Fim da Semana *</Label>
                <Input
                  id="rel-fim"
                  type="date"
                  value={formFim}
                  onChange={(e) => setFormFim(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rel-resumo">Resumo Executivo</Label>
              <Textarea
                id="rel-resumo"
                placeholder="Resumo geral da semana..."
                value={formResumo}
                onChange={(e) => setFormResumo(e.target.value)}
                className="resize-none h-20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rel-concluidas">Tarefas Concluidas (uma por linha)</Label>
              <Textarea
                id="rel-concluidas"
                placeholder="Implantacao do modulo X&#10;Treinamento da equipe Y"
                value={formConcluidas}
                onChange={(e) => setFormConcluidas(e.target.value)}
                className="resize-none h-20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rel-andamento">Tarefas em Andamento (uma por linha)</Label>
              <Textarea
                id="rel-andamento"
                placeholder="Revisao do processo Z&#10;Configuracao do painel W"
                value={formAndamento}
                onChange={(e) => setFormAndamento(e.target.value)}
                className="resize-none h-20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rel-problemas">Problemas / Impedimentos (um por linha)</Label>
              <Textarea
                id="rel-problemas"
                placeholder="Atraso no fornecedor&#10;Falta de acesso ao sistema"
                value={formProblemas}
                onChange={(e) => setFormProblemas(e.target.value)}
                className="resize-none h-16"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rel-proxima">Proxima Semana (uma meta por linha)</Label>
              <Textarea
                id="rel-proxima"
                placeholder="Finalizar modulo X&#10;Iniciar fase de testes"
                value={formProxima}
                onChange={(e) => setFormProxima(e.target.value)}
                className="resize-none h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!formInicio || !formFim || saving}
              onClick={handleCriarRelatorio}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Criar Relatorio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
