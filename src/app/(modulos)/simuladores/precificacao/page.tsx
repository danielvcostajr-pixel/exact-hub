'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  History,
  Tag,
  Percent,
  TrendingUp,
  Star,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { saveSimulador, getSimuladorByEmpresa, getCurrentUserId } from '@/lib/api/data-service'
import { SimulacaoHistorico } from '@/components/simuladores/SimulacaoHistorico'
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

// ─── helpers ────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const pctFmt = (v: number, decimals = 2) => `${v.toFixed(decimals)}%`

// ─── types ───────────────────────────────────────────────────────────────────

type Metodo = 'markup' | 'margem'

interface ResultadoPrecificacao {
  precoSugerido: number
  custoTotal: number
  impostosValor: number
  comissoesValor: number
  margemLiquida: number
  margemEfetiva: number
  markupEfetivo: number
  breakdownRows: Array<{ label: string; valor: number; tipo: 'positivo' | 'negativo' | 'neutro' | 'total' }>
}

interface LinhasSensibilidade {
  variacao: number
  preco: number
  volumeEstimado: number
  receitaTotal: number
  lucroTotal: number
  isMaxLucro?: boolean
}

// ─── sensitivity calc ────────────────────────────────────────────────────────

const calcularSensibilidade = (
  precoBase: number,
  custoTotal: number,
  impostoPct: number,
  comissaoPct: number,
  volumeBase = 100,
): LinhasSensibilidade[] => {
  const variacoes = [-20, -15, -10, -5, 0, 5, 10, 15, 20]
  const linhas: LinhasSensibilidade[] = variacoes.map((v) => {
    const preco = precoBase * (1 + v / 100)
    // elasticity: -10% price => +5% volume
    const elasticidade = -0.5
    const volume = Math.round(volumeBase * (1 + (elasticidade * v) / 100))
    const receitaTotal = preco * volume
    const impostos = preco * (impostoPct / 100) * volume
    const comissoes = preco * (comissaoPct / 100) * volume
    const lucroTotal = receitaTotal - custoTotal * volume - impostos - comissoes
    return { variacao: v, preco, volumeEstimado: volume, receitaTotal, lucroTotal }
  })

  const maxLucro = Math.max(...linhas.map((l) => l.lucroTotal))
  return linhas.map((l) => ({ ...l, isMaxLucro: l.lucroTotal === maxLucro }))
}

// ─── component ──────────────────────────────────────────────────────────────

