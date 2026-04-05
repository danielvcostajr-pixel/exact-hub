'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, AlertCircle, Loader2, History, CalendarDays, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { saveExecucaoRotina, getCurrentUserId, getHistoricoExecucoesRotina } from '@/lib/api/data-service'

export type FrequenciaRotina = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL'
export type CategoriaRotina = 'Financeiro' | 'Comercial' | 'Operacional' | 'RH' | 'Marketing'

export interface ItemControle {
  id: string
  descricao: string
  obrigatorio: boolean
  tipo: 'CHECK' | 'NUMERO' | 'TEXTO'
  dica?: string
}

export interface Rotina {
  id: string
  nome: string
  descricao: string
  categoria: CategoriaRotina
  frequencia: FrequenciaRotina
  diaExecucao: string
  proximaExecucao: string
  itens: ItemControle[]
  ultimaExecucao?: string
}

interface RotinaCardProps {
  rotina: Rotina
  onFinalizar?: (rotinaId: string) => void
}

const FREQ_LABELS: Record<FrequenciaRotina, string> = {
  DIARIA: 'Diaria',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
}

const FREQ_COLORS: Record<FrequenciaRotina, string> = {
  DIARIA: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  SEMANAL: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  QUINZENAL: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  MENSAL: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
}

const CAT_COLORS: Record<string, string> = {
  Financeiro: 'bg-green-500/15 text-green-600 border-green-500/30',
  Comercial: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  Operacional: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
  RH: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
  Marketing: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
}

function parseDiaSemana(dia: string): number {
  const map: Record<string, number> = {
    domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
    'segunda-feira': 1, 'terca-feira': 2, 'quarta-feira': 3, 'quinta-feira': 4, 'sexta-feira': 5,
  }
  return map[dia.toLowerCase()] ?? 1
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
}

interface ExecucaoState {
  [itemId: string]: {
    checked: boolean
    observacao: string
  }
}

