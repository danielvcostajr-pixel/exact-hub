'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Target, ArrowLeft } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { Button } from '@/components/ui/button'
import { OKRCard, type OKR, type OKRStatus } from '@/components/planejamento/OKRCard'
import { FormOKR, type OKRFormData } from '@/components/planejamento/FormOKR'

function gerarId() {
  return Math.random().toString(36).substring(2, 10)
}

const MOCK_OKRS: OKR[] = [
  {
    id: 'okr-1',
    objetivo: 'Tornar-se a marca de decoracao mais lembrada da regiao',
    descricao:
      'Aumentar reconhecimento de marca e participacao de mercado na regiao Sudeste, consolidando a Confort Maison como referencia em design e qualidade.',
    status: 'Ativo',
    prazoInicio: '01/01/2025',
    prazoFim: '31/03/2025',
    responsavelId: 'usr-1',
    responsavelNome: 'Ana Beatriz Costa',
    keyResults: [
      {
        id: 'kr-1a',
        descricao: 'Aumentar NPS de clientes de 52 para 75 pontos',
        metaInicial: 52,
        metaAlvo: 75,
        valorAtual: 66,
        unidade: 'pts',
        responsavelId: 'usr-1',
        responsavelNome: 'Ana Beatriz Costa',
      },
      {
        id: 'kr-1b',
        descricao: 'Crescer seguidores no Instagram de 12k para 25k',
        metaInicial: 12000,
        metaAlvo: 25000,
        valorAtual: 18500,
        unidade: 'seguidores',
        responsavelId: 'usr-2',
        responsavelNome: 'Carlos Eduardo Lima',
      },
      {
        id: 'kr-1c',
        descricao: 'Conquistar 3 premios ou mencoes em midia especializada',
        metaInicial: 0,
        metaAlvo: 3,
        valorAtual: 1,
        unidade: 'premios',
        responsavelId: 'usr-3',
        responsavelNome: 'Fernanda Oliveira',
      },
    ],
  },
  {
    id: 'okr-2',
    objetivo: 'Dobrar o faturamento online ate o fim do trimestre',
    descricao:
      'Alavancar o canal de e-commerce e marketplaces para reduzir dependencia das lojas fisicas e ampliar o alcance geografico da Confort Maison.',
    status: 'Ativo',
    prazoInicio: '01/01/2025',
    prazoFim: '31/03/2025',
    responsavelId: 'usr-4',
    responsavelNome: 'Rodrigo Mendes',
    keyResults: [
      {
        id: 'kr-2a',
        descricao: 'Crescer faturamento e-commerce de R$ 80k para R$ 160k/mes',
        metaInicial: 80000,
        metaAlvo: 160000,
        valorAtual: 112000,
        unidade: 'R$',
        responsavelId: 'usr-4',
        responsavelNome: 'Rodrigo Mendes',
      },
      {
        id: 'kr-2b',
        descricao: 'Atingir taxa de conversao de 2,5% no site',
        metaInicial: 1.2,
        metaAlvo: 2.5,
        valorAtual: 1.8,
        unidade: '%',
        responsavelId: 'usr-4',
        responsavelNome: 'Rodrigo Mendes',
      },
      {
        id: 'kr-2c',
        descricao: 'Lançar loja no Mercado Livre e atingir 4 estrelas',
        metaInicial: 0,
        metaAlvo: 4,
        valorAtual: 3.7,
        unidade: 'estrelas',
        responsavelId: 'usr-5',
        responsavelNome: 'Patricia Sousa',
      },
    ],
  },
  {
    id: 'okr-3',
    objetivo: 'Construir um time de alta performance em vendas',
    descricao:
      'Estruturar processos, treinamentos e incentivos para transformar a equipe comercial da Confort Maison em referencia de produtividade e satisfacao.',
    status: 'Rascunho',
    prazoInicio: '01/04/2025',
    prazoFim: '30/06/2025',
    responsavelId: 'usr-5',
    responsavelNome: 'Patricia Sousa',
    keyResults: [
      {
        id: 'kr-3a',
        descricao: 'Treinar 100% da equipe de vendas com nova metodologia',
        metaInicial: 0,
        metaAlvo: 100,
        valorAtual: 0,
        unidade: '%',
        responsavelId: 'usr-5',
        responsavelNome: 'Patricia Sousa',
      },
      {
        id: 'kr-3b',
        descricao: 'Aumentar ticket medio de R$ 1.800 para R$ 2.500',
        metaInicial: 1800,
        metaAlvo: 2500,
        valorAtual: 1800,
        unidade: 'R$',
        responsavelId: 'usr-2',
        responsavelNome: 'Carlos Eduardo Lima',
      },
    ],
  },
]

