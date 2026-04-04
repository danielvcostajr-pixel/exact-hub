'use client'

import { useState, useMemo } from 'react'
import type {
  ProjecaoFinanceiraCompleta,
  ResultadoProfecia,
  KPIsProfecia,
} from '@/types'
import {
  formatarMoeda,
  formatarPercentual,
  MESES,
  gerarResultadoProfecia,
  calcularKPIs,
} from '@/lib/calculations/financeiro'
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart2,
  Percent,
  SlidersHorizontal,
} from 'lucide-react'

interface SimuladorCenariosProps {
  dadosBase: ProjecaoFinanceiraCompleta
  resultadoBase: ResultadoProfecia
  kpisBase: KPIsProfecia
  faturamento: number[]
}

interface SliderConfig {
  key: string
  label: string
  min: number
  max: number
  step: number
  suffix: string
  defaultValue: number
}

function SliderControl({
  config,
  value,
  onChange,
}: {
  config: SliderConfig
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
        <span className="text-xs font-bold tabular-nums text-foreground">
          {value.toFixed(1)}{config.suffix}
        </span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/50 tabular-nums">
        <span>{config.min}{config.suffix}</span>
        <span>{config.max}{config.suffix}</span>
      </div>
    </div>
  )
}

function KPICard({
  label,
  valorSimulado,
  valorBase,
  isPercentage,
  icon,
}: {
  label: string
  valorSimulado: number
  valorBase: number
  isPercentage?: boolean
  icon: React.ReactNode
}) {
  const delta = valorSimulado - valorBase
  const isPositive = delta >= 0

  return (
    <div className="rounded-lg p-3 border border-border bg-card space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold tabular-nums text-foreground">
        {isPercentage ? formatarPercentual(valorSimulado) : formatarMoeda(valorSimulado)}
      </p>
      {Math.abs(delta) > 0.01 && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span>
            {isPositive ? '+' : ''}{isPercentage ? `${delta.toFixed(1)}pp` : formatarMoeda(delta)} vs atual
          </span>
        </div>
      )}
    </div>
  )
}

