'use client'

import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine,
} from 'recharts'
import { AlertTriangle, ThumbsUp, Lightbulb } from 'lucide-react'
import { AnaliseEntrevista } from '@/types'

interface AnaliseProps {
  analise: AnaliseEntrevista
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Record<string, unknown>[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg border p-3 text-xs shadow-xl"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <p className="font-semibold text-white mb-1">{label}</p>
        {payload.map((entry: Record<string, unknown>, idx: number) => (
          <div key={String(entry.name ?? idx)} className="flex items-center gap-2">
            <span style={{ color: String(entry.color ?? '#fff') }}>{String(entry.name ?? '')}:</span>
            <span className="text-white">
              {entry.name === 'Acumulado (%)' ? `${String(entry.value)}%` : String(entry.value ?? '')}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function AnalisePareto({ analise }: AnaliseProps) {
  const chartData = analise.temas.map((t) => ({
    name: t.tema.length > 20 ? t.tema.substring(0, 18) + '...' : t.tema,
    fullName: t.tema,
    Frequencia: t.frequencia,
    'Acumulado (%)': t.acumulado,
    categoria: t.categoria,
  }))

  return (
    <div className="flex flex-col gap-5">
      {/* Executive Summary */}
      <div
        className="rounded-lg border p-4"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <h3 className="text-sm font-semibold text-primary mb-2">Resumo Executivo</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{analise.resumoExecutivo}</p>
      </div>

      {/* Pareto Chart */}
      <div
        className="rounded-lg border p-4"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Analise de Pareto — Temas por Frequencia</h3>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#F17522' }} />
              Frequencia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: '#3B82F6' }} />
              Acumulado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed inline-block" style={{ borderColor: '#10B981' }} />
              80%
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={110}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }} />
            <Bar dataKey="Frequencia" fill="#F17522" radius={[0, 4, 4, 0]} maxBarSize={22} />
            <Line
              type="monotone"
              dataKey="Acumulado (%)"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 3 }}
              yAxisId={0}
            />
            <ReferenceLine x={80} stroke="#10B981" strokeDasharray="5 5" strokeWidth={1.5} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-muted-foreground/50 text-center mt-2">
          A linha tracejada verde indica o limiar de 80% (Principio de Pareto)
        </p>
      </div>

      {/* Insights grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Critical points */}
        <div
          className="rounded-lg border p-4 flex flex-col gap-2"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: '#EF444444' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <h4 className="text-xs font-semibold text-red-400">Pontos Criticos</h4>
          </div>
          {analise.pontosCriticos.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5 shrink-0">•</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{p}</p>
            </div>
          ))}
        </div>

        {/* Positive points */}
        <div
          className="rounded-lg border p-4 flex flex-col gap-2"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: '#10B98144' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <ThumbsUp size={14} className="text-emerald-400 shrink-0" />
            <h4 className="text-xs font-semibold text-emerald-400">Pontos Positivos</h4>
          </div>
          {analise.pontosPositivos.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{p}</p>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div
          className="rounded-lg border p-4 flex flex-col gap-2"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--primary) / 0.27)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={14} className="text-primary shrink-0" />
            <h4 className="text-xs font-semibold text-primary">Recomendacoes</h4>
          </div>
          {analise.recomendacoes.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 shrink-0 font-bold text-[10px]">{i + 1}.</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