const STATUS_ORDER: OKRStatus[] = ['Ativo', 'Rascunho', 'Concluido', 'Cancelado']

export default function OKRsPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [okrs, setOkrs] = useState<OKR[]>(MOCK_OKRS)
  const [formOpen, setFormOpen] = useState(false)

  const statusCounts = okrs.reduce(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
    {} as Record<string, number>
  )
  const ativos = okrs.filter((o) => o.status === 'Ativo')
  const avgProgress =
    ativos.length > 0
      ? Math.round(
          ativos.reduce((acc, okr) => {
            const krs = okr.keyResults
            if (krs.length === 0) return acc
            const avg =
              krs.reduce((s, kr) => {
                const range = kr.metaAlvo - kr.metaInicial
                if (range === 0) return s + 100
                return s + Math.min(100, Math.max(0, ((kr.valorAtual - kr.metaInicial) / range) * 100))
              }, 0) / krs.length
            return acc + avg
          }, 0) / ativos.length
        )
      : 0

  function handleUpdateKR(okrId: string, krId: string, novoValor: number) {
    setOkrs((prev) =>
      prev.map((okr) =>
        okr.id === okrId
          ? {
              ...okr,
              keyResults: okr.keyResults.map((kr) =>
                kr.id === krId ? { ...kr, valorAtual: novoValor } : kr
              ),
            }
          : okr
      )
    )
  }

  function handleSaveOKR(data: OKRFormData) {
    const RESPONSAVEIS: Record<string, string> = {
      'usr-1': 'Ana Beatriz Costa',
      'usr-2': 'Carlos Eduardo Lima',
      'usr-3': 'Fernanda Oliveira',
      'usr-4': 'Rodrigo Mendes',
      'usr-5': 'Patricia Sousa',
    }
    const novoOKR: OKR = {
      id: gerarId(),
      objetivo: data.objetivo,
      descricao: data.descricao,
      status: 'Rascunho',
      prazoInicio: data.prazoInicio,
      prazoFim: data.prazoFim,
      responsavelId: data.responsavelId,
      responsavelNome: RESPONSAVEIS[data.responsavelId] ?? 'Responsavel',
      keyResults: data.keyResults.map((kr) => ({
        ...kr,
        valorAtual: kr.metaInicial,
        responsavelNome: RESPONSAVEIS[kr.responsavelId] ?? 'Responsavel',
      })),
    }
    setOkrs((prev) => [novoOKR, ...prev])
  }

  const sortedOkrs = [...okrs].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  )

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Client */}
      <div className="flex items-center gap-3">
        <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        {clienteAtivo && (
          <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>
        )}
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target size={22} className="text-primary" />
            OKRs — Objetivos e Resultados-Chave
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clienteAtivo?.nome ?? 'Cliente'} — {okrs.length} objetivo{okrs.length !== 1 ? 's' : ''} cadastrado{okrs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shrink-0"
        >
          <Plus size={16} />
          Novo OKR
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ativos', value: statusCounts['Ativo'] ?? 0, color: 'text-blue-500' },
          { label: 'Rascunhos', value: statusCounts['Rascunho'] ?? 0, color: 'text-muted-foreground' },
          { label: 'Concluidos', value: statusCounts['Concluido'] ?? 0, color: 'text-green-500' },
          { label: 'Progresso medio', value: `${avgProgress}%`, color: 'text-primary', icon: true },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className={`text-2xl font-bold tabular-nums ${item.color}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* OKR List */}
      <div className="flex flex-col gap-3">
        {sortedOkrs.map((okr) => (
          <OKRCard key={okr.id} okr={okr} onUpdateKRValor={handleUpdateKR} />
        ))}
        {okrs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
            <Target size={36} className="text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum OKR cadastrado</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Crie o primeiro objetivo da empresa
            </p>
          </div>
        )}
      </div>

      <FormOKR open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSaveOKR} />
    </div>
  )
}
