'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  History,
  Plus,
  Trash2,
  TrendingUp,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { saveSimulador, getSimuladorByEmpresa, getCurrentUserId } from '@/lib/api/data-service'
import { SimulacaoHistorico } from '@/components/simuladores/SimulacaoHistorico'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cenario {
  id: string
  nome: string
  faturamentoVariacao: number // %
  custosVariacao: number      // %
  cor: string
}

interface BaseData {
  faturamentoMensal: number
  custosFixos: number
  custosVariaveisPct: number
}

interface CenarioResult {
  id: string
  nome: string
  cor: string
  faturamentoTotal: number
  custosTotais: number
  lucroLiquido: number
  margemLiquida: number
  saldoFinal: number
  fluxoAcumulado: number[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const fmtPct = (value: number) => `${value.toFixed(1)}%`

const CORES = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7']

const CENARIOS_DEFAULT: Cenario[] = [
  { id: 'pessimista', nome: 'Pessimista',  faturamentoVariacao: -20, custosVariacao: 10,  cor: CORES[0] },
  { id: 'realista',   nome: 'Realista',    faturamentoVariacao: 0,   custosVariacao: 0,   cor: CORES[1] },
  { id: 'otimista',   nome: 'Otimista',    faturamentoVariacao: 30,  custosVariacao: -5,  cor: CORES[2] },
]

const BASE_DEFAULT: BaseData = {
  faturamentoMensal: 0,
  custosFixos: 0,
  custosVariaveisPct: 0,
}

const PERIODO = 12

// ─── Calculos ─────────────────────────────────────────────────────────────────

function calcularCenario(base: BaseData, cenario: Cenario): CenarioResult {
  const fatMensal = base.faturamentoMensal * (1 + cenario.faturamentoVariacao / 100)
  const custosVarFator = (base.custosVariaveisPct / 100) * (1 + cenario.custosVariacao / 100)

  let saldoAcumulado = 0
  const fluxoAcumulado: number[] = []

  for (let m = 0; m < PERIODO; m++) {
    const custoVar = fatMensal * custosVarFator
    const lucroMes = fatMensal - base.custosFixos - custoVar
    saldoAcumulado += lucroMes
    fluxoAcumulado.push(saldoAcumulado)
  }

  const faturamentoTotal = fatMensal * PERIODO
  const custosVarTotal = fatMensal * custosVarFator * PERIODO
  const custosTotais = base.custosFixos * PERIODO + custosVarTotal
  const lucroLiquido = faturamentoTotal - custosTotais
  const margemLiquida = faturamentoTotal > 0 ? (lucroLiquido / faturamentoTotal) * 100 : 0

  return {
    id: cenario.id,
    nome: cenario.nome,
    cor: cenario.cor,
    faturamentoTotal,
    custosTotais,
    lucroLiquido,
    margemLiquida,
    saldoFinal: saldoAcumulado,
    fluxoAcumulado,
  }
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function CellBest({
  value,
  isBest,
  isWorst,
  isCurrency = true,
  invertColors = false,
}: {
  value: number
  isBest: boolean
  isWorst: boolean
  isCurrency?: boolean
  invertColors?: boolean
}) {
  const good = invertColors ? isWorst : isBest
  const bad  = invertColors ? isBest  : isWorst
  return (
    <td
      className={`px-4 py-3 text-right text-sm font-medium whitespace-nowrap ${
        good ? 'text-green-500 bg-green-500/5' : bad ? 'text-red-500 bg-red-500/5' : 'text-foreground'
      }`}
    >
      {isCurrency ? fmt(value) : fmtPct(value)}
    </td>
  )
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CenariosPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [base, setBase] = useState<BaseData>(BASE_DEFAULT)
  const [cenarios, setCenarios] = useState<Cenario[]>(CENARIOS_DEFAULT)
  const [resultados, setResultados] = useState<CenarioResult[] | null>(null)
  const [simulado, setSimulado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // ── Load from historico callback ────────────────────────────────────────
  const handleLoadSimulacao = useCallback((inputs: Record<string, unknown>, outputs: Record<string, unknown>) => {
    const inp = inputs as { base?: BaseData; cenarios?: Cenario[] }
    if (inp.base) setBase(inp.base)
    if (inp.cenarios) setCenarios(inp.cenarios)
    const out = outputs as { resultados?: CenarioResult[] }
    if (out.resultados) {
      setResultados(out.resultados)
      setSimulado(true)
    }
  }, [])

  // Load saved data on mount
  useEffect(() => {
    if (!clienteAtivo) return
    async function loadSaved() {
      try {
        const saved = await getSimuladorByEmpresa(clienteAtivo!.id, 'CENARIOS_FINANCEIROS')
        if (saved?.inputs) {
          const inputs = saved.inputs as { base?: BaseData; cenarios?: Cenario[] }
          if (inputs.base) setBase(inputs.base)
          if (inputs.cenarios) setCenarios(inputs.cenarios)
          if (saved.updatedAt) {
            setSavedAt(new Date(saved.updatedAt).toLocaleString('pt-BR'))
          }
        }
      } catch { /* ignore */ }
    }
    loadSaved()
  }, [clienteAtivo])

  // Save handler
  const handleSave = useCallback(async () => {
    if (!clienteAtivo) return
    setSaving(true)
    try {
      const userId = await getCurrentUserId()
      const res = cenarios.map((c) => calcularCenario(base, c))
      await saveSimulador({
        empresaId: clienteAtivo.id,
        tipo: 'CENARIOS_FINANCEIROS',
        nome: 'Cenarios Financeiros',
        inputs: { base, cenarios },
        outputs: { resultados: res },
        criadoPorId: userId || 'system',
      })
      setSavedAt(new Date().toLocaleString('pt-BR'))
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error('Erro ao salvar simulador:', err)
    } finally {
      setSaving(false)
    }
  }, [clienteAtivo, base, cenarios])

  const handleSimular = useCallback(() => {
    const res = cenarios.map((c) => calcularCenario(base, c))
    setResultados(res)
    setSimulado(true)
  }, [base, cenarios])

  const handleAddCenario = () => {
    const newId = `custom-${Date.now()}`
    setCenarios((prev) => [
      ...prev,
      {
        id: newId,
        nome: 'Cenario Custom',
        faturamentoVariacao: 0,
        custosVariacao: 0,
        cor: CORES[3],
      },
    ])
    setSimulado(false)
  }

  const handleRemoveCenario = (id: string) => {
    if (cenarios.length <= 1) return
    setCenarios((prev) => prev.filter((c) => c.id !== id))
    setSimulado(false)
  }

  const handleCenarioChange = (id: string, field: keyof Cenario, value: string | number) => {
    setCenarios((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
    setSimulado(false)
  }

  // Dados para o grafico de linhas
  const chartData = Array.from({ length: PERIODO }, (_, i) => {
    const entry: Record<string, string | number> = { mes: `Mês ${i + 1}` }
    resultados?.forEach((r) => {
      entry[r.nome] = r.fluxoAcumulado[i]
    })
    return entry
  })

  // Cor da borda do input por cenario
  const borderCorMap: Record<string, string> = {
    pessimista: 'border-red-400',
    realista:   'border-blue-400',
    otimista:   'border-green-400',
  }
  const getBorderCor = (id: string) =>
    borderCorMap[id] ?? 'border-purple-400'

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
            <TrendingUp size={18} className="text-green-500" />
            <h1 className="text-xl font-bold text-foreground">Cenarios Financeiros</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
            <History size={14} />
            Historico
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : savedAt ? <CheckCircle size={14} className="text-green-500" /> : <Save size={14} />}
            {saving ? 'Salvando...' : savedAt ? `Salvo ${savedAt}` : 'Salvar'}
          </button>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Compare diferentes cenarios de crescimento ou reducao com base nos dados financeiros da empresa.
      </p>

      {/* Dados base */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Dados Base</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Faturamento Mensal Base (R$)</label>
            <input
              type="number"
              value={base.faturamentoMensal}
              onChange={(e) => {
                setBase((b) => ({ ...b, faturamentoMensal: Number(e.target.value) }))
                setSimulado(false)
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Custos Fixos Mensais (R$)</label>
            <input
              type="number"
              value={base.custosFixos}
              onChange={(e) => {
                setBase((b) => ({ ...b, custosFixos: Number(e.target.value) }))
                setSimulado(false)
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Custos Variaveis (%)</label>
            <input
              type="number"
              value={base.custosVariaveisPct}
              min={0}
              max={100}
              onChange={(e) => {
                setBase((b) => ({ ...b, custosVariaveisPct: Number(e.target.value) }))
                setSimulado(false)
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Periodo: 12 meses</p>
      </div>

      {/* Cenarios */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Configuracao dos Cenarios</h2>
          <button
            onClick={handleAddCenario}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-dashed border-purple-400 text-purple-500 hover:bg-purple-500/10 transition-colors"
          >
            <Plus size={13} />
            Adicionar Cenario Custom
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cenarios.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border-2 ${getBorderCor(c.id)} bg-background p-4 space-y-3`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ background: c.cor }}
                  />
                  <input
                    type="text"
                    value={c.nome}
                    onChange={(e) => handleCenarioChange(c.id, 'nome', e.target.value)}
                    className="text-sm font-semibold text-foreground bg-transparent border-none outline-none w-full"
                  />
                </div>
                {!['pessimista', 'realista', 'otimista'].includes(c.id) && (
                  <button
                    onClick={() => handleRemoveCenario(c.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Variacao Faturamento (%)</label>
                  <input
                    type="number"
                    value={c.faturamentoVariacao}
                    onChange={(e) => {
                      handleCenarioChange(c.id, 'faturamentoVariacao', Number(e.target.value))
                    }}
                    className="w-full px-2 py-1.5 text-sm rounded border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Variacao Custos (%)</label>
                  <input
                    type="number"
                    value={c.custosVariacao}
                    onChange={(e) => {
                      handleCenarioChange(c.id, 'custosVariacao', Number(e.target.value))
                    }}
                    className="w-full px-2 py-1.5 text-sm rounded border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSimular}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
          >
            <TrendingUp size={15} />
            Simular
          </button>
        </div>
      </div>

      {/* Resultados */}
      {simulado && resultados && resultados.length > 0 && (
        <>
          {/* Tabela comparativa */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Comparativo de Cenarios</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Valores acumulados em {PERIODO} meses. Verde = melhor valor, Vermelho = pior valor.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Indicador
                    </th>
                    {resultados.map((r) => (
                      <th key={r.id} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: r.cor }} />
                          <span style={{ color: r.cor }}>{r.nome}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Faturamento Total */}
                  <tr>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Faturamento Total</td>
                    {resultados.map((r) => {
                      const vals = resultados.map((x) => x.faturamentoTotal)
                      return (
                        <CellBest
                          key={r.id}
                          value={r.faturamentoTotal}
                          isBest={r.faturamentoTotal === Math.max(...vals)}
                          isWorst={r.faturamentoTotal === Math.min(...vals)}
                        />
                      )
                    })}
                  </tr>
                  {/* Custos Totais */}
                  <tr>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Custos Totais</td>
                    {resultados.map((r) => {
                      const vals = resultados.map((x) => x.custosTotais)
                      return (
                        <CellBest
                          key={r.id}
                          value={r.custosTotais}
                          isBest={r.custosTotais === Math.min(...vals)}
                          isWorst={r.custosTotais === Math.max(...vals)}
                        />
                      )
                    })}
                  </tr>
                  {/* Lucro Liquido */}
                  <tr>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Lucro Liquido</td>
                    {resultados.map((r) => {
                      const vals = resultados.map((x) => x.lucroLiquido)
                      return (
                        <CellBest
                          key={r.id}
                          value={r.lucroLiquido}
                          isBest={r.lucroLiquido === Math.max(...vals)}
                          isWorst={r.lucroLiquido === Math.min(...vals)}
                        />
                      )
                    })}
                  </tr>
                  {/* Margem Liquida */}
                  <tr>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Margem Liquida %</td>
                    {resultados.map((r) => {
                      const vals = resultados.map((x) => x.margemLiquida)
                      return (
                        <CellBest
                          key={r.id}
                          value={r.margemLiquida}
                          isBest={r.margemLiquida === Math.max(...vals)}
                          isWorst={r.margemLiquida === Math.min(...vals)}
                          isCurrency={false}
                        />
                      )
                    })}
                  </tr>
                  {/* Saldo Final */}
                  <tr>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-medium">Saldo Final de Caixa</td>
                    {resultados.map((r) => {
                      const vals = resultados.map((x) => x.saldoFinal)
                      return (
                        <CellBest
                          key={r.id}
                          value={r.saldoFinal}
                          isBest={r.saldoFinal === Math.max(...vals)}
                          isWorst={r.saldoFinal === Math.min(...vals)}
                        />
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grafico */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-1">Fluxo de Caixa Acumulado — 12 Meses</h2>
            <p className="text-xs text-muted-foreground mb-5">Evolucao do saldo acumulado por cenario ao longo do periodo.</p>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                {resultados.map((r) => (
                  <Line
                    key={r.id}
                    type="monotone"
                    dataKey={r.nome}
                    stroke={r.cor}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Historico de simulacoes */}
      {clienteAtivo && (
        <SimulacaoHistorico
          empresaId={clienteAtivo.id}
          tipo="CENARIOS_FINANCEIROS"
          onLoad={handleLoadSimulacao}
          refreshKey={refreshKey}
        />
      )}
    </div>
  )
}
