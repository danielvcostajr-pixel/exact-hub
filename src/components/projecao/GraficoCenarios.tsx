'use client'

import type { ProjecaoFaturamento } from '@/types'
import { formatarMoeda, MESES } from '@/lib/calculations/financeiro'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface GraficoCenariosProps {
  projecoes: ProjecaoFaturamento[]
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

const CENARIOS = [
  { key: 'valorAgressivo',  label: 'Agressivo',  color: '#C084FC', gradId: 'gradAgressivo' },
  { key: 'valorOtimista',   label: 'Otimista',   color: '#4ADE80', gradId: 'gradOtimista' },
  { key: 'valorRealista',   label: 'Realista',   color: '#60A5FA', gradId: 'gradRealista' },
  { key: 'valorPessimista', label: 'Pessimista', color: '#F87171', gradId: 'gradPessimista' },
] as const

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
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
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
    <div className="flex items-center justify-center gap-6 mt-2 flex-wrap">
      {payload?.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground text-xs">{labelMap[entry.value] ?? entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

export function GraficoCenarios({ projecoes }: GraficoCenariosProps) {
  if (!projecoes || projecoes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border rounded-xl">
        <p className="text-muted-foreground text-sm">
          Preencha o historico de faturamento para visualizar os cenarios
        </p>
      </div>
    )
  }

  const sorted = [...projecoes].sort((a, b) => a.mes - b.mes)

  const data = sorted.map((p) => ({
    mes: MESES[p.mes - 1],
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

  const cardCenarios = [
    { key: 'valorPessimista' as const, label: 'Pessimista', color: '#F87171', borderColor: 'border-red-500/30' },
    { key: 'valorRealista'   as const, label: 'Realista',   color: '#60A5FA', borderColor: 'border-blue-500/30' },
    { key: 'valorOtimista'   as const, label: 'Otimista',   color: '#4ADE80', borderColor: 'border-green-500/30' },
    { key: 'valorAgressivo'  as const, label: 'Agressivo',  color: '#C084FC', borderColor: 'border-purple-500/30' },
  ]

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cardCenarios.map(({ key, label, color, borderColor }) => (
          <div key={key} className={`bg-card border ${borderColor} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <p className="text-xs text-muted-foreground">Cenario {label}</p>
            </div>
            <p className="font-numbers text-base font-bold" style={{ color }}>
              {formatarMoeda(totais[key])}
            </p>
            <p className="text-[10px] text-muted-foreground font-numbers mt-1">
              Media: {formatarMoeda(totais[key] / 12)}/mes
            </p>
          </div>
        ))}
      </div>

      {/* Grafico */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-1">Projecao de Faturamento — 4 Cenarios</h3>
        <p className="text-xs text-muted-foreground mb-4">Pessimista, Realista, Otimista e Agressivo</p>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              {CENARIOS.map(({ gradId, color }) => (
                <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
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
            {CENARIOS.map(({ key, color, gradId }) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={key === 'valorRealista' ? 2.5 : 1.5}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
