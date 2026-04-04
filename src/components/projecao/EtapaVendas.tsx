'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { PremissasVendas, HistoricoFaturamento, CenarioTipo } from '@/types'
import { TrendingUp, Calendar, Target } from 'lucide-react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const CENARIO_CONFIG: Record<CenarioTipo, { label: string; defaultVal: number; color: string; bg: string }> = {
  pessimista: { label: 'Pessimista (%)', defaultVal: -14, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  realista:   { label: 'Realista (%)',   defaultVal: 0,   color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  otimista:   { label: 'Otimista (%)',   defaultVal: 16,  color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  agressivo:  { label: 'Agressivo (%)',  defaultVal: 30,  color: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
}

interface Props {
  premissas: PremissasVendas
  onChange: (p: PremissasVendas) => void
  anoBase: number
  onAnoBaseChange: (ano: number) => void
}

export default function EtapaVendas({ premissas, onChange, anoBase, onAnoBaseChange }: Props) {
  const anosDisponiveis: number[] = []
  for (let a = 2020; a <= new Date().getFullYear() + 1; a++) {
    anosDisponiveis.push(a)
  }

  function handleAnoChange(novoAno: string) {
    const ano = parseInt(novoAno)
    onAnoBaseChange(ano)
    // Update all historico entries to the new year
    const novoHistorico = premissas.historico.map(h => ({ ...h, ano }))
    onChange({ ...premissas, historico: novoHistorico })
  }

  function getHistoricoValor(mes: number): string {
    const item = premissas.historico.find(h => h.mes === mes + 1)
    return item ? String(item.valor) : ''
  }

  function handleHistoricoChange(mesIndex: number, raw: string) {
    const valor = parseFloat(raw.replace(',', '.')) || 0
    const mes = mesIndex + 1
    const novoHistorico: HistoricoFaturamento[] = premissas.historico.filter(h => h.mes !== mes)
    if (raw !== '') {
      novoHistorico.push({ mes, ano: anoBase, valor })
    }
    onChange({ ...premissas, historico: novoHistorico })
  }

  function handleCenarioChange(campo: CenarioTipo, raw: string) {
    const val = parseFloat(raw.replace(',', '.'))
    onChange({
      ...premissas,
      cenarios: {
        ...premissas.cenarios,
        [campo]: isNaN(val) ? 0 : val,
      },
    })
  }

  function handleCrescimentoChange(raw: string) {
    const val = parseFloat(raw.replace(',', '.'))
    onChange({ ...premissas, taxaCrescimentoBase: isNaN(val) ? 0 : val })
  }

  function handleCenarioAtivoChange(val: string) {
    onChange({
      ...premissas,
      cenarios: { ...premissas.cenarios, ativo: val as CenarioTipo },
    })
  }

  return (
    <div className="space-y-6">
      {/* Historico de Faturamento */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Calendar size={18} className="text-primary" />
              Historico de Faturamento — {anoBase}
            </CardTitle>
            <Select value={String(anoBase)} onValueChange={handleAnoChange}>
              <SelectTrigger className="h-8 w-[120px] text-sm bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border">
                {anosDisponiveis.map(a => (
                  <SelectItem key={a} value={String(a)} className="text-foreground">{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            Preencha o faturamento mensal do ano selecionado para calcular a projecao.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {MESES.map((mes, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  {mes}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0,00"
                    value={getHistoricoValor(i)}
                    onChange={e => handleHistoricoChange(i, e.target.value)}
                    className="pl-8 text-sm h-9 bg-background border-border text-foreground"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Crescimento Base */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <TrendingUp size={18} className="text-primary" />
            Crescimento Base
          </CardTitle>
          <p className="text-xs mt-1 text-muted-foreground">
            Taxa de crescimento aplicada sobre o LTM (últimos 12 meses) para calcular o cenário realista.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 max-w-xs">
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Taxa de Crescimento Base
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step={0.1}
                  placeholder="0"
                  value={premissas.taxaCrescimentoBase}
                  onChange={e => handleCrescimentoChange(e.target.value)}
                  className="pr-8 h-9 text-sm bg-background border-border text-foreground"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cenarios */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Target size={18} className="text-primary" />
            Cenários de Crescimento
          </CardTitle>
          <p className="text-xs mt-1 text-muted-foreground">
            Defina os multiplicadores de cada cenário sobre o crescimento base.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(Object.keys(CENARIO_CONFIG) as CenarioTipo[]).map(tipo => {
              const cfg = CENARIO_CONFIG[tipo]
              const isAtivo = premissas.cenarios.ativo === tipo
              return (
                <div
                  key={tipo}
                  className="rounded-lg p-3 space-y-2 transition-all"
                  style={{
                    backgroundColor: cfg.bg,
                    border: `1px solid ${isAtivo ? cfg.color : 'hsl(var(--border))'}`,
                  }}
                >
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step={0.1}
                      value={premissas.cenarios[tipo]}
                      onChange={e => handleCenarioChange(tipo, e.target.value)}
                      className="pr-7 h-9 text-sm font-medium"
                      style={{
                        backgroundColor: 'rgba(8,10,12,0.6)',
                        border: `1px solid ${cfg.color}33`,
                        color: cfg.color,
                      }}
                    />
                    <span
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                      style={{ color: cfg.color }}
                    >
                      %
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2 max-w-xs">
            <Label className="text-sm font-medium text-foreground">
              Cenário Ativo
            </Label>
            <p className="text-xs text-muted-foreground">
              Este cenário alimenta os cálculos do PROFECIA.
            </p>
            <Select value={premissas.cenarios.ativo} onValueChange={handleCenarioAtivoChange}>
              <SelectTrigger
                className="h-9 bg-background border-border text-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border">
                {(Object.keys(CENARIO_CONFIG) as CenarioTipo[]).map(tipo => (
                  <SelectItem
                    key={tipo}
                    value={tipo}
                    style={{ color: CENARIO_CONFIG[tipo].color }}
                  >
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)} ({premissas.cenarios[tipo] >= 0 ? '+' : ''}{premissas.cenarios[tipo]}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
