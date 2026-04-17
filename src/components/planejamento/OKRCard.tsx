'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check, Pencil, Plus, Loader2, CheckCircle, ListTodo } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTarefa, getCurrentUserId, getTarefasByEmpresa } from '@/lib/api/data-service'

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

function KRRow({
  kr,
  okrId,
  empresaId,
  onUpdate,
}: {
  kr: KeyResult
  okrId: string
  empresaId: string
  onUpdate: (newVal: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [tempVal, setTempVal] = useState(String(kr.valorAtual))
  const pct = calcProgress(kr)

  // Inline tarefa creation state
  const [showTarefaInput, setShowTarefaInput] = useState(false)
  const [tarefaTitulo, setTarefaTitulo] = useState('')
  const [savingTarefa, setSavingTarefa] = useState(false)
  const [tarefaCriada, setTarefaCriada] = useState(false)

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
        criadoPorId: userId || 'system',
      })
      setTarefaCriada(true)
      setTarefaTitulo('')
      setTimeout(() => {
        setTarefaCriada(false)
        setShowTarefaInput(false)
      }, 2000)
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
    } finally {
      setSavingTarefa(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground leading-snug flex-1">{kr.descricao}</p>
        <span className={`text-xs font-semibold tabular-nums ${getProgressColor(pct)}`}>
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

      {/* Value display + inline edit */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          Inicial: {kr.metaInicial} {kr.unidade}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">
          Alvo: {kr.metaAlvo} {kr.unidade}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
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
            <span className="text-xs text-muted-foreground">{kr.unidade}</span>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-6 w-6 p-0 bg-primary hover:bg-primary/90 text-white"
            >
              <Check size={11} />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => { setTempVal(String(kr.valorAtual)); setEditing(true) }}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <span className="font-medium">
              Atual: {kr.valorAtual} {kr.unidade}
            </span>
            <Pencil size={10} />
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {kr.responsavelNome.split(' ')[0]}
        </span>
      </div>

      {/* + Tarefa button and inline input */}
      <div className="flex items-center gap-2">
        {tarefaCriada ? (
          <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
            <CheckCircle size={12} />
            Tarefa criada!
          </span>
        ) : showTarefaInput ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              type="text"
              placeholder="Titulo da tarefa..."
              value={tarefaTitulo}
              onChange={(e) => setTarefaTitulo(e.target.value)}
              className="h-6 text-xs bg-card border-border text-foreground px-2 flex-1"
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
              className="h-6 px-2 text-xs bg-primary hover:bg-primary/90 text-white gap-1"
            >
              {savingTarefa ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowTarefaInput(false); setTarefaTitulo('') }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
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
            Tarefa
          </button>
        )}
      </div>
    </div>
  )
}

interface TarefaVinculada {
  id: string
  titulo: string
  status: string
  prioridade: string
  responsavel?: { nome: string } | null
  prazo?: string
}

export function OKRCard({ okr, empresaId, onUpdateKRValor }: OKRCardProps) {
  const [expanded, setExpanded] = useState(false)
  const overall = calcOverallProgress(okr)
  const [tarefasVinculadas, setTarefasVinculadas] = useState<TarefaVinculada[]>([])

  // Load tarefas linked to this OKR
  useEffect(() => {
    if (!expanded || !empresaId) return
    async function loadTarefas() {
      try {
        const data = await getTarefasByEmpresa(empresaId)
        if (data) {
          const linked = (data as unknown as TarefaVinculada[]).filter((t) => (t as unknown as { okrId?: string }).okrId === okr.id)
          setTarefasVinculadas(linked)
        }
      } catch { /* ignore */ }
    }
    loadTarefas()
  }, [expanded, empresaId, okr.id])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left flex flex-col gap-3 p-5 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[11px] border px-2 py-0 ${STATUS_STYLES[okr.status]}`}
              >
                {okr.status}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {okr.keyResults.length} Key Result{okr.keyResults.length !== 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground leading-snug truncate">
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

      {/* Expanded KRs + Tarefas */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-2 border-t border-border pt-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Key Results
          </h4>
          {okr.keyResults.map((kr) => (
            <KRRow
              key={kr.id}
              kr={kr}
              okrId={okr.id}
              empresaId={empresaId}
              onUpdate={(val) => onUpdateKRValor(okr.id, kr.id, val)}
            />
          ))}

          {/* Tarefas vinculadas a este OKR */}
          {tarefasVinculadas.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ListTodo size={12} />
                Tarefas Vinculadas ({tarefasVinculadas.length})
              </h4>
              <div className="flex flex-col gap-1.5">
                {tarefasVinculadas.map((t) => {
                  const statusColors: Record<string, string> = {
                    BACKLOG: 'bg-secondary text-muted-foreground',
                    A_FAZER: 'bg-blue-500/15 text-blue-500',
                    EM_PROGRESSO: 'bg-yellow-500/15 text-yellow-600',
                    REVISAO: 'bg-purple-500/15 text-purple-500',
                    CONCLUIDA: 'bg-green-500/15 text-green-500',
                    CANCELADA: 'bg-red-500/15 text-red-500',
                  }
                  const statusLabels: Record<string, string> = {
                    BACKLOG: 'Backlog', A_FAZER: 'A Fazer', EM_PROGRESSO: 'Em Progresso',
                    REVISAO: 'Revisao', CONCLUIDA: 'Concluida', CANCELADA: 'Cancelada',
                  }
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {t.status === 'CONCLUIDA' ? (
                          <CheckCircle size={14} className="text-green-500 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        )}
                        <span className={`text-sm truncate ${t.status === 'CONCLUIDA' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {t.titulo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.responsavel?.nome && (
                          <span className="text-[10px] text-muted-foreground">{t.responsavel.nome.split(' ')[0]}</span>
                        )}
                        <Badge className={`text-[9px] h-4 px-1.5 border-0 ${statusColors[t.status] ?? statusColors.BACKLOG}`}>
                          {statusLabels[t.status] ?? t.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
