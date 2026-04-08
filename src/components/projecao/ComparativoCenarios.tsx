'use client'

import type { ProjecaoFaturamento } from '@/types'
import { formatarMoeda, MESES, getMesesReordenados } from '@/lib/calculations/financeiro'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ComparativoCenariosProps {
  projecoes: ProjecaoFaturamento[]
  cenarioAtivo?: string
  mesInicial?: number
}

const CENARIOS = [
  { key: 'valorPessimista', label: 'Pessimista', color: '#F87171' },
  { key: 'valorRealista',   label: 'Realista',   color: '#60A5FA' },
  { key: 'valorOtimista',   label: 'Otimista',   color: '#4ADE80' },
  { key: 'valorAgressivo',  label: 'Agressivo',  color: '#C084FC' },
] as const

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const labelMap: Record<string, string> = {
    valorPessimista: 'Pessimista',
    valorRealista: 'Realista',
    valorOtimista: 'Otimista',
    valorAgressivo: 'Agressivo',
  }
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-foreground font-medium mb-2 text-sm">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground text-xs">{labelMap[entry.name] ?? entry.name}</span>
          </div>
          <span className="font-numbers text-foreground text-xs font-medium">
            {formatarMoeda(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface CustomLegendProps {
  payload?: Array<{ value: string; color: string }>
}

function CustomLegend({ payload }: CustomLegendProps) {
  const labelMap: Record<string, string> = {
    valorPessimista: 'Pessimista',
    valorRealista: 'Realista',
    valorOtimista: 'Otimista',
    valorAgressivo: 'Agressivo',
  }
  return (
    <div className="flex items-center justify-center gap-6 mt-3 flex-wrap">
      {payload?.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground text-xs">{labelMap[entry.value] ?? entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function ComparativoCenarios({ projecoes, cenarioAtivo, mesInicial = 0 }: ComparativoCenariosProps) {
  const mesesLabels = getMesesReordenados(mesInicial)
  if (!projecoes || projecoes.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-card border border-border rounded-xl">
        <p className="text-muted-foreground text-sm">Preencha o historico para visualizar os cenarios</p>
      </div>
    )
  }

  // Reordenar projeções a partir do mesInicial
  const sorted = [...projecoes].sort((a, b) => {
    const aIdx = ((a.mes - 1 - mesInicial + 12) % 12)
    const bIdx = ((b.mes - 1 - mesInicial + 12) % 12)
    return aIdx - bIdx
  })

  const chartData = sorted.map((p) => ({
    mes: MESES[(p.mes - 1 + 12) % 12] ?? `M${p.mes}`,
    valorPessimista: Math.round(p.valorPessimista),
    valorRealista: Math.round(p.valorRealista),
    valorOtimista: Math.round(p.valorOtimista),
    valorAgressivo: Math.round(p.valorAgressivo),
  }))

  const totais = {
    valorPessimista: sorted.reduce((s, p) => s + p.valorPessimista, 0),
    valorRealista: sorted.reduce((s, p) => s + p.valorRealista, 0),
    valorOtimista: sorted.reduce((s, p) => s + p.valorOtimista, 0),
    valorAgressivo: sorted.reduce((s, p) => s + p.valorAgressivo, 0),
  }

  // Key map from cenarioAtivo prop string to chart key
  const cenarioAtivoKey = cenarioAtivo
    ? `valor${cenarioAtivo.charAt(0).toUpperCase()}${cenarioAtivo.slice(1)}`
    : null

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {CENARIOS.map(({ key, label, color }) => (
          <div
            key={key}
            className={`bg-card rounded-xl p-4 border transition-all ${
              cenarioAtivoKey === key
                ? 'border-primary/60 ring-1 ring-primary/30'
                : 'border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <p className="text-xs text-muted-foreground">
                {label}
                {cenarioAtivoKey === key && (
                  <span className="ml-1 text-primary font-medium">• ativo</span>
                )}
              </p>
            </div>
            <p className="font-numbers text-base font-bold text-foreground">
              {formatarMoeda(totais[key])}
            </p>
            <p className="text-[10px] text-muted-foreground font-numbers mt-1">
              Media: {formatarMoeda(totais[key] / 12)}/mes
            </p>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Projecao de Faturamento — 4 Cenarios</h3>
        <p className="text-xs text-muted-foreground mb-4">Comparativo mensal dos 4 cenarios projetados</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {CENARIOS.map(({ key, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={cenarioAtivoKey === key ? 3 : 1.5}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                strokeDasharray={cenarioAtivoKey === key ? undefined : '4 2'}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Tabela Comparativa Mensal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium min-w-[80px]">Mes</th>
                {CENARIOS.map(({ key, label, color }) => (
                  <th
                    key={key}
                    className={`text-right px-4 py-3 font-medium font-numbers min-w-[120px] ${
                      cenarioAtivoKey === key ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {label}
                      {cenarioAtivoKey === key && <span className="text-primary">•</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">{MESES[(p.mes - 1 + 12) % 12] ?? `M${p.mes}`}</td>
                  {CENARIOS.map(({ key }) => (
                    <td
                      key={key}
                      className={`px-4 py-2.5 text-right font-numbers ${
                        cenarioAtivoKey === key ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {formatarMoeda(p[key as keyof ProjecaoFaturamento] as number)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-secondary/40">
                <td className="px-4 py-3 text-foreground font-semibold">Total</td>
                {CENARIOS.map(({ key }) => (
                  <td
                    key={key}
                    className={`px-4 py-3 text-right font-numbers font-bold ${
                      cenarioAtivoKey === key ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {formatarMoeda(totais[key])}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
