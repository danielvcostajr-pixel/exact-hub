'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  History,
  TrendingUp,
  Percent,
  Target,
  PackageCheck,
} from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

// ─── helpers ────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// ─── custom tooltip ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltipFinanceiro = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-md">
      <p className="mb-1 font-semibold text-foreground">Faturamento: {brl(label)}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {brl(entry.value)}
        </p>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltipUnidades = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-md">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {brl(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ─── types ───────────────────────────────────────────────────────────────────

interface ResultadoFinanceiro {
  pe: number
  mc: number
  distancia: number
  faturamentoAtual: number
  acimaDoPE: boolean
  chartData: Array<{ faturamento: number; receita: number; custoTotal: number; lucro: number }>
}

interface ResultadoUnidades {
  peUnidades: number
  mcUnitaria: number
  mcPercent: number
  chartData: Array<{ name: string; valor: number; fill: string }>
}

// ─── component ──────────────────────────────────────────────────────────────

export default function PontoEquilibrioPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  // ── Tab Financeiro state ──────────────────────────────────────────────────
  const [custosFixos, setCustosFixos] = useState<string>('')
  const [custosVariaveis, setCustosVariaveis] = useState<string>('')
  const [faturamentoAtual, setFaturamentoAtual] = useState<string>('')
  const [importarProjecao, setImportarProjecao] = useState(false)
  const [resultadoFin, setResultadoFin] = useState<ResultadoFinanceiro | null>(null)

  // ── Tab Unidades state ────────────────────────────────────────────────────
  const [custosFixosU, setCustosFixosU] = useState<string>('')
  const [precoUnitario, setPrecoUnitario] = useState<string>('')
  const [custoVariavelU, setCustoVariavelU] = useState<string>('')
  const [resultadoUni, setResultadoUni] = useState<ResultadoUnidades | null>(null)

  // ── saved alert ──────────────────────────────────────────────────────────
  const [saved, setSaved] = useState(false)

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — Financeiro
  // ─────────────────────────────────────────────────────────────────────────

  const handleImportarProjecao = (checked: boolean) => {
    setImportarProjecao(checked)
    if (checked) {
      setCustosFixos('71000')
      setCustosVariaveis('65')
    }
  }

  const calcularFinanceiro = () => {
    const cf = parseFloat(custosFixos) || 0
    const cvPct = parseFloat(custosVariaveis) / 100 || 0
    const fat = parseFloat(faturamentoAtual) || 0

    if (cvPct >= 1) return

    const pe = cf / (1 - cvPct)
    const mc = (1 - cvPct) * 100
    const distancia = fat - pe

    // Build chart data: points from 0 to pe*2 (or fat*1.5 whichever larger)
    const maxX = Math.max(pe * 2, fat * 1.5, 10000)
    const steps = 10
    const increment = maxX / steps
    const chartData = Array.from({ length: steps + 1 }, (_, i) => {
      const x = Math.round(i * increment)
      return {
        faturamento: x,
        receita: x,
        custoTotal: Math.round(cf + x * cvPct),
        lucro: Math.round(x - cf - x * cvPct),
      }
    })

    setResultadoFin({ pe, mc, distancia, faturamentoAtual: fat, acimaDoPE: distancia >= 0, chartData })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — Unidades
  // ─────────────────────────────────────────────────────────────────────────

  const calcularUnidades = () => {
    const cf = parseFloat(custosFixosU) || 0
    const preco = parseFloat(precoUnitario) || 0
    const cv = parseFloat(custoVariavelU) || 0

    if (preco <= cv) return

    const mcUnitaria = preco - cv
    const peUnidades = Math.ceil(cf / mcUnitaria)
    const mcPercent = (mcUnitaria / preco) * 100

    const chartData = [
      { name: 'Custo Variável', valor: cv, fill: '#ef4444' },
      { name: 'Margem de Contribuição', valor: mcUnitaria, fill: '#22c55e' },
    ]

    setResultadoUni({ peUnidades, mcUnitaria, mcPercent, chartData })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Save mock
  // ─────────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/simuladores">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="h-5 w-px bg-border" />
            {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Ponto de Equilíbrio</h1>
                <p className="text-xs text-muted-foreground">Simulador financeiro</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-sm font-medium text-green-500">Simulação salva!</span>
            )}
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <History className="h-4 w-4" />
              Histórico
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              Salvar Simulação
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="financeiro" className="space-y-6">
          <TabsList className="w-fit">
            <TabsTrigger value="financeiro" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="unidades" className="gap-2">
              <PackageCheck className="h-4 w-4" />
              Unidades
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════════════════════════════
              TAB — FINANCEIRO
          ════════════════════════════════════════════ */}
          <TabsContent value="financeiro" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Inputs */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Parâmetros</CardTitle>
                  <CardDescription>Informe os dados para o cálculo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="custosFixos">Custos Fixos Mensais (R$)</Label>
                    <Input
                      id="custosFixos"
                      type="number"
                      min={0}
                      value={custosFixos}
                      onChange={(e) => setCustosFixos(e.target.value)}
                      placeholder="Ex: 80000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="custosVariaveis">Custos Variáveis (% do faturamento)</Label>
                    <div className="relative">
                      <Input
                        id="custosVariaveis"
                        type="number"
                        min={0}
                        max={99}
                        value={custosVariaveis}
                        onChange={(e) => setCustosVariaveis(e.target.value)}
                        placeholder="Ex: 40"
                        className="pr-8"
                      />
                      <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="faturamentoAtual">Faturamento Atual (R$)</Label>
                    <Input
                      id="faturamentoAtual"
                      type="number"
                      min={0}
                      value={faturamentoAtual}
                      onChange={(e) => setFaturamentoAtual(e.target.value)}
                      placeholder="Ex: 150000"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleImportarProjecao(!importarProjecao)}
                    className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-left hover:bg-muted/60 transition-colors"
                  >
                    <Checkbox
                      checked={importarProjecao}
                      onCheckedChange={(v) => handleImportarProjecao(!!v)}
                    />
                    <span className="cursor-pointer text-sm font-normal text-foreground">
                      Importar da Projeção Financeira
                    </span>
                  </button>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 font-semibold text-white hover:from-orange-600 hover:to-orange-700"
                    onClick={calcularFinanceiro}
                  >
                    Calcular
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              {resultadoFin ? (
                <div className="space-y-6 lg:col-span-2">
                  {/* KPIs */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-orange-500/30 bg-orange-500/5">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Ponto de Equilíbrio
                        </p>
                        <p className="mt-1 text-2xl font-bold text-orange-500">
                          {brl(resultadoFin.pe)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">faturamento mínimo</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Margem de Contribuição
                        </p>
                        <p className="mt-1 text-2xl font-bold text-primary">
                          {resultadoFin.mc.toFixed(1)}%
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">sobre o faturamento</p>
                      </CardContent>
                    </Card>

                    <Card
                      className={
                        resultadoFin.acimaDoPE
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-red-500/30 bg-red-500/5'
                      }
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Distância do PE
                        </p>
                        <p
                          className={`mt-1 text-2xl font-bold ${
                            resultadoFin.acimaDoPE ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {resultadoFin.acimaDoPE ? '+' : ''}
                          {brl(resultadoFin.distancia)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {resultadoFin.acimaDoPE ? 'acima do equilíbrio' : 'abaixo do equilíbrio'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Análise Gráfica</CardTitle>
                      <CardDescription>Receita × Custos Totais × Lucro</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart
                          data={resultadoFin.chartData}
                          margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="faturamento"
                            tickFormatter={(v) =>
                              new Intl.NumberFormat('pt-BR', {
                                notation: 'compact',
                                style: 'currency',
                                currency: 'BRL',
                              }).format(v)
                            }
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            label={{
                              value: 'Faturamento (R$)',
                              position: 'insideBottom',
                              offset: -4,
                              fontSize: 11,
                              fill: 'hsl(var(--muted-foreground))',
                            }}
                          />
                          <YAxis
                            tickFormatter={(v) =>
                              new Intl.NumberFormat('pt-BR', {
                                notation: 'compact',
                                style: 'currency',
                                currency: 'BRL',
                              }).format(v)
                            }
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip content={<CustomTooltipFinanceiro />} />
                          <Legend
                            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                          />
                          <ReferenceLine
                            x={resultadoFin.pe}
                            stroke="#f97316"
                            strokeDasharray="6 3"
                            label={{
                              value: 'PE',
                              position: 'top',
                              fill: '#f97316',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="receita"
                            name="Receita"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="custoTotal"
                            name="Custos Totais"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="lucro"
                            name="Lucro"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Interpretation */}
                  <Card className="border-border bg-muted/20">
                    <CardContent className="p-5">
                      <p className="text-sm font-semibold text-foreground">Interpretação</p>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                        {resultadoFin.acimaDoPE ? (
                          <>
                            Com um faturamento atual de{' '}
                            <span className="font-semibold text-foreground">
                              {brl(resultadoFin.faturamentoAtual)}
                            </span>
                            , a empresa está{' '}
                            <span className="font-semibold text-green-500">
                              {brl(resultadoFin.distancia)}
                            </span>{' '}
                            acima do ponto de equilíbrio de{' '}
                            <span className="font-semibold text-foreground">{brl(resultadoFin.pe)}</span>.
                            A margem de contribuição de{' '}
                            <span className="font-semibold text-foreground">
                              {resultadoFin.mc.toFixed(1)}%
                            </span>{' '}
                            indica que cada real faturado contribui com{' '}
                            <span className="font-semibold text-foreground">
                              {brl(resultadoFin.mc / 100)}
                            </span>{' '}
                            para cobrir os custos fixos e gerar lucro.
                          </>
                        ) : (
                          <>
                            Atenção: com faturamento de{' '}
                            <span className="font-semibold text-foreground">
                              {brl(resultadoFin.faturamentoAtual)}
                            </span>
                            , a empresa ainda está{' '}
                            <span className="font-semibold text-red-500">
                              {brl(Math.abs(resultadoFin.distancia))}
                            </span>{' '}
                            abaixo do ponto de equilíbrio de{' '}
                            <span className="font-semibold text-foreground">{brl(resultadoFin.pe)}</span>.
                            É necessário aumentar o faturamento ou reduzir os custos para atingir o
                            equilíbrio financeiro.
                          </>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center lg:col-span-2">
                  <div className="text-center">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Preencha os parâmetros e clique em <strong>Calcular</strong> para ver os resultados
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════
              TAB — UNIDADES
          ════════════════════════════════════════════ */}
          <TabsContent value="unidades" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Inputs */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Parâmetros por Unidade</CardTitle>
                  <CardDescription>Calcule o PE em quantidade de produtos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="custosFixosU">Custos Fixos (R$)</Label>
                    <Input
                      id="custosFixosU"
                      type="number"
                      min={0}
                      value={custosFixosU}
                      onChange={(e) => setCustosFixosU(e.target.value)}
                      placeholder="Ex: 50000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="precoUnitario">Preço Unitário (R$)</Label>
                    <Input
                      id="precoUnitario"
                      type="number"
                      min={0}
                      value={precoUnitario}
                      onChange={(e) => setPrecoUnitario(e.target.value)}
                      placeholder="Ex: 250"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="custoVariavelU">Custo Variável Unitário (R$)</Label>
                    <Input
                      id="custoVariavelU"
                      type="number"
                      min={0}
                      value={custoVariavelU}
                      onChange={(e) => setCustoVariavelU(e.target.value)}
                      placeholder="Ex: 120"
                    />
                    {parseFloat(custoVariavelU) >= parseFloat(precoUnitario) &&
                      custoVariavelU && precoUnitario && (
                        <p className="text-xs text-red-500">
                          O custo variável deve ser menor que o preço unitário.
                        </p>
                      )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 font-semibold text-white hover:from-orange-600 hover:to-orange-700"
                    onClick={calcularUnidades}
                  >
                    Calcular
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              {resultadoUni ? (
                <div className="space-y-6 lg:col-span-2">
                  {/* KPIs */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-orange-500/30 bg-orange-500/5">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          PE em Unidades
                        </p>
                        <p className="mt-1 text-3xl font-bold text-orange-500">
                          {resultadoUni.peUnidades.toLocaleString('pt-BR')}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">unidades/mês</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          MC Unitária
                        </p>
                        <p className="mt-1 text-2xl font-bold text-primary">
                          {brl(resultadoUni.mcUnitaria)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">por unidade vendida</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          MC (%)
                        </p>
                        <p className="mt-1 text-2xl font-bold text-primary">
                          {resultadoUni.mcPercent.toFixed(1)}%
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">sobre o preço</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bar chart — cost structure */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Estrutura de Custo por Unidade</CardTitle>
                      <CardDescription>
                        Composição do preço de venda — {brl(parseFloat(precoUnitario))}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={resultadoUni.chartData}
                          margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis
                            tickFormatter={(v) => brl(v)}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip content={<CustomTooltipUnidades />} />
                          <Bar dataKey="valor" name="Valor" radius={[4, 4, 0, 0]}>
                            {resultadoUni.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Breakdown table */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Demonstrativo por Unidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="text-muted-foreground">Preço de Venda</span>
                          <span className="font-semibold text-foreground">
                            {brl(parseFloat(precoUnitario))}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="text-muted-foreground">(-) Custo Variável Unitário</span>
                          <span className="font-semibold text-red-500">
                            ({brl(parseFloat(custoVariavelU))})
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="font-medium text-foreground">= Margem de Contribuição</span>
                          <span className="font-bold text-green-500">
                            {brl(resultadoUni.mcUnitaria)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Índice MC</span>
                          <span className="font-semibold text-foreground">
                            {resultadoUni.mcPercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="mt-3 rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">
                            Para cobrir os custos fixos de{' '}
                            <strong className="text-foreground">{brl(parseFloat(custosFixosU))}</strong>,
                            é necessário vender pelo menos{' '}
                            <strong className="text-orange-500">
                              {resultadoUni.peUnidades.toLocaleString('pt-BR')} unidades
                            </strong>{' '}
                            por mês (faturamento mínimo de{' '}
                            <strong className="text-foreground">
                              {brl(resultadoUni.peUnidades * parseFloat(precoUnitario))}
                            </strong>
                            ).
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center lg:col-span-2">
                  <div className="text-center">
                    <PackageCheck className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Preencha os parâmetros e clique em <strong>Calcular</strong> para ver os resultados
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
