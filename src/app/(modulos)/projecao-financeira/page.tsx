'use client'

import { useState, useCallback } from 'react'
import type {
  ProjecaoFinanceiraCompleta,
  ResultadoProfecia,
  KPIsProfecia,
  LinhaDRE,
  ProjecaoFaturamento,
} from '@/types'
import {
  gerarResultadoProfecia,
  calcularKPIs,
  gerarDRECompleto,
} from '@/lib/calculations/financeiro'
import {
  gerarProjecaoCenarios,
  getFaturamentoCenario,
} from '@/lib/calculations/cenarios'
import { DashboardProfecia } from '@/components/projecao/DashboardProfecia'
import { DREProjetado } from '@/components/projecao/DREProjetado'
import { ComparativoCenarios } from '@/components/projecao/ComparativoCenarios'
import { SimuladorCenarios } from '@/components/projecao/SimuladorCenarios'
import EtapaVendas from '@/components/projecao/EtapaVendas'
import EtapaRecebimentos from '@/components/projecao/EtapaRecebimentos'
import EtapaDespesas from '@/components/projecao/EtapaDespesas'
import EtapaPagamentos from '@/components/projecao/EtapaPagamentos'
import EtapaInvestimentos from '@/components/projecao/EtapaInvestimentos'
import {
  TrendingUp,
  ArrowLeftRight,
  ReceiptText,
  CreditCard,
  BarChart3,
  LayoutDashboard,
  FileBarChart,
  GitCompare,
  SlidersHorizontal,
  PlayCircle,
  ChevronRight,
} from 'lucide-react'

// ============================================================
// Dados iniciais — Confort Maison (mock)
// ============================================================

const ANO_BASE_DEFAULT = new Date().getFullYear() - 1

const ESTADO_INICIAL: ProjecaoFinanceiraCompleta = {
  empresaId: 'confort-maison',
  nome: 'Projecao 2025 — Confort Maison',
  anoBase: ANO_BASE_DEFAULT + 1,
  saldoInicial: 100000,

  premissasVendas: {
    historico: [
      { mes: 1,  ano: ANO_BASE_DEFAULT, valor: 88000 },
      { mes: 2,  ano: ANO_BASE_DEFAULT, valor: 82000 },
      { mes: 3,  ano: ANO_BASE_DEFAULT, valor: 95000 },
      { mes: 4,  ano: ANO_BASE_DEFAULT, valor: 91000 },
      { mes: 5,  ano: ANO_BASE_DEFAULT, valor: 104000 },
      { mes: 6,  ano: ANO_BASE_DEFAULT, valor: 110000 },
      { mes: 7,  ano: ANO_BASE_DEFAULT, valor: 107000 },
      { mes: 8,  ano: ANO_BASE_DEFAULT, valor: 118000 },
      { mes: 9,  ano: ANO_BASE_DEFAULT, valor: 122000 },
      { mes: 10, ano: ANO_BASE_DEFAULT, valor: 130000 },
      { mes: 11, ano: ANO_BASE_DEFAULT, valor: 143000 },
      { mes: 12, ano: ANO_BASE_DEFAULT, valor: 150000 },
    ],
    taxaCrescimentoBase: 15,
    cenarios: {
      pessimista: -14,
      realista: 0,
      otimista: 16,
      agressivo: 30,
      ativo: 'realista',
    },
  },

  condicoesRecebimento: {
    percentualAVista: 38,
    percentualAPrazo: 62,
    distribuicaoParcelas: [
      { qtdParcelas: 4, percentual: 100 },
    ],
    antecipaRecebiveis: false,
    percentualAntecipacao: 95,
    taxaDesconto: 7,
  },

  condicoesPagamento: {
    percentualAVista: 1,
    percentualAPrazo: 99,
    distribuicaoParcelas: [
      { qtdParcelas: 1, percentual: 50 },
      { qtdParcelas: 2, percentual: 38 },
      { qtdParcelas: 3, percentual: 10 },
      { qtdParcelas: 4, percentual: 2 },
    ],
  },

  despesas: {
    variaveis: [
      { id: '1', nome: 'Impostos / Simples', percentual: 11, categoria: 'impostos' },
      { id: '2', nome: 'Comissoes de Vendas', percentual: 1,  categoria: 'comissoes' },
      { id: '3', nome: 'CMV / CPV',           percentual: 53, categoria: 'cmv' },
    ],
    fixos: [
      { id: '4', nome: 'Pessoal / CLT',         valor: 40000, categoria: 'pessoal' },
      { id: '5', nome: 'Pro-labore Diretoria',   valor: 15000, categoria: 'diretoria' },
      { id: '6', nome: 'Comercial / Marketing',  valor: 6000,  categoria: 'comercial' },
      { id: '7', nome: 'Administrativo',         valor: 8000,  categoria: 'administrativo' },
      { id: '8', nome: 'Financeiro',             valor: 2000,  categoria: 'financeiro' },
    ],
  },

  investimentos: [],
  financiamentos: [],
  contasReceber: [],
  contasPagar: [],
  metaPERs: 0,
  metaPEPerc: 0,
}

