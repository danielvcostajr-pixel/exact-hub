'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, Check, Pencil, Plus, Loader2, CheckCircle, Target, TrendingUp, GitBranch, Trash2, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTarefa, getCurrentUserId, getTarefasByEmpresa, updateTarefa, deleteTarefa } from '@/lib/api/data-service'

export type OKRStatus = 'Rascunho' | 'Ativo' | 'Concluido' | 'Cancelado'

export interface KeyResult {
  id: string
  descricao: string
  metaInicial: number
  metaAlvo: number
  valorAtual: number
  unidade: string
  responsavelId: string
  responsavelNome: string
}

export interface OKR {
  id: string
  objetivo: string
  descricao: string
  status: OKRStatus
  prazoInicio: string
  prazoFim: string
  responsavelId: string
  responsavelNome: string
  keyResults: KeyResult[]
}

interface OKRCardProps {
  okr: OKR
  empresaId: string
  onUpdateKRValor: (okrId: string, krId: string, novoValor: number) => void
}

interface TarefaVinculada {
  id: string
  titulo: string
  status: string
  prioridade: string
  responsavel?: { nome: string } | null
  prazo?: string
  okrId?: string | null
  keyResultId?: string | null
  acaoId?: string | null
  acao?: {
    id: string
    planoId: string
    plano?: { id: string; okrId?: string | null; titulo?: string } | null
  } | null
}

function calcProgress(kr: KeyResult): number {
  const range = kr.metaAlvo - kr.metaInicial
  if (range === 0) return 100
  const progress = ((kr.valorAtual - kr.metaInicial) / range) * 100
  return Math.min(100, Math.max(0, progress))
}

function calcOverallProgress(okr: OKR): number {
  if (okr.keyResults.length === 0) return 0
  const sum = okr.keyResults.reduce((acc, kr) => acc + calcProgress(kr), 0)
  return Math.round(sum / okr.keyResults.length)
}

function getProgressColor(pct: number): string {
  if (pct >= 70) return 'text-green-500'
  if (pct >= 30) return 'text-orange-500'
  return 'text-red-500'
}

function getProgressBarColor(pct: number): string {
  if (pct >= 70) return 'bg-green-500'
  if (pct >= 30) return 'bg-orange-500'
  return 'bg-red-500'
}

const STATUS_STYLES: Record<OKRStatus, string> = {
  Rascunho: 'bg-secondary text-muted-foreground border-border',
  Ativo: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  Concluido: 'bg-green-500/15 text-green-500 border-green-500/30',
  Cancelado: 'bg-red-500/15 text-red-500 border-red-500/30',
}

const TAREFA_STATUS_COLORS: Record<string, string> = {
  BACKLOG: 'bg-secondary text-muted-foreground',
  A_FAZER: 'bg-blue-500/15 text-blue-500',
  EM_PROGRESSO: 'bg-yellow-500/15 text-yellow-600',
  REVISAO: 'bg-purple-500/15 text-purple-500',
  CONCLUIDA: 'bg-green-500/15 text-green-500',
  CANCELADA: 'bg-red-500/15 text-red-500',
}

const TAREFA_STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  A_FAZER: 'A Fazer',
  EM_PROGRESSO: 'Em Progresso',
  REVISAO: 'Revisao',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada',
}

