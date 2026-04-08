'use client'

import type { LinhaDRE } from '@/types'
import { formatarMoeda, MESES, getMesesReordenados, rotateArray } from '@/lib/calculations/financeiro'
// scroll-area removed — using native overflow-x-auto

interface DREProjetadoProps {
  linhas: LinhaDRE[]
  mesInicial?: number
}

function isPercentRow(label: string): boolean {
  return label.includes('(%)') && !label.includes('(R$)')
}

function formatarValorDRE(linha: LinhaDRE, valor: number): string {
  if (linha.tipo === 'kpi' && linha.label === 'INDICADORES') return ''
  if (linha.tipo === 'kpi' && isPercentRow(linha.label)) {
    return `${valor.toFixed(1)}%`
  }
  return formatarMoeda(valor)
}

function corValorDRE(linha: LinhaDRE, valor: number): string {
  if (linha.tipo === 'kpi') {
    if (linha.label === 'INDICADORES') return 'text-muted-foreground'
    return valor > 0 ? 'text-blue-400' : valor < 0 ? 'text-red-400' : 'text-muted-foreground'
  }
  if (linha.tipo === 'deducao') {
    return valor > 0 ? 'text-red-400' : 'text-muted-foreground'
  }
  if (linha.tipo === 'resultado' || linha.destaque) {
    return valor > 0 ? 'text-green-400' : valor < 0 ? 'text-red-400' : 'text-muted-foreground'
  }
  if (linha.tipo === 'receita') {
    return 'text-foreground'
  }
  return valor >= 0 ? 'text-foreground' : 'text-red-400'
}

function corTotalDRE(linha: LinhaDRE, total: number): string {
  return corValorDRE(linha, total)
}

export function DREProjetado({ linhas: linhasRaw, mesInicial = 0 }: DREProjetadoProps) {
  const mesesLabels = getMesesReordenados(mesInicial)
  // Rotacionar valores para alinhar com labels de meses
  const linhas = (linhasRaw ?? []).map(l => {
    const rotated = rotateArray([...l.valores], mesInicial)
    return { ...l, valores: rotated }
  })

  if (!linhas || linhas.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-card border border-border rounded-xl">
        <p className="text-muted-foreground text-sm">
          Configure os dados financeiros para gerar o DRE
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">DRE — Demonstracao do Resultado do Exercicio</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Projecao competencia — 12 meses</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1400px]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium sticky left-0 bg-card min-w-[220px] z-10">
                  Descricao
                </th>
                {mesesLabels.map((mes) => (
                  <th
                    key={mes}
                    className="text-right px-3 py-3 text-muted-foreground font-medium font-numbers min-w-[88px]"
                  >
                    {mes}
                  </th>
                ))}
                <th className="text-right px-3 py-3 text-primary font-semibold font-numbers min-w-[100px] bg-primary/5">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, i) => {
                const isDestaque = linha.destaque ?? false
                const indent = linha.indentacao ?? 0
                const isKpi = linha.tipo === 'kpi'
                const isKpiHeader = isKpi && linha.label === 'INDICADORES'

                return (
                  <tr
                    key={i}
                    className={`border-b border-border/50 transition-colors ${
                      isKpiHeader
                        ? 'bg-blue-500/10'
                        : isKpi
                        ? 'bg-blue-500/5 hover:bg-blue-500/10'
                        : isDestaque
                        ? 'bg-secondary/30 hover:bg-secondary/50'
                        : 'hover:bg-secondary/15'
                    }`}
                  >
                    <td
                      className={`px-4 py-2 sticky left-0 z-10 ${
                        isKpiHeader
                          ? 'bg-blue-500/10'
                          : isKpi
                          ? 'bg-blue-500/5'
                          : isDestaque ? 'bg-secondary/30' : 'bg-card'
                      }`}
                    >
                      <span
                        className={`${
                          isKpiHeader
                            ? 'text-blue-400 font-bold text-[11px] uppercase tracking-wider'
                            : isKpi
                            ? 'text-blue-300 font-medium'
                            : isDestaque
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground font-normal'
                        }`}
                        style={{ paddingLeft: `${indent * 16}px`, display: 'block' }}
                      >
                        {linha.label}
                      </span>
                    </td>
                    {linha.valores.map((valor, j) => (
                      <td
                        key={j}
                        className={`px-3 py-2 text-right font-numbers ${
                          isDestaque || isKpi ? 'font-semibold' : 'font-normal'
                        } ${corValorDRE(linha, valor)}`}
                      >
                        {isKpiHeader ? '' : formatarValorDRE(linha, valor)}
                      </td>
                    ))}
                    <td
                      className={`px-3 py-2 text-right font-numbers font-semibold ${
                        isKpi ? 'bg-blue-500/5' : 'bg-primary/5'
                      } ${corTotalDRE(linha, linha.total)}`}
                    >
                      {isKpiHeader ? '' : formatarValorDRE(linha, linha.total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