// ============================================================
// Step config
// ============================================================

type StepId = 1 | 2 | 3 | 4 | 5
type ResultTab = 'profecia' | 'dre' | 'cenarios' | 'simulador'

interface StepConfig {
  id: StepId
  label: string
  icon: React.ReactNode
  sublabel: string
}

const STEPS: StepConfig[] = [
  { id: 1, label: 'Vendas',        icon: <TrendingUp size={15} />,      sublabel: 'Historico e cenarios' },
  { id: 2, label: 'Recebimentos',  icon: <ArrowLeftRight size={15} />,  sublabel: 'PMR e antecipacao' },
  { id: 3, label: 'Despesas',      icon: <ReceiptText size={15} />,     sublabel: 'Fixas e variaveis' },
  { id: 4, label: 'Pagamentos',    icon: <CreditCard size={15} />,      sublabel: 'PMP e contas a pagar' },
  { id: 5, label: 'Investimentos', icon: <BarChart3 size={15} />,       sublabel: 'CAPEX e financiamentos' },
]

const RESULT_TABS = [
  { id: 'profecia' as ResultTab, label: 'Dashboard',  icon: <LayoutDashboard size={14} /> },
  { id: 'dre'     as ResultTab, label: 'DRE',         icon: <FileBarChart size={14} /> },
  { id: 'cenarios' as ResultTab, label: 'Cenarios',   icon: <GitCompare size={14} /> },
  { id: 'simulador' as ResultTab, label: 'Simulador', icon: <SlidersHorizontal size={14} /> },
]

// ============================================================
// Resultados state
// ============================================================

interface ResultadosCalculados {
  resultado: ResultadoProfecia
  kpis: KPIsProfecia
  dreLinhas: LinhaDRE[]
  projecoes: ProjecaoFaturamento[]
  faturamento: number[]
}

// ============================================================
// Main Page
// ============================================================