export function RotinaCard({ rotina, onFinalizar }: RotinaCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [execucao, setExecucao] = useState<ExecucaoState>(() =>
    Object.fromEntries(
      rotina.itens.map((it) => [it.id, { checked: false, observacao: '' }])
    )
  )
  const [finalizado, setFinalizado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [showHistorico, setShowHistorico] = useState(false)
  const [historico, setHistorico] = useState<{ data: string; concluida: boolean }[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  useEffect(() => {
    if (!showHistorico) return
    setLoadingHistorico(true)
    getHistoricoExecucoesRotina(rotina.id, 30)
      .then((execucoes) => {
        // Group executions by date (YYYY-MM-DD) — a day is "concluida" if any execution exists
        const diasExecutados = new Set<string>()
        for (const exec of execucoes) {
          const d = new Date(exec.dataExecucao).toISOString().split('T')[0]
          diasExecutados.add(d)
        }

        // Build last 30 days array, filtering by frequency
        const dias: { data: string; concluida: boolean }[] = []
        const hoje = new Date()
        for (let i = 0; i < 30; i++) {
          const d = new Date(hoje)
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          const dayOfWeek = d.getDay() // 0=Sun, 6=Sat

          // Filter days based on frequency
          let shouldShow = true
          if (rotina.frequencia === 'DIARIA') {
            shouldShow = dayOfWeek !== 0 && dayOfWeek !== 6 // weekdays only
          } else if (rotina.frequencia === 'SEMANAL') {
            const targetDay = rotina.diaExecucao ? parseDiaSemana(rotina.diaExecucao) : 1
            shouldShow = dayOfWeek === targetDay
          } else if (rotina.frequencia === 'QUINZENAL') {
            // Show every other week
            const weekNum = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000))
            shouldShow = weekNum % 2 === 0 && dayOfWeek === (rotina.diaExecucao ? parseDiaSemana(rotina.diaExecucao) : 1)
          } else if (rotina.frequencia === 'MENSAL') {
            shouldShow = d.getDate() === (typeof rotina.diaExecucao === 'string' ? parseInt(rotina.diaExecucao) || 1 : 1)
          }

          if (shouldShow) {
            dias.push({ data: dateStr, concluida: diasExecutados.has(dateStr) })
          }
        }
        setHistorico(dias)
      })
      .catch(console.error)
      .finally(() => setLoadingHistorico(false))
  }, [showHistorico, rotina.id, rotina.frequencia, rotina.diaExecucao])

  const checkedCount = rotina.itens.filter((it) => execucao[it.id]?.checked).length
  const totalCount = rotina.itens.length
  const progressoPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  const obrigatoriosNaoFeitos = rotina.itens.filter(
    (it) => it.obrigatorio && !execucao[it.id]?.checked
  )
  const podeFinalizar = obrigatoriosNaoFeitos.length === 0 && checkedCount > 0

  function toggleItem(itemId: string) {
    if (finalizado) return
    setExecucao((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], checked: !prev[itemId]?.checked },
    }))
  }

  function setObservacao(itemId: string, obs: string) {
    setExecucao((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], observacao: obs },
    }))
  }

  async function handleFinalizar() {
    setSalvando(true)
    try {
      const userId = await getCurrentUserId()
      if (userId) {
        await saveExecucaoRotina({
          itens: rotina.itens.map((it) => ({
            itemControleId: it.id,
            concluido: execucao[it.id]?.checked ?? false,
            observacao: execucao[it.id]?.observacao || undefined,
          })),
          executadoPorId: userId,
        })
      }
      setFinalizado(true)
      onFinalizar?.(rotina.id)
    } catch (err) {
      console.error('Erro ao finalizar rotina:', err)
      alert('Erro ao salvar execucao. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      className={`rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md ${
        finalizado ? 'border-green-500/40 bg-green-500/5' : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[11px] border px-2 py-0 ${FREQ_COLORS[rotina.frequencia] ?? FREQ_COLORS.SEMANAL}`}
              >
                {FREQ_LABELS[rotina.frequencia] ?? rotina.frequencia}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] border px-2 py-0 ${CAT_COLORS[rotina.categoria] ?? CAT_COLORS.Operacional}`}
              >
                {rotina.categoria}
              </Badge>
              {finalizado && (
                <Badge variant="outline" className="text-[11px] border px-2 py-0 bg-green-500/15 text-green-500 border-green-500/30">
                  Concluida
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground">{rotina.nome}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{rotina.descricao}</p>
          </div>

          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {rotina.itens.length} ite{rotina.itens.length !== 1 ? 'ns' : 'm'} do checklist
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            Execucao: <span className="text-foreground">{rotina.diaExecucao || 'A definir'}</span>
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            Proxima: <span className="text-foreground">{rotina.proximaExecucao || 'A definir'}</span>
          </span>
        </div>

        {/* Progress bar - always visible when items exist */}
        {totalCount > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Progresso da execucao</span>
              <span className="text-xs font-medium text-foreground">{checkedCount}/{totalCount}</span>
            </div>
            <Progress value={progressoPct} className="h-1.5" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!finalizado && (
            <Button
              size="sm"
              disabled={!podeFinalizar || salvando}
              onClick={handleFinalizar}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8 text-xs disabled:opacity-50"
            >
              {salvando ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              {salvando ? 'Salvando...' : 'Finalizar Rotina'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistorico((p) => !p)}
            className="gap-1.5 h-8 text-xs"
          >
            <History size={12} />
            {showHistorico ? 'Ocultar Historico' : 'Historico'}
          </Button>
          {!finalizado && obrigatoriosNaoFeitos.length > 0 && checkedCount > 0 && (
            <span className="text-xs text-orange-500 flex items-center gap-1">
              <AlertCircle size={12} />
              {obrigatoriosNaoFeitos.length} obrigatorio{obrigatoriosNaoFeitos.length !== 1 ? 's' : ''} pendente{obrigatoriosNaoFeitos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Historico de execucoes */}
      {showHistorico && (
        <div className="px-5 pb-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={14} className="text-muted-foreground" />
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Historico - Ultimos 30 dias
            </h4>
          </div>
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : historico.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nenhum registro de execucao nos ultimos 30 dias.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm bg-green-500" />
                  <span className="text-xs text-muted-foreground">Realizada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm bg-red-500/70" />
                  <span className="text-xs text-muted-foreground">Nao realizada</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
                {historico.map((dia) => (
                  <div
                    key={dia.data}
                    className={`relative flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-center ${
                      dia.concluida
                        ? 'bg-green-500/15 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                    title={`${formatDateBR(dia.data)} - ${dia.concluida ? 'Realizada' : 'Nao realizada'}`}
                  >
                    <span className="text-[10px] text-muted-foreground leading-none">
                      {getDayName(dia.data)}
                    </span>
                    <span className="text-xs font-medium leading-none">
                      {formatDateBR(dia.data)}
                    </span>
                    {dia.concluida ? (
                      <Check size={12} className="text-green-500" />
                    ) : (
                      <X size={12} className="text-red-500/70" />
                    )}
                  </div>
                ))}
              </div>
              {(() => {
                const total = historico.length
                const feitas = historico.filter(d => d.concluida).length
                const pct = total > 0 ? Math.round((feitas / total) * 100) : 0
                return (
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Taxa de cumprimento: <span className={`font-semibold ${pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-orange-500' : 'text-red-500'}`}>{pct}%</span>
                    </span>
                    <span className="text-muted-foreground">({feitas}/{total} execucoes)</span>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* Checklist - always interactive */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Checklist da Rotina
          </h4>
          {rotina.itens.map((item) => {
            const state = execucao[item.id]
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 flex flex-col gap-2 transition-colors cursor-pointer ${
                  state?.checked
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-border bg-background hover:border-primary/30'
                } ${finalizado ? 'cursor-default' : ''}`}
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    {state?.checked ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-sm ${
                          state?.checked ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {item.descricao}
                      </span>
                      {item.obrigatorio && (
                        <span className="text-red-500 text-xs font-bold leading-none">*</span>
                      )}
                    </div>
                    {item.dica && (
                      <span className="text-xs text-muted-foreground/70">{item.dica}</span>
                    )}
                  </div>
                </div>
                {state?.checked && (
                  <div className="ml-7" onClick={(e) => e.stopPropagation()}>
                    <Textarea
                      placeholder="Observacao (opcional)..."
                      value={state.observacao}
                      onChange={(e) => setObservacao(item.id, e.target.value)}
                      className="h-14 text-xs bg-card border-border text-foreground placeholder:text-muted-foreground resize-none"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