export default function PrecificacaoPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  // Custos
  const [custoProduto, setCustoProduto] = useState<string>('')
  const [custosFixosRateados, setCustosFixosRateados] = useState<string>('')

  // Impostos e comissões
  const [impostos, setImpostos] = useState<string>('')
  const [comissoes, setComissoes] = useState<string>('')

  // Método
  const [metodo, setMetodo] = useState<Metodo>('markup')
  const [markupPercentual, setMarkupPercentual] = useState<string>('')
  const [margemDesejada, setMargemDesejada] = useState<string>('')

  // Sensibilidade
  const [sensibilidade, setSensibilidade] = useState(false)
  const [volumeBase, setVolumeBase] = useState<string>('100')

  // Results
  const [resultado, setResultado] = useState<ResultadoPrecificacao | null>(null)
  const [linhasSensibilidade, setLinhasSensibilidade] = useState<LinhasSensibilidade[]>([])

  // Save state
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // ── Load from historico callback ────────────────────────────────────────
  const handleLoadSimulacao = useCallback((inputs: Record<string, unknown>, outputs: Record<string, unknown>) => {
    const inp = inputs as {
      custoProduto?: string
      custosFixosRateados?: string
      impostos?: string
      comissoes?: string
      metodo?: Metodo
      markupPercentual?: string
      margemDesejada?: string
      sensibilidade?: boolean
      volumeBase?: string
    }
    if (inp.custoProduto !== undefined) setCustoProduto(inp.custoProduto)
    if (inp.custosFixosRateados !== undefined) setCustosFixosRateados(inp.custosFixosRateados)
    if (inp.impostos !== undefined) setImpostos(inp.impostos)
    if (inp.comissoes !== undefined) setComissoes(inp.comissoes)
    if (inp.metodo !== undefined) setMetodo(inp.metodo)
    if (inp.markupPercentual !== undefined) setMarkupPercentual(inp.markupPercentual)
    if (inp.margemDesejada !== undefined) setMargemDesejada(inp.margemDesejada)
    if (inp.sensibilidade !== undefined) setSensibilidade(inp.sensibilidade)
    if (inp.volumeBase !== undefined) setVolumeBase(inp.volumeBase)
    const out = outputs as { resultado?: ResultadoPrecificacao; linhasSensibilidade?: LinhasSensibilidade[] }
    if (out.resultado !== undefined) setResultado(out.resultado)
    if (out.linhasSensibilidade !== undefined) setLinhasSensibilidade(out.linhasSensibilidade)
  }, [])

  // ── Load saved data on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!clienteAtivo) return
    async function loadSaved() {
      try {
        const saved = await getSimuladorByEmpresa(clienteAtivo!.id, 'precificacao')
        if (saved?.inputs) {
          const inputs = saved.inputs as {
            custoProduto?: string
            custosFixosRateados?: string
            impostos?: string
            comissoes?: string
            metodo?: Metodo
            markupPercentual?: string
            margemDesejada?: string
            sensibilidade?: boolean
            volumeBase?: string
          }
          if (inputs.custoProduto !== undefined) setCustoProduto(inputs.custoProduto)
          if (inputs.custosFixosRateados !== undefined) setCustosFixosRateados(inputs.custosFixosRateados)
          if (inputs.impostos !== undefined) setImpostos(inputs.impostos)
          if (inputs.comissoes !== undefined) setComissoes(inputs.comissoes)
          if (inputs.metodo !== undefined) setMetodo(inputs.metodo)
          if (inputs.markupPercentual !== undefined) setMarkupPercentual(inputs.markupPercentual)
          if (inputs.margemDesejada !== undefined) setMargemDesejada(inputs.margemDesejada)
          if (inputs.sensibilidade !== undefined) setSensibilidade(inputs.sensibilidade)
          if (inputs.volumeBase !== undefined) setVolumeBase(inputs.volumeBase)
          if (saved.updatedAt) {
            setSavedAt(new Date(saved.updatedAt).toLocaleString('pt-BR'))
          }
        }
      } catch { /* ignore */ }
    }
    loadSaved()
  }, [clienteAtivo])

  // ── Save handler ────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!clienteAtivo) return
    setSaving(true)
    try {
      const userId = await getCurrentUserId()
      await saveSimulador({
        empresaId: clienteAtivo.id,
        tipo: 'precificacao',
        nome: 'Precificação',
        inputs: {
          custoProduto,
          custosFixosRateados,
          impostos,
          comissoes,
          metodo,
          markupPercentual,
          margemDesejada,
          sensibilidade,
          volumeBase,
        },
        outputs: { resultado, linhasSensibilidade },
        criadoPorId: userId || 'system',
      })
      setSavedAt(new Date().toLocaleString('pt-BR'))
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error('Erro ao salvar simulador:', err)
    } finally {
      setSaving(false)
    }
  }, [clienteAtivo, custoProduto, custosFixosRateados, impostos, comissoes, metodo, markupPercentual, margemDesejada, sensibilidade, volumeBase, resultado, linhasSensibilidade])

  // ─────────────────────────────────────────────────────────────────────────
  // Calculation
  // ─────────────────────────────────────────────────────────────────────────

  const calcular = () => {
    const cp = parseFloat(custoProduto) || 0
    const cfr = parseFloat(custosFixosRateados) || 0
    const impPct = parseFloat(impostos) || 0
    const comPct = parseFloat(comissoes) || 0
    const custoTotal = cp + cfr

    let preco = 0

    if (metodo === 'markup') {
      const mu = parseFloat(markupPercentual) || 0
      preco = custoTotal * (1 + mu / 100)
    } else {
      const mg = parseFloat(margemDesejada) || 0
      const divisor = 1 - mg / 100 - impPct / 100 - comPct / 100
      if (divisor <= 0) return
      preco = custoTotal / divisor
    }

    const impostosValor = preco * (impPct / 100)
    const comissoesValor = preco * (comPct / 100)
    const margemLiquida = preco - custoTotal - impostosValor - comissoesValor
    const margemEfetiva = (margemLiquida / preco) * 100
    const markupEfetivo = ((preco - custoTotal) / custoTotal) * 100

    const breakdownRows = [
      { label: 'Custo do Produto', valor: cp, tipo: 'negativo' as const },
      { label: 'Custos Fixos Rateados', valor: cfr, tipo: 'negativo' as const },
      { label: 'Impostos', valor: impostosValor, tipo: 'negativo' as const },
      { label: 'Comissões', valor: comissoesValor, tipo: 'negativo' as const },
      { label: 'Margem Líquida', valor: margemLiquida, tipo: margemLiquida >= 0 ? 'positivo' as const : 'negativo' as const },
      { label: 'Preço Sugerido', valor: preco, tipo: 'total' as const },
    ]

    setResultado({
      precoSugerido: preco,
      custoTotal,
      impostosValor,
      comissoesValor,
      margemLiquida,
      margemEfetiva,
      markupEfetivo,
      breakdownRows,
    })

    if (sensibilidade) {
      const vol = parseInt(volumeBase) || 100
      setLinhasSensibilidade(calcularSensibilidade(preco, custoTotal, impPct, comPct, vol))
    } else {
      setLinhasSensibilidade([])
    }
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
                <Tag className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Precificação</h1>
                <p className="text-xs text-muted-foreground">Simulador de preços</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <History className="h-4 w-4" />
              Histórico
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedAt ? <CheckCircle className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : savedAt ? `Salvo ${savedAt}` : 'Salvar Simulação'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* ── Left: Inputs ── */}
          <div className="space-y-4 lg:col-span-2">
            {/* Card 1 — Custos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Custos do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="custoProduto">Custo do Produto (R$)</Label>
                  <Input
                    id="custoProduto"
                    type="number"
                    min={0}
                    step={0.01}
                    value={custoProduto}
                    onChange={(e) => setCustoProduto(e.target.value)}
                    placeholder="Ex: 85,00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="custosFixosRateados">Custos Fixos Rateados (R$)</Label>
                  <Input
                    id="custosFixosRateados"
                    type="number"
                    min={0}
                    step={0.01}
                    value={custosFixosRateados}
                    onChange={(e) => setCustosFixosRateados(e.target.value)}
                    placeholder="Ex: 30,00"
                  />
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Custo Total:{' '}
                  <span className="font-semibold text-foreground">
                    {brl((parseFloat(custoProduto) || 0) + (parseFloat(custosFixosRateados) || 0))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 — Impostos e Comissões */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Impostos e Comissões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="impostos">Impostos (%)</Label>
                  <div className="relative">
                    <Input
                      id="impostos"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={impostos}
                      onChange={(e) => setImpostos(e.target.value)}
                      placeholder="Ex: 8"
                      className="pr-8"
                    />
                    <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="comissoes">Comissões (%)</Label>
                  <div className="relative">
                    <Input
                      id="comissoes"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={comissoes}
                      onChange={(e) => setComissoes(e.target.value)}
                      placeholder="Ex: 5"
                      className="pr-8"
                    />
                    <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3 — Método */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Método de Precificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Radio group — manual implementation without separate component */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodo('markup')}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                      metodo === 'markup'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-600'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <TrendingUp className="mx-auto mb-1 h-4 w-4" />
                    Markup
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodo('margem')}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                      metodo === 'margem'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-600'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Percent className="mx-auto mb-1 h-4 w-4" />
                    Margem
                  </button>
                </div>

                {metodo === 'markup' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="markupPercentual">Markup (%)</Label>
                    <div className="relative">
                      <Input
                        id="markupPercentual"
                        type="number"
                        min={0}
                        value={markupPercentual}
                        onChange={(e) => setMarkupPercentual(e.target.value)}
                        placeholder="Ex: 80"
                        className="pr-8"
                      />
                      <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Preço = Custo Total × (1 + Markup%)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="margemDesejada">Margem Desejada (%)</Label>
                    <div className="relative">
                      <Input
                        id="margemDesejada"
                        type="number"
                        min={0}
                        max={99}
                        value={margemDesejada}
                        onChange={(e) => setMargemDesejada(e.target.value)}
                        placeholder="Ex: 30"
                        className="pr-8"
                      />
                      <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Preço = Custo Total / (1 - Margem% - Impostos% - Comissões%)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 4 — Análise de Sensibilidade toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={sensibilidade}
                    onCheckedChange={(v) => setSensibilidade(!!v)}
                  />
                  <div className="flex-1">
                    <p className="cursor-pointer font-medium text-sm text-foreground">
                      Análise de Sensibilidade
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Simula o impacto de variações de preço no lucro total
                    </p>
                  </div>
                </div>
                {sensibilidade && (
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor="volumeBase">Volume Base (unidades/mês)</Label>
                    <Input
                      id="volumeBase"
                      type="number"
                      min={1}
                      value={volumeBase}
                      onChange={(e) => setVolumeBase(e.target.value)}
                      placeholder="Ex: 100"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 py-5 text-base font-semibold text-white hover:from-orange-600 hover:to-orange-700"
              onClick={calcular}
            >
              Calcular Preço
            </Button>
          </div>

          {/* ── Right: Results ── */}
          <div className="space-y-6 lg:col-span-3">
            {resultado ? (
              <>
                {/* Big KPI */}
                <Card className="border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">Preço Sugerido</p>
                    <p className="mt-1 text-5xl font-bold tracking-tight text-orange-500">
                      {brl(resultado.precoSugerido)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Margem Líquida: </span>
                        <span
                          className={`font-semibold ${
                            resultado.margemEfetiva >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {pctFmt(resultado.margemEfetiva)} ({brl(resultado.margemLiquida)})
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Markup Efetivo: </span>
                        <span className="font-semibold text-foreground">
                          {pctFmt(resultado.markupEfetivo)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cross-method insight */}
                {metodo === 'markup' && (
                  <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardContent className="flex items-start gap-3 p-4">
                      <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                      <p className="text-sm text-muted-foreground">
                        Com markup de{' '}
                        <strong className="text-foreground">{markupPercentual}%</strong>, a{' '}
                        <strong className="text-foreground">margem efetiva</strong> após impostos e
                        comissões é de{' '}
                        <strong className={resultado.margemEfetiva >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {pctFmt(resultado.margemEfetiva)}
                        </strong>
                        .
                      </p>
                    </CardContent>
                  </Card>
                )}
                {metodo === 'margem' && (
                  <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardContent className="flex items-start gap-3 p-4">
                      <Percent className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                      <p className="text-sm text-muted-foreground">
                        Para garantir a margem desejada de{' '}
                        <strong className="text-foreground">{margemDesejada}%</strong>, o{' '}
                        <strong className="text-foreground">markup efetivo</strong> aplicado sobre
                        o custo total é de{' '}
                        <strong className="text-foreground">{pctFmt(resultado.markupEfetivo)}</strong>.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Breakdown Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Composição do Preço</CardTitle>
                    <CardDescription>Detalhamento de cada componente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0 text-sm">
                      {resultado.breakdownRows.map((row, i) => {
                        const isTotal = row.tipo === 'total'
                        const isNegative = row.tipo === 'negativo'
                        const isPositive = row.tipo === 'positivo'
                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-1 py-2.5 ${
                              isTotal
                                ? 'mt-1 border-t-2 border-orange-500/40 pt-3'
                                : i < resultado.breakdownRows.length - 1
                                ? 'border-b border-border/50'
                                : ''
                            }`}
                          >
                            <span
                              className={`${
                                isTotal ? 'font-bold text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {isTotal ? '' : i === resultado.breakdownRows.length - 2 ? '= ' : ''}
                              {row.label}
                            </span>
                            <span
                              className={`font-semibold ${
                                isTotal
                                  ? 'text-orange-500 text-base'
                                  : isNegative
                                  ? 'text-red-500'
                                  : isPositive
                                  ? 'text-green-500'
                                  : 'text-foreground'
                              }`}
                            >
                              {isNegative ? `(${brl(row.valor)})` : brl(row.valor)}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Visual breakdown bar */}
                    <div className="mt-5 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Distribuição visual do preço
                      </p>
                      <div className="flex h-8 w-full overflow-hidden rounded-lg">
                        {[
                          {
                            label: 'Custo Prod.',
                            value: parseFloat(custoProduto) || 0,
                            color: 'bg-slate-500',
                          },
                          {
                            label: 'Custos Fixos',
                            value: parseFloat(custosFixosRateados) || 0,
                            color: 'bg-slate-400',
                          },
                          {
                            label: 'Impostos',
                            value: resultado.impostosValor,
                            color: 'bg-red-400',
                          },
                          {
                            label: 'Comissões',
                            value: resultado.comissoesValor,
                            color: 'bg-amber-400',
                          },
                          {
                            label: 'Margem',
                            value: Math.max(0, resultado.margemLiquida),
                            color: 'bg-green-500',
                          },
                        ].map((seg, i) => {
                          const pct = (seg.value / resultado.precoSugerido) * 100
                          if (pct <= 0) return null
                          return (
                            <div
                              key={i}
                              className={`${seg.color} relative flex items-center justify-center`}
                              style={{ width: `${pct}%` }}
                              title={`${seg.label}: ${brl(seg.value)} (${pct.toFixed(1)}%)`}
                            >
                              {pct > 8 && (
                                <span className="text-xs font-medium text-white drop-shadow">
                                  {pct.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-500" /> Custo Produto
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-400" /> Custos Fixos
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Impostos
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /> Comissões
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" /> Margem Líquida
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sensitivity Table */}
                {linhasSensibilidade.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        Análise de Sensibilidade
                        <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-normal text-orange-600">
                          elasticidade -0,5
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Impacto de variações de preço no volume e lucro (base: {volumeBase} unidades)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/40">
                              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                                Variação
                              </th>
                              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                                Preço
                              </th>
                              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                                Volume
                              </th>
                              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                                Receita Total
                              </th>
                              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                                Lucro Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {linhasSensibilidade.map((linha) => (
                              <tr
                                key={linha.variacao}
                                className={`border-b border-border/50 transition-colors ${
                                  linha.isMaxLucro
                                    ? 'bg-green-500/10'
                                    : linha.variacao === 0
                                    ? 'bg-orange-500/5'
                                    : 'hover:bg-muted/30'
                                }`}
                              >
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    {linha.isMaxLucro && (
                                      <Star className="h-3.5 w-3.5 flex-shrink-0 fill-green-500 text-green-500" />
                                    )}
                                    <span
                                      className={`font-medium ${
                                        linha.variacao > 0
                                          ? 'text-green-600'
                                          : linha.variacao < 0
                                          ? 'text-red-500'
                                          : 'text-foreground'
                                      }`}
                                    >
                                      {linha.variacao === 0
                                        ? 'Base'
                                        : linha.variacao > 0
                                        ? `+${linha.variacao}%`
                                        : `${linha.variacao}%`}
                                    </span>
                                    {linha.isMaxLucro && (
                                      <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-xs text-green-600">
                                        máx. lucro
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-right font-medium text-foreground">
                                  {brl(linha.preco)}
                                </td>
                                <td className="px-4 py-2.5 text-right text-muted-foreground">
                                  {linha.volumeEstimado.toLocaleString('pt-BR')} un.
                                </td>
                                <td className="px-4 py-2.5 text-right text-foreground">
                                  {brl(linha.receitaTotal)}
                                </td>
                                <td
                                  className={`px-4 py-2.5 text-right font-semibold ${
                                    linha.lucroTotal >= 0 ? 'text-green-500' : 'text-red-500'
                                  }`}
                                >
                                  {brl(linha.lucroTotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-border px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                          Elasticidade aplicada: a cada -10% no preço, volume estimado +5% (e vice-versa).
                          Os valores são estimativas para auxiliar na tomada de decisão.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Tag className="mx-auto h-14 w-14 text-muted-foreground/30" />
                  <p className="mt-4 text-base font-medium text-muted-foreground">
                    Configure os parâmetros e clique em{' '}
                    <strong className="text-foreground">Calcular Preço</strong>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Os resultados aparecerão aqui
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historico de simulacoes */}
        {clienteAtivo && (
          <SimulacaoHistorico
            empresaId={clienteAtivo.id}
            tipo="precificacao"
            onLoad={handleLoadSimulacao}
            refreshKey={refreshKey}
          />
        )}
      </div>
    </div>
  )
}