// ── Tarefa row (usada dentro do KR e na lista de soltas) ────────────────────
function TarefaItem({
  t,
  leaf,
  keyResults,
  onReload,
}: {
  t: TarefaVinculada
  leaf?: boolean
  keyResults?: KeyResult[]
  onReload?: () => void
}) {
  const tituloPlano = t.acao?.plano?.titulo
  const [showReassign, setShowReassign] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleReassignKR(newKrId: string) {
    if (!newKrId) return
    setSaving(true)
    try {
      await updateTarefa(t.id, { keyResultId: newKrId })
      setShowReassign(false)
      onReload?.()
    } catch (err) {
      console.error('Erro ao reatribuir:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir a tarefa "${t.titulo}"? Isso e permanente.`)) return
    setSaving(true)
    try {
      await deleteTarefa(t.id)
      onReload?.()
    } catch (err) {
      console.error('Erro ao excluir:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 relative group">
      {/* conector em L */}
      {leaf && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none" aria-hidden>
          <div className="w-4 h-full border-l border-b border-muted-foreground/25 rounded-bl-md -mt-2 h-5" />
        </div>
      )}
      <div className={`flex items-center gap-2 flex-1 min-w-0 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 ${leaf ? 'ml-4' : ''}`}>
        {t.status === 'CONCLUIDA' ? (
          <CheckCircle size={12} className="text-green-500 shrink-0" />
        ) : (
          <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/40 shrink-0" />
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`text-xs truncate ${t.status === 'CONCLUIDA' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {t.titulo}
          </span>
          {tituloPlano && (
            <span className="text-[9px] text-primary/70 truncate">
              via plano: {tituloPlano}
            </span>
          )}
        </div>
        {t.responsavel?.nome && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {t.responsavel.nome.split(' ')[0]}
          </span>
        )}
        <Badge className={`text-[9px] h-4 px-1.5 border-0 shrink-0 ${TAREFA_STATUS_COLORS[t.status] ?? TAREFA_STATUS_COLORS.BACKLOG}`}>
          {TAREFA_STATUS_LABELS[t.status] ?? t.status}
        </Badge>
        {/* acoes rapidas: reatribuir KR e excluir (so aparecem quando ha keyResults disponiveis) */}
        {keyResults && keyResults.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowReassign((s) => !s) }}
            className="text-muted-foreground/70 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            title="Vincular a um Key Result"
            disabled={saving}
          >
            <Link2 size={11} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete() }}
          className="text-muted-foreground/70 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          title="Excluir tarefa"
          disabled={saving}
        >
          <Trash2 size={11} />
        </button>
      </div>
      {/* painel de reatribuicao */}
      {showReassign && keyResults && keyResults.length > 0 && (
        <div className={`absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-md shadow-lg p-2 min-w-[240px]`}>
          <p className="text-[10px] text-muted-foreground mb-1 px-1">Vincular a qual Key Result?</p>
          <div className="flex flex-col gap-1 max-h-48 overflow-auto">
            {keyResults.map((kr) => (
              <button
                key={kr.id}
                onClick={() => handleReassignKR(kr.id)}
                disabled={saving}
                className="text-left text-xs text-foreground hover:bg-secondary rounded px-2 py-1.5 truncate"
              >
                <TrendingUp size={10} className="inline mr-1 text-primary" />
                {kr.descricao}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Linha de KR (agora recebe suas próprias tarefas) ────────────────────────
function KRRow({
  kr,
  okrId,
  empresaId,
  tarefas,
  index,
  todosKRs,
  onUpdate,
  onTarefaCriada,
}: {
  kr: KeyResult
  okrId: string
  empresaId: string
  tarefas: TarefaVinculada[]
  index: number
  todosKRs: KeyResult[]
  onUpdate: (newVal: number) => void
  onTarefaCriada: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [tempVal, setTempVal] = useState(String(kr.valorAtual))
  const pct = calcProgress(kr)

  // Inline tarefa creation state
  const [showTarefaInput, setShowTarefaInput] = useState(false)
  const [tarefaTitulo, setTarefaTitulo] = useState('')
  const [savingTarefa, setSavingTarefa] = useState(false)

  function handleSave() {
    const val = parseFloat(tempVal)
    if (!isNaN(val)) onUpdate(val)
    setEditing(false)
  }

  async function handleCreateTarefa() {
    if (!tarefaTitulo.trim()) return
    setSavingTarefa(true)
    try {
      const userId = await getCurrentUserId()
      await createTarefa({
        empresaId,
        titulo: tarefaTitulo.trim(),
        okrId,
        keyResultId: kr.id, // vincula direto ao KR
        criadoPorId: userId || 'system',
      })
      setTarefaTitulo('')
      setShowTarefaInput(false)
      onTarefaCriada()
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
    } finally {
      setSavingTarefa(false)
    }
  }

  return (
    <div className="relative">
      {/* Linha vertical de conexao do OKR aos KRs */}
      <div
        className="absolute left-3 top-0 w-px bg-primary/30"
        style={{ height: 'calc(100% + 0.5rem)' }}
        aria-hidden
      />
      {/* Dot numerado no inicio do KR */}
      <div className="absolute left-1 top-4 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center ring-4 ring-background z-10">
        {index + 1}
      </div>

      <div className="ml-8 flex flex-col gap-2 rounded-lg border border-border bg-background p-3 shadow-sm">
        {/* header do KR */}
        <div className="flex items-start gap-2">
          <TrendingUp size={14} className="text-primary shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-foreground leading-snug flex-1">{kr.descricao}</p>
          <span className={`text-sm font-bold tabular-nums ${getProgressColor(pct)}`}>
            {Math.round(pct)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* metadados */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-muted-foreground">
            {kr.metaInicial} <span className="mx-1">→</span>
          </span>
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={tempVal}
                onChange={(e) => setTempVal(e.target.value)}
                className="h-6 w-20 text-xs bg-card border-border text-foreground px-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') setEditing(false)
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0 bg-primary hover:bg-primary/90 text-white">
                <Check size={11} />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setTempVal(String(kr.valorAtual)); setEditing(true) }}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {kr.valorAtual} {kr.unidade}
              <Pencil size={9} />
            </button>
          )}
          <span className="text-muted-foreground">
            <span className="mx-1">→</span> {kr.metaAlvo} {kr.unidade}
          </span>
          {kr.responsavelNome && (
            <span className="text-muted-foreground ml-auto">
              {kr.responsavelNome.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Tarefas vinculadas a este KR + botao de adicionar */}
        {(tarefas.length > 0 || showTarefaInput) && (
          <div className="mt-1 pt-2 border-t border-border/50 flex flex-col gap-1">
            {tarefas.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                Acoes para atingir este KR
              </p>
            )}
            {tarefas.map((t) => (
              <TarefaItem key={t.id} t={t} leaf keyResults={todosKRs} onReload={onTarefaCriada} />
            ))}
          </div>
        )}

        {/* Input de nova tarefa OU botao */}
        <div className="flex items-center gap-2">
          {showTarefaInput ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                type="text"
                placeholder={`Acao para atingir este KR...`}
                value={tarefaTitulo}
                onChange={(e) => setTarefaTitulo(e.target.value)}
                className="h-7 text-xs bg-card border-border text-foreground px-2 flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTarefa()
                  if (e.key === 'Escape') { setShowTarefaInput(false); setTarefaTitulo('') }
                }}
                autoFocus
                disabled={savingTarefa}
              />
              <Button
                size="sm"
                onClick={handleCreateTarefa}
                disabled={savingTarefa || !tarefaTitulo.trim()}
                className="h-7 px-2 text-xs bg-primary hover:bg-primary/90 text-white gap-1"
              >
                {savingTarefa ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowTarefaInput(false); setTarefaTitulo('') }}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                &times;
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowTarefaInput(true)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus size={11} />
              Adicionar acao
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Card principal do OKR ───────────────────────────────────────────────────
export function OKRCard({ okr, empresaId, onUpdateKRValor }: OKRCardProps) {
  const [expanded, setExpanded] = useState(false)
  const overall = calcOverallProgress(okr)
  const [todasTarefas, setTodasTarefas] = useState<TarefaVinculada[]>([])

  const loadTarefas = useCallback(async () => {
    if (!empresaId) return
    try {
      const data = await getTarefasByEmpresa(empresaId)
      if (data) {
        const linked = (data as unknown as TarefaVinculada[]).filter((t) => {
          // vinculo direto
          if (t.okrId === okr.id) return true
          // vinculo indireto via plano de acao
          if (t.acao?.plano?.okrId === okr.id) return true
          return false
        })
        setTodasTarefas(linked)
      }
    } catch { /* ignore */ }
  }, [empresaId, okr.id])

  useEffect(() => {
    if (expanded) loadTarefas()
  }, [expanded, loadTarefas])

  // Agrupar tarefas por keyResultId (sem KR fica num bucket separado)
  const tarefasPorKR: Record<string, TarefaVinculada[]> = {}
  const tarefasSemKR: TarefaVinculada[] = []
  for (const t of todasTarefas) {
    if (t.keyResultId) {
      if (!tarefasPorKR[t.keyResultId]) tarefasPorKR[t.keyResultId] = []
      tarefasPorKR[t.keyResultId].push(t)
    } else {
      tarefasSemKR.push(t)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* ─── Header: OBJETIVO ─────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left flex flex-col gap-3 p-5 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                <Target size={11} />
                Objetivo
              </div>
              <Badge
                variant="outline"
                className={`text-[11px] border px-2 py-0 ${STATUS_STYLES[okr.status]}`}
              >
                {okr.status}
              </Badge>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <GitBranch size={10} />
                {okr.keyResults.length} KR{okr.keyResults.length !== 1 ? 's' : ''}
                {todasTarefas.length > 0 && (
                  <>
                    <span className="mx-1">·</span>
                    {todasTarefas.length} açõe{todasTarefas.length !== 1 ? 's' : ''}
                  </>
                )}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground leading-snug">
              {okr.objetivo}
            </h3>
            {okr.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2">{okr.descricao}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-lg font-bold tabular-nums ${getProgressColor(overall)}`}>
              {overall}%
            </span>
            {expanded ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(overall)}`}
            style={{ width: `${overall}%` }}
          />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Resp.: <span className="text-foreground">{okr.responsavelNome}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {okr.prazoInicio} — {okr.prazoFim}
          </span>
        </div>
      </button>

      {/* ─── Cascateamento: KRs + Acoes ─────────────────────────── */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-4 bg-secondary/20">
          {okr.keyResults.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Nenhum Key Result definido. Edite o OKR para adicionar resultados-chave.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {okr.keyResults.map((kr, idx) => (
                <KRRow
                  key={kr.id}
                  kr={kr}
                  okrId={okr.id}
                  empresaId={empresaId}
                  tarefas={tarefasPorKR[kr.id] ?? []}
                  index={idx}
                  todosKRs={okr.keyResults}
                  onUpdate={(val) => onUpdateKRValor(okr.id, kr.id, val)}
                  onTarefaCriada={loadTarefas}
                />
              ))}
            </div>
          )}

          {/* Acoes vinculadas ao OKR (direto ou via plano) mas sem KR especifico */}
          {tarefasSemKR.length > 0 && (
            <div className="rounded-lg border border-dashed border-border bg-background/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                <GitBranch size={10} />
                Acoes vinculadas a este OKR (sem KR especifico)
              </p>
              <div className="flex flex-col gap-1">
                {tarefasSemKR.map((t) => (
                  <TarefaItem key={t.id} t={t} keyResults={okr.keyResults} onReload={loadTarefas} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
