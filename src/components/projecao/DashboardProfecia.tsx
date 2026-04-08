'use client'

import type { ResultadoProfecia, KPIsProfecia } from '@/types'
import {
  formatarMoeda,
  formatarPercentual,
  MESES,
  getMesesReordenados,
  rotateArray,
  gerarLinhasProfecia,
} from '@/lib/calculations/financeiro'
import {
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart2, Target } from 'lucide-react'
// scroll nativo com overflow-x-auto

interface DashboardProfeciaProps {
  resultado: ResultadoProfecia
  kpis: KPIsProfecia
  faturamento: number[]
  mesInicial?: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const nameMap: Record<string, string> = {
    saldoFinal: 'Saldo Final',
    geracaoAcumulada: 'Geracao Acumulada',
  }
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-foreground font-medium mb-2 text-sm">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground text-xs">{nameMap[entry.name] ?? entry.name}</span>
          </div>
          <span className={`font-numbers text-xs font-medium ${entry.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatarMoeda(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string
  value: string
  icon: React.ReactNode
  positive?: boolean
  negative?: boolean
  forceRed?: boolean
  subtitle?: string
}

function KPICard({ label, value, icon, positive, negative, forceRed, subtitle }: KPICardProps) {
  const borderColor = forceRed
    ? 'border-red-500/40'
    : positive
    ? 'border-green-500/30'
    : negative
    ? 'border-red-500/30'
    : 'border-border'

  const valueColor = forceRed
    ? 'text-red-400'
    : positive
    ? 'text-green-400'
    : negative
    ? 'text-red-400'
    : 'text-foreground'

  return (
    <div className={`bg-card border ${borderColor} rounded-xl p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className={`font-numbers text-xl font-bold ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

// ── Row coloring helpers ──────────────────────────────────────────────────────

function corValorProfecia(tipo: string, valor: number): string {
  if (tipo === 'saida') return valor > 0 ? 'text-red-400' : 'text-muted-foreground'
  if (tipo === 'resultado') return valor >= 0 ? 'text-green-400' : 'text-red-400'
  if (tipo === 'saldo') return valor >= 0 ? 'text-foreground' : 'text-red-400'
  return valor >= 0 ? 'text-foreground' : 'text-red-400'
}

// ── Main component ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DashboardProfecia({ resultado, kpis, faturamento, mesInicial = 0 }: DashboardProfeciaProps) {
  const mesesLabels = getMesesReordenados(mesInicial)
  // KPI calculations
  const geracaoCaixaTotal = resultado.geracaoCaixa.reduce((a, b) => a + b, 0)
  const saldoFinalUltimo = resultado.saldoFinal[11] ?? 0
  const exposicaoMaxima = kpis.exposicaoMaximaCaixa

  const peValidos = kpis.pontoEquilibrioRS.filter(v => v > 0)
  const peMedio = peValidos.length > 0 ? peValidos.reduce((a, b) => a + b, 0) / peValidos.length : 0

  const mcPercValidos = kpis.margemContribuicaoPerc.filter(v => v !== 0)
  const mcMedio = mcPercValidos.length > 0 ? mcPercValidos.reduce((a, b) => a + b, 0) / mcPercValidos.length : 0

  // Rotacionar arrays de resultado para alinhar com labels
  const saldoFinalR = rotateArray(resultado.saldoFinal, mesInicial)
  const geracaoAcumuladaR = rotateArray(resultado.geracaoAcumulada, mesInicial)

  // Chart data
  const chartData = mesesLabels.map((mes, i) => ({
    mes,
    saldoFinal: Math.round(saldoFinalR[i] ?? 0),
    geracaoAcumulada: Math.round(geracaoAcumuladaR[i] ?? 0),
  }))

  // Profecia table rows — rotacionar valores de cada linha
  const linhasRaw = gerarLinhasProfecia(resultado)
  const linhas = linhasRaw.map(l => ({
    ...l,
    valores: rotateArray(l.valores, mesInicial),
    total: l.valores.reduce((a: number, b: number) => a + b, 0),
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <KPICard
          label="Geracao de Caixa Total"
          value={formatarMoeda(geracaoCaixaTotal)}
          icon={geracaoCaixaTotal >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          positive={geracaoCaixaTotal > 0}
          negative={geracaoCaixaTotal < 0}
          subtitle="12 meses acumulado"
        />
        <KPICard
          label={`Saldo Final (${mesesLabels[11]})`}
          value={formatarMoeda(saldoFinalUltimo)}
          icon={<DollarSign size={16} />}
          positive={saldoFinalUltimo > 0}
          negative={saldoFinalUltimo < 0}
          subtitle={`${mesesLabels[11]} — projecao`}
        />
        <KPICard
          label="Exposicao Maxima do Caixa"
          value={formatarMoeda(exposicaoMaxima)}
          icon={<AlertTriangle size={16} />}
          forceRed={exposicaoMaxima < 0}
          positive={exposicaoMaxima >= 0}
          subtitle={exposicaoMaxima < 0 ? 'Alerta de liquidez' : 'Saldo minimo projetado'}
        />
        <KPICard
          label="Ponto de Equilibrio Medio"
          value={formatarMoeda(peMedio)}
          icon={<Target size={16} />}
          subtitle="Media mensal valida"
        />
        <KPICard
          label="Margem Contribuicao Media"
          value={formatarPercentual(mcMedio)}
          icon={<BarChart2 size={16} />}
          positive={mcMedio > 30}
          negative={mcMedio < 10}
          subtitle="Sobre faturamento"
        />
      </div>

      {/* Main Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Evolucao do Caixa — 12 Meses</h3>
        <p className="text-xs text-muted-foreground mb-4">Saldo final mensal vs geracao acumulada de caixa</p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSaldoPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSaldoNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
              </linearGradient>
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
            <Tooltip content={<ChartTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-muted-foreground text-xs">
                  {value === 'saldoFinal' ? 'Saldo Final' : 'Geracao Acumulada'}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="saldoFinal"
              stroke="#4ADE80"
              strokeWidth={2}
              fill="url(#gradSaldoPos)"
              dot={false}
              activeDot={{ r: 4, fill: '#4ADE80', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="geracaoAcumulada"
              stroke="#F17522"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#F17522', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
              strokeDasharray="5 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* PROFECIA Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">PROFECIA — Fluxo de Caixa Projetado</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Projecao detalhada para os proximos 12 meses</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1400px]">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium sticky left-0 bg-card min-w-[240px] z-10">
                    Descricao
                  </th>
                  {mesesLabels.map((mes) => (
                    <th key={mes} className="text-right px-3 py-3 text-muted-foreground font-medium font-numbers min-w-[88px]">
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
                  const isSectionHeader = isDestaque && indent === 0 && (
                    linha.label.startsWith('ENTRADAS') ||
                    linha.label.startsWith('SAIDAS') ||
                    linha.label.startsWith('INVESTIMENTOS') ||
                    linha.label.startsWith('FINANCIAMENTOS') ||
                    linha.label.startsWith('TOTAL') ||
                    linha.label === 'SALDO INICIAL' ||
                    linha.label === 'SALDO FINAL'
                  )

                  return (
                    <tr
                      key={i}
                      className={`border-b border-border/50 transition-colors ${
                        isSectionHeader
                          ? 'bg-primary/5'
                          : isDestaque
                          ? 'bg-secondary/40 hover:bg-secondary/60'
                          : 'hover:bg-secondary/20'
                      }`}
                    >
                      <td
                        className={`px-4 py-2.5 sticky left-0 z-10 ${
                          isSectionHeader
                            ? 'bg-primary/5'
                            : isDestaque
                            ? 'bg-secondary/40'
                            : 'bg-card'
                        }`}
                      >
                        <span
                          className={`${
                            isSectionHeader
                              ? 'text-primary font-bold uppercase tracking-wide text-[11px]'
                              : isDestaque
                              ? 'text-foreground font-semibold'
                              : 'text-muted-foreground'
                          }`}
                          style={{ paddingLeft: `${indent * 16}px`, display: 'block' }}
                        >
                          {linha.label}
                        </span>
                      </td>
                      {linha.valores.map((valor, j) => (
                        <td
                          key={j}
                          className={`px-3 py-2.5 text-right font-numbers ${
                            isDestaque ? 'font-semibold' : 'font-normal'
                          } ${corValorProfecia(linha.tipo, valor)}`}
                        >
                          {formatarMoeda(valor)}
                        </td>
                      ))}
                      <td
                        className={`px-3 py-2.5 text-right font-numbers font-semibold bg-primary/5 ${
                          corValorProfecia(linha.tipo, linha.total)
                        }`}
                      >
                        {formatarMoeda(linha.total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
