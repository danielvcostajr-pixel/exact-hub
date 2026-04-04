'use client'

import { useState } from 'react'
import { Play, CheckCircle2, Circle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

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

const CAT_COLORS: Record<CategoriaRotina, string> = {
  Financeiro: 'bg-green-500/15 text-green-600 border-green-500/30',
  Comercial: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  Operacional: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
  RH: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
  Marketing: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
}

interface ExecucaoState {
  [itemId: string]: {
    checked: boolean
    observacao: string
    valor?: string
  }
}

export function RotinaCard({ rotina, onFinalizar }: RotinaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [executando, setExecutando] = useState(false)
  const [execucao, setExecucao] = useState<ExecucaoState>(() =>
    Object.fromEntries(
      rotina.itens.map((it) => [it.id, { checked: false, observacao: '', valor: '' }])
    )
  )
  const [finalizado, setFinalizado] = useState(false)

  const checkedCount = rotina.itens.filter((it) => execucao[it.id]?.checked).length
  const totalCount = rotina.itens.length
  const progressoPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  const obrigatoriosNaoFeitos = rotina.itens.filter(
    (it) => it.obrigatorio && !execucao[it.id]?.checked
  )
  const podeFinalizar = obrigatoriosNaoFeitos.length === 0

  function toggleItem(itemId: string) {
    setExecucao((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], checked: !prev[itemId].checked },
    }))
  }

  function setObservacao(itemId: string, obs: string) {
    setExecucao((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], observacao: obs },
    }))
  }

  function handleIniciarExecucao() {
    setExecutando(true)
    setExpanded(true)
  }

  function handleFinalizar() {
    setFinalizado(true)
    setExecutando(false)
    onFinalizar?.(rotina.id)
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
                className={`text-[11px] border px-2 py-0 ${FREQ_COLORS[rotina.frequencia]}`}
              >
                {FREQ_LABELS[rotina.frequencia]}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] border px-2 py-0 ${CAT_COLORS[rotina.categoria]}`}
              >
                {rotina.categoria}
              </Badge>
              {finalizado && (
                <Badge
                  variant="outline"
                  className="text-[11px] border px-2 py-0 bg-green-500/15 text-green-500 border-green-500/30"
                >
                  Concluida
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground">{rotina.nome}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{rotina.descricao}</p>
          </div>

          {/* Expand toggle */}
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
            {rotina.itens.length} item{rotina.itens.length !== 1 ? 's' : ''} de controle
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            Execucao: <span className="text-foreground">{rotina.diaExecucao}</span>
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            Proxima: <span className="text-foreground">{rotina.proximaExecucao}</span>
          </span>
          {rotina.ultimaExecucao && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                Ultima: <span className="text-foreground">{rotina.ultimaExecucao}</span>
              </span>
            </>
          )}
        </div>

        {/* Execution progress bar */}
        {executando && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Progresso da execucao
              </span>
              <span className="text-xs font-medium text-foreground">
                {checkedCount}/{totalCount}
              </span>
            </div>
            <Progress value={progressoPct} className="h-1.5" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!executando && !finalizado && (
            <Button
              size="sm"
              onClick={handleIniciarExecucao}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-1.5 h-8 text-xs"
            >
              <Play size={12} />
              Executar
            </Button>
          )}
          {executando && (
            <Button
              size="sm"
              disabled={!podeFinalizar}
              onClick={handleFinalizar}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8 text-xs disabled:opacity-50"
            >
              <CheckCircle2 size={12} />
              Finalizar Rotina
            </Button>
          )}
          {executando && !podeFinalizar && (
            <span className="text-xs text-orange-500 flex items-center gap-1">
              <AlertCircle size={12} />
              {obrigatoriosNaoFeitos.length} item{obrigatoriosNaoFeitos.length !== 1 ? 's' : ''} obrigatorio{obrigatoriosNaoFeitos.length !== 1 ? 's' : ''} pendente{obrigatoriosNaoFeitos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Expandable checklist */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Itens de Controle
          </h4>
          {rotina.itens.map((item) => {
            const state = execucao[item.id]
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 flex flex-col gap-2 transition-colors ${
                  state?.checked
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start gap-2">
                  {executando ? (
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {state?.checked ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                  ) : (
                    <div className="mt-0.5 shrink-0">
                      <Circle size={16} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-sm ${
                          state?.checked
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
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
                {executando && state?.checked && item.tipo !== 'CHECK' && (
                  <div className="ml-6">
                    <Textarea
                      placeholder={
                        item.tipo === 'TEXTO'
                          ? 'Observacao...'
                          : 'Informar valor...'
                      }
                      value={state.observacao}
                      onChange={(e) => setObservacao(item.id, e.target.value)}
                      className="h-16 text-xs bg-card border-border text-foreground placeholder:text-muted-foreground resize-none"
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
