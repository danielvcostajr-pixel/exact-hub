'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  History,
  PieChart,
  TrendingUp,
  TrendingDown,
  Clock,
  PercentIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type RetornoTipo = 'fixo' | 'customizado'

interface RetornoMes {
  mes: number
  valor: number
}

interface InputData {
  nome: string
  valorInvestimento: number
  retornoTipo: RetornoTipo
  retornoMensal: number
  periodo: number
  retornosCustom: RetornoMes[]
  taxaDescontoAnual: number
}

interface KPIResult {
  roi: number
  paybackMeses: number | null
  vpl: number
  tir: number
  totalRetornos: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtPct = (v: number) => `${v.toFixed(2)}%`

// ─── Calculos ─────────────────────────────────────────────────────────────────

function calcularTaxaMensal(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
}

function calcularVPL(investimento: number, fluxos: number[], taxaAnual: number): number {
  const taxaMensal = calcularTaxaMensal(taxaAnual)
  const vpl = fluxos.reduce((acc, fluxo, i) => {
    return acc + fluxo / Math.pow(1 + taxaMensal, i + 1)
  }, 0)
  return vpl - investimento
}

function calcularTIR(investimento: number, fluxos: number[]): number {
  // Bisection method — procura taxa mensal que zera VPL
  let lo = -0.9
  let hi = 10.0
  const MAX_ITER = 200
  const EPSILON = 1e-6

  for (let i = 0; i < MAX_ITER; i++) {
    const mid = (lo + hi) / 2
    const vpl = fluxos.reduce((acc, f, idx) => acc + f / Math.pow(1 + mid, idx + 1), 0) - investimento

    if (Math.abs(vpl) < EPSILON) break

    if (vpl > 0) {
      lo = mid
    } else {
      hi = mid
    }
  }

  const tirMensal = (lo + hi) / 2
  // Converter para anual
  const tirAnual = (Math.pow(1 + tirMensal, 12) - 1) * 100
  return tirAnual
}

function calcularPayback(investimento: number, fluxos: number[]): number | null {
  let acumulado = 0
  for (let i = 0; i < fluxos.length; i++) {
    acumulado += fluxos[i]
    if (acumulado >= investimento) return i + 1
  }
  return null
}

function getFluxos(input: InputData): number[] {
  if (input.retornoTipo === 'fixo') {
    return Array.from({ length: input.periodo }, () => input.retornoMensal)
  }
  return input.retornosCustom.map((r) => r.valor)
}

function calcularKPIs(input: InputData): KPIResult {
  const fluxos = getFluxos(input)
  const totalRetornos = fluxos.reduce((a, b) => a + b, 0)
  const roi = input.valorInvestimento > 0
    ? ((totalRetornos - input.valorInvestimento) / input.valorInvestimento) * 100
    : 0
  const paybackMeses = calcularPayback(input.valorInvestimento, fluxos)
  const vpl = calcularVPL(input.valorInvestimento, fluxos, input.taxaDescontoAnual)
  const tir = calcularTIR(input.valorInvestimento, fluxos)

  return { roi, paybackMeses, vpl, tir, totalRetornos }
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-semibold text-muted-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  positive,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  positive?: boolean
}) {
  const color =
    positive === undefined
      ? 'text-foreground'
      : positive
      ? 'text-green-500'
      : 'text-red-500'

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <Icon size={15} className="text-muted-foreground" />
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODOS = [6, 12, 18, 24, 36, 48, 60]

const INPUT_DEFAULT: InputData = {
  nome: 'Expansao da Operacao',
  valorInvestimento: 80000,
  retornoTipo: 'fixo',
  retornoMensal: 12000,
  periodo: 12,
  retornosCustom: Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    valor: 8000 + i * 500,
  })),
  taxaDescontoAnual: 12,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ROIPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [input, setInput] = useState<InputData>(INPUT_DEFAULT)
  const [resultado, setResultado] = useState<KPIResult | null>(null)
  const [calculado, setCalculado] = useState(false)

  const handleCalcular = useCallback(() => {
    const res = calcularKPIs(input)
    setResultado(res)
    setCalculado(true)
  }, [input])

  const setField = <K extends keyof InputData>(key: K, value: InputData[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }))
    setCalculado(false)
  }

  const handleRetornoCustomChange = (mes: number, valor: number) => {
    setInput((prev) => ({
      ...prev,
      retornosCustom: prev.retornosCustom.map((r) =>
        r.mes === mes ? { ...r, valor } : r
      ),
    }))
    setCalculado(false)
  }

  const handleAddLinhaCustom = () => {
    const maxMes = input.retornosCustom.length > 0
      ? Math.max(...input.retornosCustom.map((r) => r.mes))
      : 0
    if (maxMes >= 24) return
    setInput((prev) => ({
      ...prev,
      retornosCustom: [...prev.retornosCustom, { mes: maxMes + 1, valor: 0 }],
    }))
    setCalculado(false)
  }

  const handleRemoveLinhaCustom = (mes: number) => {
    if (input.retornosCustom.length <= 1) return
    setInput((prev) => ({
      ...prev,
      retornosCustom: prev.retornosCustom.filter((r) => r.mes !== mes),
    }))
    setCalculado(false)
  }

  // Dados para o grafico
  const fluxos = getFluxos(input)
  const chartData = (() => {
    const data: { mes: string; investimento: number | null; retornoAcumulado: number; breakeven: number }[] = []
    let acumulado = 0

    data.push({
      mes: 'Mes 0',
      investimento: input.valorInvestimento,
      retornoAcumulado: 0,
      breakeven: input.valorInvestimento,
    })

    fluxos.forEach((f, i) => {
      acumulado += f
      data.push({
        mes: `Mes ${i + 1}`,
        investimento: null,
        retornoAcumulado: acumulado,
        breakeven: input.valorInvestimento,
      })
    })
    return data
  })()

  // Recomendacao
  const recomendacao = (() => {
    if (!resultado) return null
    if (resultado.vpl > 0 && resultado.roi > 20) {
      return {
        tipo: 'otimo',
        icon: CheckCircle2,
        cor: 'border-green-500/30 bg-green-500/5 text-green-500',
        texto: 'Investimento viavel! Retorno atrativo.',
      }
    }
    if (resultado.vpl > 0 && resultado.roi <= 20) {
      return {
        tipo: 'moderado',
        icon: AlertCircle,
        cor: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-600',
        texto: 'Investimento viavel, porem com retorno moderado.',
      }
    }
    return {
      tipo: 'ruim',
      icon: XCircle,
      cor: 'border-red-500/30 bg-red-500/5 text-red-500',
      texto: 'Investimento nao recomendado com os parametros atuais.',
    }
  })()

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/simuladores"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} />
            Simuladores
          </Link>
          <span className="text-muted-foreground/40">/</span>
          {clienteAtivo && (
            <>
              <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>
              <span className="text-muted-foreground/40">/</span>
            </>
          )}
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-purple-500" />
            <h1 className="text-xl font-bold text-foreground">ROI de Investimentos</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
            <History size={14} />
            Historico
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
            <Save size={14} />
            Salvar
          </button>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Calcule ROI, Payback e VPL para avaliar a viabilidade financeira de novos investimentos.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card Investimento */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Investimento</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome do Investimento</label>
              <input
                type="text"
                value={input.nome}
                onChange={(e) => setField('nome', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Valor do Investimento (R$)</label>
              <input
                type="number"
                value={input.valorInvestimento}
                min={0}
                onChange={(e) => setField('valorInvestimento', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Card Retorno */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 lg:col-span-1">
          <h2 className="font-semibold text-foreground">Retorno</h2>

          {/* Radio group */}
          <div className="flex gap-3">
            {(['fixo', 'customizado'] as RetornoTipo[]).map((tipo) => (
              <label
                key={tipo}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  value={tipo}
                  checked={input.retornoTipo === tipo}
                  onChange={() => setField('retornoTipo', tipo)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground capitalize">{tipo === 'fixo' ? 'Fixo' : 'Customizado'}</span>
              </label>
            ))}
          </div>

          {input.retornoTipo === 'fixo' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Retorno Mensal (R$)</label>
                <input
                  type="number"
                  value={input.retornoMensal}
                  min={0}
                  onChange={(e) => setField('retornoMensal', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Periodo (meses)</label>
                <select
                  value={input.periodo}
                  onChange={(e) => setField('periodo', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {PERIODOS.map((p) => (
                    <option key={p} value={p}>{p} meses</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {input.retornosCustom.map((r) => (
                  <div key={r.mes} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12 shrink-0">Mes {r.mes}</span>
                    <input
                      type="number"
                      value={r.valor}
                      min={0}
                      onChange={(e) => handleRetornoCustomChange(r.mes, Number(e.target.value))}
                      className="flex-1 px-2 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => handleRemoveLinhaCustom(r.mes)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {input.retornosCustom.length < 24 && (
                <button
                  onClick={handleAddLinhaCustom}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus size={12} />
                  Adicionar mes
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Taxa de Desconto */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Taxa de Desconto</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Taxa de Desconto Anual (%)</label>
            <input
              type="number"
              value={input.taxaDescontoAnual}
              min={0}
              step={0.5}
              onChange={(e) => setField('taxaDescontoAnual', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Utilizada para calcular o Valor Presente Liquido (VPL).
            </p>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Taxa mensal equivalente:{' '}
              <span className="font-medium text-foreground">
                {fmtPct(calcularTaxaMensal(input.taxaDescontoAnual) * 100)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Botao calcular */}
      <div className="flex justify-end">
        <button
          onClick={handleCalcular}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
        >
          <PercentIcon size={15} />
          Calcular ROI
        </button>
      </div>

      {/* Resultados */}
      {calculado && resultado && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="ROI"
              value={fmtPct(resultado.roi)}
              subtitle={resultado.roi > 0 ? 'Retorno positivo' : 'Retorno negativo'}
              icon={resultado.roi >= 0 ? TrendingUp : TrendingDown}
              positive={resultado.roi > 0}
            />
            <KPICard
              title="Payback"
              value={
                resultado.paybackMeses !== null
                  ? `${resultado.paybackMeses} meses`
                  : 'Nao atingido'
              }
              subtitle={
                resultado.paybackMeses !== null
                  ? resultado.paybackMeses <= 12
                    ? 'Recuperacao rapida'
                    : resultado.paybackMeses <= 24
                    ? 'Recuperacao moderada'
                    : 'Recuperacao lenta'
                  : 'Investimento nao recuperado'
              }
              icon={Clock}
              positive={resultado.paybackMeses !== null}
            />
            <KPICard
              title="VPL"
              value={fmt(resultado.vpl)}
              subtitle={resultado.vpl > 0 ? 'Viavel economicamente' : 'Inviavel economicamente'}
              icon={resultado.vpl >= 0 ? TrendingUp : TrendingDown}
              positive={resultado.vpl > 0}
            />
            <KPICard
              title="TIR Estimada"
              value={fmtPct(resultado.tir)}
              subtitle={`vs ${fmtPct(input.taxaDescontoAnual)} de desconto`}
              icon={PercentIcon}
              positive={resultado.tir > input.taxaDescontoAnual}
            />
          </div>

          {/* Grafico */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-1">Evolucao do Retorno Acumulado</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Retorno acumulado vs investimento ao longo do periodo. A linha de breakeven indica o ponto de recuperacao.
            </p>

            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat('pt-BR', { notation: 'compact', currency: 'BRL' }).format(v)
                  }
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <ReferenceLine
                  y={input.valorInvestimento}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{ value: 'Breakeven', fontSize: 10, fill: '#f59e0b', position: 'insideTopRight' }}
                />
                <Bar
                  dataKey="investimento"
                  name="Investimento"
                  fill="#ef4444"
                  fillOpacity={0.8}
                  radius={[3, 3, 0, 0]}
                />
                <Area
                  type="monotone"
                  dataKey="retornoAcumulado"
                  name="Retorno Acumulado"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  strokeWidth={2.5}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Recomendacao */}
          {recomendacao && (
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${recomendacao.cor}`}>
              <recomendacao.icon size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{recomendacao.texto}</p>
                <p className="text-xs mt-1 opacity-80">
                  {resultado.vpl > 0 && resultado.roi > 20 &&
                    `ROI de ${fmtPct(resultado.roi)} com VPL positivo de ${fmt(resultado.vpl)}. ${resultado.paybackMeses ? `Payback em ${resultado.paybackMeses} meses.` : ''}`}
                  {resultado.vpl > 0 && resultado.roi <= 20 &&
                    `ROI de ${fmtPct(resultado.roi)} esta abaixo de 20%, porem o VPL positivo (${fmt(resultado.vpl)}) indica viabilidade. Avalie alternativas.`}
                  {resultado.vpl <= 0 &&
                    `VPL de ${fmt(resultado.vpl)} indica que os retornos projetados nao cobrem o custo do capital. Revise os parametros ou o valor do investimento.`}
                </p>
              </div>
            </div>
          )}

          {/* Resumo detalhado */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-4">Resumo Detalhado</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Valor Investido</p>
                <p className="text-sm font-semibold text-foreground">{fmt(input.valorInvestimento)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Total de Retornos</p>
                <p className="text-sm font-semibold text-foreground">{fmt(resultado.totalRetornos)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Lucro Bruto</p>
                <p className={`text-sm font-semibold ${resultado.totalRetornos - input.valorInvestimento >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {fmt(resultado.totalRetornos - input.valorInvestimento)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Periodo Analisado</p>
                <p className="text-sm font-semibold text-foreground">
                  {input.retornoTipo === 'fixo' ? `${input.periodo} meses` : `${input.retornosCustom.length} meses`}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