export default function ProjecaoFinanceiraPage() {
  const [dados, setDados] = useState<ProjecaoFinanceiraCompleta>(ESTADO_INICIAL)
  const [anoBase, setAnoBase] = useState(ANO_BASE_DEFAULT)
  const anoProjecao = anoBase + 1
  const [currentStep, setCurrentStep] = useState<StepId | 6>(1)
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('profecia')
  const [resultados, setResultados] = useState<ResultadosCalculados | null>(null)
  const [calculando, setCalculando] = useState(false)

  // ── Calcular projecao ────────────────────────────────────────
  const calcular = useCallback(() => {
    setCalculando(true)
    try {
      const projecoes = gerarProjecaoCenarios({
        historico: dados.premissasVendas.historico,
        anoProjecao: anoProjecao,
        taxaCrescimentoBase: dados.premissasVendas.taxaCrescimentoBase,
        cenarios: dados.premissasVendas.cenarios,
      })

      const faturamento = getFaturamentoCenario(projecoes, dados.premissasVendas.cenarios.ativo)

      const resultado = gerarResultadoProfecia({ projecao: dados, faturamentoMensal: faturamento })

      const kpis = calcularKPIs({
        resultado,
        faturamentoMensal: faturamento,
        metaPERS: dados.metaPERs,
        metaPEPerc: dados.metaPEPerc,
      })

      const dreLinhas = gerarDRECompleto({
        faturamentoMensal: faturamento,
        despesas: dados.despesas,
        resultado,
      })

      setResultados({ resultado, kpis, dreLinhas, projecoes, faturamento })
      setCurrentStep(6)
      setActiveResultTab('profecia')
    } finally {
      setCalculando(false)
    }
  }, [dados, anoProjecao])

  // ── Sidebar item ─────────────────────────────────────────────
  function SidebarStep({ step }: { step: StepConfig }) {
    const isActive = currentStep === step.id
    const isDone = typeof currentStep === 'number' && currentStep > step.id
    return (
      <button
        onClick={() => setCurrentStep(step.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
          isActive
            ? 'bg-primary/15 border border-primary/30'
            : 'hover:bg-secondary border border-transparent'
        }`}
      >
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            isActive
              ? 'bg-primary text-white'
              : isDone
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-secondary text-muted-foreground border border-border group-hover:border-primary/30'
          }`}
        >
          {isDone ? '✓' : step.id}
        </div>
        <div className="min-w-0">
          <p
            className={`text-xs font-medium leading-none ${
              isActive ? 'text-primary' : isDone ? 'text-green-400' : 'text-muted-foreground'
            }`}
          >
            {step.label}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{step.sublabel}</p>
        </div>
        {isActive && <ChevronRight size={12} className="ml-auto text-primary flex-shrink-0" />}
      </button>
    )
  }

  function SidebarResultTab({ tab }: { tab: typeof RESULT_TABS[0] }) {
    const isActive = currentStep === 6 && activeResultTab === tab.id
    return (
      <button
        onClick={() => {
          setCurrentStep(6)
          setActiveResultTab(tab.id)
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
          isActive
            ? 'bg-primary/15 border border-primary/30 text-primary'
            : 'hover:bg-secondary border border-transparent text-muted-foreground'
        }`}
      >
        <span className="flex-shrink-0">{tab.icon}</span>
        <span className="text-xs font-medium">{tab.label}</span>
        {isActive && <ChevronRight size={12} className="ml-auto text-primary flex-shrink-0" />}
      </button>
    )
  }

  // ── Step content ─────────────────────────────────────────────
  function renderStepContent() {
    if (currentStep === 6 && resultados) {
      if (activeResultTab === 'profecia') {
        return (
          <DashboardProfecia
            resultado={resultados.resultado}
            kpis={resultados.kpis}
            faturamento={resultados.faturamento}
          />
        )
      }
      if (activeResultTab === 'dre') {
        return <DREProjetado linhas={resultados.dreLinhas} />
      }
      if (activeResultTab === 'cenarios') {
        return (
          <ComparativoCenarios
            projecoes={resultados.projecoes}
            cenarioAtivo={dados.premissasVendas.cenarios.ativo}
          />
        )
      }
      if (activeResultTab === 'simulador') {
        return (
          <SimuladorCenarios
            dadosBase={dados}
            resultadoBase={resultados.resultado}
            kpisBase={resultados.kpis}
            faturamento={resultados.faturamento}
          />
        )
      }
    }

    if (currentStep === 1) {
      return (
        <EtapaVendas
          premissas={dados.premissasVendas}
          onChange={(p) => setDados((d) => ({ ...d, premissasVendas: p }))}
          anoBase={anoBase}
          onAnoBaseChange={setAnoBase}
        />
      )
    }
    if (currentStep === 2) {
      return (
        <EtapaRecebimentos
          condicoes={dados.condicoesRecebimento}
          onChange={(c) => setDados((d) => ({ ...d, condicoesRecebimento: c }))}
        />
      )
    }
    if (currentStep === 3) {
      return (
        <EtapaDespesas
          despesas={dados.despesas}
          onChange={(dep) => setDados((d) => ({ ...d, despesas: dep }))}
        />
      )
    }
    if (currentStep === 4) {
      return (
        <EtapaPagamentos
          condicoes={dados.condicoesPagamento}
          contasPagar={dados.contasPagar}
          onChange={(c) => setDados((d) => ({ ...d, condicoesPagamento: c }))}
          onChangeContas={(cp) => setDados((d) => ({ ...d, contasPagar: cp }))}
        />
      )
    }
    if (currentStep === 5) {
      return (
        <EtapaInvestimentos
          investimentos={dados.investimentos}
          financiamentos={dados.financiamentos}
          contasReceber={dados.contasReceber}
          onChangeInv={(inv) => setDados((d) => ({ ...d, investimentos: inv }))}
          onChangeFin={(fin) => setDados((d) => ({ ...d, financiamentos: fin }))}
          onChangeCR={(cr) => setDados((d) => ({ ...d, contasReceber: cr }))}
        />
      )
    }

    return null
  }

  // ── Step title ───────────────────────────────────────────────
  function renderTitle() {
    if (currentStep === 6 && resultados) {
      const tab = RESULT_TABS.find((t) => t.id === activeResultTab)
      return tab ? tab.label : 'Resultados'
    }
    const step = STEPS.find((s) => s.id === currentStep)
    return step ? `Etapa ${step.id} — ${step.label}` : ''
  }

  function renderSubtitle() {
    if (currentStep === 6) {
      if (activeResultTab === 'profecia') return 'Fluxo de caixa projetado PROFECIA — 12 meses'
      if (activeResultTab === 'dre') return 'Demonstracao do Resultado do Exercicio projetado'
      if (activeResultTab === 'cenarios') return 'Comparativo dos 4 cenarios de faturamento'
      if (activeResultTab === 'simulador') return 'Ajuste variaveis em tempo real e veja o impacto na projecao'
    }
    const step = STEPS.find((s) => s.id === currentStep)
    return step ? step.sublabel : ''
  }

  // ── Mobile top bar steps ─────────────────────────────────────
  function MobileStepBar() {
    return (
      <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id
          const isDone = typeof currentStep === 'number' && currentStep > step.id
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary/15 border border-primary/30'
                  : 'bg-card border border-border'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive
                    ? 'bg-primary text-white'
                    : isDone
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isDone ? '✓' : step.id}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </button>
          )
        })}
        {currentStep === 6 && resultados && (
          <>
            {RESULT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveResultTab(tab.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  activeResultTab === tab.id
                    ? 'bg-primary/15 border border-primary/30'
                    : 'bg-card border border-border'
                }`}
              >
                <span className={activeResultTab === tab.id ? 'text-primary' : 'text-muted-foreground'}>
                  {tab.icon}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    activeResultTab === tab.id ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-bold text-foreground">Projecao Financeira — 12 Meses</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Modelo PROFECIA — Confort Maison · {anoProjecao}
        </p>
      </div>

      {/* Mobile step bar */}
      <div className="px-4 pt-3 lg:hidden">
        <MobileStepBar />
      </div>

      {/* Main layout */}
      <div className="flex h-[calc(100vh-69px)]">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-border bg-card p-3 gap-1">
          {/* Etapas label */}
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1 mb-1">
            Etapas
          </p>

          {STEPS.map((step) => (
            <SidebarStep key={step.id} step={step} />
          ))}

          {/* Divider */}
          <div className="my-2 border-t border-border" />

          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1 mb-1">
            Resultados
          </p>

          {RESULT_TABS.map((tab) => (
            <SidebarResultTab key={tab.id} tab={tab} />
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Calcular button */}
          <button
            onClick={calcular}
            disabled={calculando}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: calculando
                ? 'hsl(var(--secondary))'
                : 'linear-gradient(135deg, #F17522 0%, #e8621a 100%)',
              color: calculando ? 'hsl(var(--muted-foreground))' : 'white',
            }}
          >
            <PlayCircle size={16} />
            {calculando ? 'Calculando...' : 'Calcular Projecao'}
          </button>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Content header */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-foreground">{renderTitle()}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{renderSubtitle()}</p>
            </div>

            {/* Step content */}
            {renderStepContent()}

            {/* Bottom navigation (mobile + desktop) */}
            <div className="mt-8 flex items-center justify-between gap-3">
              {/* Prev */}
              {typeof currentStep === 'number' && currentStep > 1 && currentStep <= 5 && (
                <button
                  onClick={() => setCurrentStep((currentStep - 1) as StepId)}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-secondary transition-colors"
                >
                  ← Anterior
                </button>
              )}
              {currentStep === 6 && (
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-secondary transition-colors"
                >
                  ← Editar Dados
                </button>
              )}

              <div className="flex-1" />

              {/* Next / Calcular */}
              {typeof currentStep === 'number' && currentStep < 5 && (
                <button
                  onClick={() => setCurrentStep((currentStep + 1) as StepId)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'hsl(var(--primary))', color: 'white' }}
                >
                  Proxima Etapa →
                </button>
              )}
              {currentStep === 5 && (
                <button
                  onClick={calcular}
                  disabled={calculando}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #F17522 0%, #e8621a 100%)',
                    color: 'white',
                  }}
                >
                  <PlayCircle size={16} />
                  {calculando ? 'Calculando...' : 'Calcular Projecao'}
                </button>
              )}

              {/* Mobile calcular button (always visible on mobile) */}
              {currentStep !== 5 && currentStep !== 6 && (
                <button
                  onClick={calcular}
                  disabled={calculando}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all disabled:opacity-60"
                  style={{ background: 'hsl(var(--primary))', color: 'white' }}
                >
                  <PlayCircle size={14} />
                  Calcular
                </button>
              )}
            </div>

            {/* No results state */}
            {currentStep === 6 && !resultados && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <PlayCircle size={32} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-semibold text-lg">Nenhum calculo realizado</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Preencha os dados nas etapas e clique em &quot;Calcular Projecao&quot;
                  </p>
                </div>
                <button
                  onClick={calcular}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #F17522 0%, #e8621a 100%)', color: 'white' }}
                >
                  <PlayCircle size={16} />
                  Calcular Projecao
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
