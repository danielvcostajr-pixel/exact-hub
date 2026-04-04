'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { CondicoesRecebimento, DistribuicaoParcela } from '@/types'
import { CreditCard, Plus, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react'

interface Props {
  condicoes: CondicoesRecebimento
  onChange: (c: CondicoesRecebimento) => void
}

const MAX_PARCELAS = 12

export default function EtapaRecebimentos({ condicoes, onChange }: Props) {
  // How many parcela rows are visible (start with 3)
  const [parcelasVisiveis, setParcelasVisiveis] = useState<number>(() => {
    const maxExistente = condicoes.distribuicaoParcelas.reduce(
      (acc, d) => Math.max(acc, d.qtdParcelas),
      3
    )
    return maxExistente
  })

  function handleAVista(raw: string) {
    const av = Math.min(100, Math.max(0, parseFloat(raw) || 0))
    const ap = Math.round((100 - av) * 10) / 10
    onChange({ ...condicoes, percentualAVista: av, percentualAPrazo: ap })
  }

  function handleAPrazo(raw: string) {
    const ap = Math.min(100, Math.max(0, parseFloat(raw) || 0))
    const av = Math.round((100 - ap) * 10) / 10
    onChange({ ...condicoes, percentualAVista: av, percentualAPrazo: ap })
  }

  function getParcelaPerc(qtd: number): string {
    const item = condicoes.distribuicaoParcelas.find(d => d.qtdParcelas === qtd)
    return item ? String(item.percentual) : ''
  }

  function handleParcelaChange(qtd: number, raw: string) {
    const perc = parseFloat(raw) || 0
    const sem = condicoes.distribuicaoParcelas.filter(d => d.qtdParcelas !== qtd)
    const nova: DistribuicaoParcela[] = raw !== ''
      ? [...sem, { qtdParcelas: qtd, percentual: perc }]
      : sem
    onChange({ ...condicoes, distribuicaoParcelas: nova })
  }

  function adicionarParcela() {
    if (parcelasVisiveis < MAX_PARCELAS) {
      setParcelasVisiveis(prev => prev + 1)
    }
  }

  const totalParcelas = condicoes.distribuicaoParcelas.reduce((s, d) => s + d.percentual, 0)
  const parcelasOk = Math.abs(totalParcelas - 100) < 0.01 || condicoes.distribuicaoParcelas.length === 0

  function toggleAntecipacao() {
    onChange({ ...condicoes, antecipaRecebiveis: !condicoes.antecipaRecebiveis })
  }

  function handleAntecipacaoPerc(raw: string) {
    onChange({ ...condicoes, percentualAntecipacao: parseFloat(raw) || 0 })
  }

  function handleTaxaDesconto(raw: string) {
    onChange({ ...condicoes, taxaDesconto: parseFloat(raw) || 0 })
  }

  const aVista = condicoes.percentualAVista
  const aPrazo = condicoes.percentualAPrazo

  return (
    <div className="space-y-6">
      {/* A Vista vs A Prazo */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <CreditCard size={18} className="text-primary" />
            Vendas à Vista vs. a Prazo
          </CardTitle>
          <p className="text-xs mt-1 text-muted-foreground">
            Defina a proporção do recebimento. Os percentuais devem somar 100%.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">À Vista (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={aVista}
                  onChange={e => handleAVista(e.target.value)}
                  className="pr-7 h-10 text-sm font-semibold"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--primary))',
                    color: 'hsl(var(--primary))',
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">A Prazo (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={aPrazo}
                  onChange={e => handleAPrazo(e.target.value)}
                  className="pr-7 h-10 text-sm font-semibold bg-background border-border text-foreground"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Visual bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-secondary">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${aVista}%`, backgroundColor: 'hsl(var(--primary))' }}
            />
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${aPrazo}%`, backgroundColor: '#4B5563' }}
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block bg-primary" />
              À Vista: {aVista}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#4B5563' }} />
              A Prazo: {aPrazo}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Distribuicao de Parcelas */}
      {aPrazo > 0 && (
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                Distribuição de Parcelas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: parcelasOk ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: parcelasOk ? '#22c55e' : '#ef4444',
                    border: 'none',
                    fontSize: '11px',
                  }}
                >
                  Total: {totalParcelas.toFixed(1)}%
                </Badge>
                {!parcelasOk && (
                  <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                )}
              </div>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              Defina como as vendas a prazo se distribuem entre as parcelas. Deve somar 100%.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-2 gap-4 max-w-xs">
                <span className="text-xs font-semibold text-muted-foreground">Parcelas</span>
                <span className="text-xs font-semibold text-muted-foreground">% das vendas a prazo</span>
              </div>
              {/* Rows */}
              {Array.from({ length: parcelasVisiveis }, (_, i) => i + 1).map(qtd => (
                <div key={qtd} className="grid grid-cols-2 gap-4 max-w-xs items-center">
                  <span className="text-sm font-medium text-foreground">
                    {qtd}x
                  </span>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="0"
                      value={getParcelaPerc(qtd)}
                      onChange={e => handleParcelaChange(qtd, e.target.value)}
                      className="pr-7 h-8 text-sm bg-background border-border text-foreground"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>

            {!parcelasOk && totalParcelas > 0 && (
              <p className="text-xs flex items-center gap-1" style={{ color: '#ef4444' }}>
                <AlertTriangle size={12} />
                A soma das parcelas deve ser 100%. Atual: {totalParcelas.toFixed(1)}%
              </p>
            )}

            {parcelasVisiveis < MAX_PARCELAS && (
              <Button
                variant="ghost"
                size="sm"
                onClick={adicionarParcela}
                className="text-xs h-7 px-2 text-primary"
              >
                <Plus size={12} className="mr-1" />
                Adicionar parcela
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Antecipacao */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            Antecipação de Recebíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={toggleAntecipacao}
            className="flex items-center gap-3 group"
          >
            {condicoes.antecipaRecebiveis
              ? <ToggleRight size={28} className="text-primary" />
              : <ToggleLeft size={28} style={{ color: '#4B5563' }} />
            }
            <span className={`text-sm ${condicoes.antecipaRecebiveis ? 'text-foreground' : 'text-muted-foreground'}`}>
              {condicoes.antecipaRecebiveis ? 'Antecipa recebíveis' : 'Não antecipa recebíveis'}
            </span>
          </button>

          {condicoes.antecipaRecebiveis && (
            <>
              <Separator className="bg-border" />
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">% Antecipação</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={condicoes.percentualAntecipacao}
                      onChange={e => handleAntecipacaoPerc(e.target.value)}
                      className="pr-7 h-9 text-sm bg-background border-border text-foreground"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Taxa Desconto (% a.m.)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={condicoes.taxaDesconto}
                      onChange={e => handleTaxaDesconto(e.target.value)}
                      className="pr-7 h-9 text-sm bg-background border-border text-foreground"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
