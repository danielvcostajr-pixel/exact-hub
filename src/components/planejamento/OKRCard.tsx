'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  onUpdate,
}: {
  kr: KeyResult
  onUpdate: (newVal: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [tempVal, setTempVal] = useState(String(kr.valorAtual))
  const pct = calcProgress(kr)

  function handleSave() {
    const val = parseFloat(tempVal)
    if (!isNaN(val)) onUpdate(val)
    setEditing(false)
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
    </div>
  )
}

export function OKRCard({ okr, onUpdateKRValor }: OKRCardProps) {
  const [expanded, setExpanded] = useState(false)
  const overall = calcOverallProgress(okr)

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

      {/* Expanded KRs */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-2 border-t border-border pt-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Key Results
          </h4>
          {okr.keyResults.map((kr) => (
            <KRRow
              key={kr.id}
              kr={kr}
              onUpdate={(val) => onUpdateKRValor(okr.id, kr.id, val)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