export function SimuladorCenarios({
  dadosBase,
  resultadoBase,
  kpisBase,
  faturamento,
}: SimuladorCenariosProps) {
  // Extract default values from current data
  const defaultCMV = dadosBase.despesas.variaveis
    .filter(g => g.categoria === 'cmv')
    .reduce((sum, g) => sum + g.percentual, 0)

  const defaultAVistaRec = dadosBase.condicoesRecebimento.percentualAVista
  const defaultAVistaPag = dadosBase.condicoesPagamento.percentualAVista

  const [cmvPerc, setCmvPerc] = useState(defaultCMV)
  const [aVistaRec, setAVistaRec] = useState(defaultAVistaRec)
  const [aVistaPag, setAVistaPag] = useState(defaultAVistaPag)
  const [ajusteFixos, setAjusteFixos] = useState(0)
  const [ajusteFin, setAjusteFin] = useState(0)
  const [taxaCrescimento, setTaxaCrescimento] = useState(0)

  const sliders: (SliderConfig & { value: number; setter: (v: number) => void })[] = [
    { key: 'cmv', label: 'CMV (%)', min: 0, max: 100, step: 0.5, suffix: '%', defaultValue: defaultCMV, value: cmvPerc, setter: setCmvPerc },
    { key: 'avista_rec', label: '% A Vista Recebimentos', min: 0, max: 100, step: 1, suffix: '%', defaultValue: defaultAVistaRec, value: aVistaRec, setter: setAVistaRec },
    { key: 'avista_pag', label: '% A Vista Pagamentos', min: 0, max: 100, step: 1, suffix: '%', defaultValue: defaultAVistaPag, value: aVistaPag, setter: setAVistaPag },
    { key: 'fixos', label: 'Ajuste Gastos Fixos', min: -50, max: 50, step: 1, suffix: '%', defaultValue: 0, value: ajusteFixos, setter: setAjusteFixos },
    { key: 'fin', label: 'Ajuste Financiamentos', min: -50, max: 50, step: 1, suffix: '%', defaultValue: 0, value: ajusteFin, setter: setAjusteFin },
    { key: 'cresc', label: 'Taxa Crescimento', min: -30, max: 50, step: 0.5, suffix: '%', defaultValue: 0, value: taxaCrescimento, setter: setTaxaCrescimento },
  ]

  // Recalculate everything based on slider values
  const simulacao = useMemo(() => {
    // Build modified faturamento based on growth adjustment
    const fatModificado = faturamento.map(v => v * (1 + taxaCrescimento / 100))

    // Build modified projecao
    const projecaoModificada: ProjecaoFinanceiraCompleta = {
      ...dadosBase,
      condicoesRecebimento: {
        ...dadosBase.condicoesRecebimento,
        percentualAVista: aVistaRec,
        percentualAPrazo: 100 - aVistaRec,
      },
      condicoesPagamento: {
        ...dadosBase.condicoesPagamento,
        percentualAVista: aVistaPag,
        percentualAPrazo: 100 - aVistaPag,
      },
      despesas: {
        ...dadosBase.despesas,
        variaveis: dadosBase.despesas.variaveis.map(v =>
          v.categoria === 'cmv' ? { ...v, percentual: cmvPerc } : v
        ),
        fixos: dadosBase.despesas.fixos.map(f => ({
          ...f,
          valor: f.valor * (1 + ajusteFixos / 100),
          reajustes: f.reajustes?.map(r => ({
            ...r,
            novoValor: r.novoValor * (1 + ajusteFixos / 100),
          })),
        })),
      },
      financiamentos: dadosBase.financiamentos.map(f => ({
        ...f,
        valor: f.valor * (1 + ajusteFin / 100),
      })),
    }

    const resultado = gerarResultadoProfecia({
      projecao: projecaoModificada,
      faturamentoMensal: fatModificado,
    })

    const kpis = calcularKPIs({
      resultado,
      faturamentoMensal: fatModificado,
      metaPERS: dadosBase.metaPERs,
      metaPEPerc: dadosBase.metaPEPerc,
    })

    return { resultado, kpis, fatModificado }
  }, [cmvPerc, aVistaRec, aVistaPag, ajusteFixos, ajusteFin, taxaCrescimento, dadosBase, faturamento])

  // Build chart data
  const chartData = MESES.map((mes, i) => ({
    mes,
    saldoSimulado: simulacao.resultado.saldoFinal[i],
    saldoBase: resultadoBase.saldoFinal[i],
  }))

  // Summary KPIs
  const geracaoSimulada = simulacao.resultado.geracaoCaixa.reduce((a, b) => a + b, 0)
  const geracaoBase = resultadoBase.geracaoCaixa.reduce((a, b) => a + b, 0)
  const saldoFinalSim = simulacao.resultado.saldoFinal[11]
  const saldoFinalBase = resultadoBase.saldoFinal[11]
  const peMediaSim = simulacao.kpis.pontoEquilibrioRS.reduce((a, b) => a + b, 0) / 12
  const peMediaBase = kpisBase.pontoEquilibrioRS.reduce((a, b) => a + b, 0) / 12
  const mcMediaSim = simulacao.kpis.margemContribuicaoPerc.reduce((a, b) => a + b, 0) / 12
  const mcMediaBase = kpisBase.margemContribuicaoPerc.reduce((a, b) => a + b, 0) / 12

  function resetar() {
    setCmvPerc(defaultCMV)
    setAVistaRec(defaultAVistaRec)
    setAVistaPag(defaultAVistaPag)
    setAjusteFixos(0)
    setAjusteFin(0)
    setTaxaCrescimento(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Simulador de Cenarios</h3>
        </div>
        <button
          onClick={resetar}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
        >
          Resetar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel: Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Variaveis de Ajuste
            </p>
            {sliders.map(s => (
              <SliderControl
                key={s.key}
                config={s}
                value={s.value}
                onChange={s.setter}
              />
            ))}
          </div>
        </div>

        {/* Right panel: Results */}
        <div className="lg:col-span-8 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Geracao de Caixa"
              valorSimulado={geracaoSimulada}
              valorBase={geracaoBase}
              icon={<DollarSign size={13} />}
            />
            <KPICard
              label="Saldo Final (Dez)"
              valorSimulado={saldoFinalSim}
              valorBase={saldoFinalBase}
              icon={<BarChart2 size={13} />}
            />
            <KPICard
              label="Ponto de Equilibrio (media)"
              valorSimulado={peMediaSim}
              valorBase={peMediaBase}
              icon={<Target size={13} />}
            />
            <KPICard
              label="Margem Contribuicao (media)"
              valorSimulado={mcMediaSim}
              valorBase={mcMediaBase}
              isPercentage
              icon={<Percent size={13} />}
            />
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Saldo Final — 12 Meses</p>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F17522" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F17522" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: 'hsl(var(--foreground))',
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      formatarMoeda(Number(value ?? 0)),
                      name === 'saldoSimulado' ? 'Simulado' : 'Atual',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="saldoBase"
                    stroke="#6b7280"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#baseGradient)"
                    name="saldoBase"
                  />
                  <Area
                    type="monotone"
                    dataKey="saldoSimulado"
                    stroke="#F17522"
                    strokeWidth={2}
                    fill="url(#simGradient)"
                    name="saldoSimulado"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: '#F17522' }} />
                <span className="text-[10px] text-muted-foreground">Simulado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded-full border-t border-dashed" style={{ borderColor: '#6b7280' }} />
                <span className="text-[10px] text-muted-foreground">Atual</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
