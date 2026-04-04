'use client'

import { useState } from 'react'
import { Plus, ListChecks, ChevronDown, ChevronUp, Link2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MatrizRACI, type AcaoRaci, type UsuarioRaci } from '@/components/planejamento/MatrizRACI'

type StatusAcao = 'Pendente' | 'Em Andamento' | 'Concluida' | 'Bloqueada'

interface Acao {
  id: string
  descricao: string
  responsavel: string
  prazo: string
  status: StatusAcao
  prioridade: 'Alta' | 'Media' | 'Baixa'
  atribuicoes: Record<string, import('@/components/planejamento/MatrizRACI').RACIValue>
}

interface PlanoAcao {
  id: string
  titulo: string
  descricao: string
  okrVinculadoId?: string
  okrVinculadoTitulo?: string
  status: 'Ativo' | 'Concluido' | 'Rascunho'
  responsavel: string
  prazoFim: string
  acoes: Acao[]
}

const USUARIOS_RACI: UsuarioRaci[] = [
  { id: 'usr-1', nome: 'Ana Beatriz', papel: 'Diretora' },
  { id: 'usr-2', nome: 'Carlos Eduardo', papel: 'Comercial' },
  { id: 'usr-3', nome: 'Fernanda', papel: 'Marketing' },
  { id: 'usr-4', nome: 'Rodrigo', papel: 'E-commerce' },
  { id: 'usr-5', nome: 'Patricia', papel: 'RH' },
]

const MOCK_PLANOS: PlanoAcao[] = [
  {
    id: 'plan-1',
    titulo: 'Lancamento do Canal Digital',
    descricao:
      'Plano de acoes para estruturar e lancar o canal de vendas online da Confort Maison, cobrindo e-commerce, marketplaces e campanhas digitais.',
    okrVinculadoId: 'okr-2',
    okrVinculadoTitulo: 'Dobrar o faturamento online ate o fim do trimestre',
    status: 'Ativo',
    responsavel: 'Rodrigo Mendes',
    prazoFim: '31/03/2025',
    acoes: [
      {
        id: 'ac-1a',
        descricao: 'Contratar agencia de performance digital',
        responsavel: 'Ana Beatriz Costa',
        prazo: '10/01/2025',
        status: 'Concluida',
        prioridade: 'Alta',
        atribuicoes: { 'usr-1': 'A', 'usr-3': 'R', 'usr-4': 'C', 'usr-2': 'I', 'usr-5': null },
      },
      {
        id: 'ac-1b',
        descricao: 'Configurar e-commerce com catalogo inicial de 50 produtos',
        responsavel: 'Rodrigo Mendes',
        prazo: '20/01/2025',
        status: 'Concluida',
        prioridade: 'Alta',
        atribuicoes: { 'usr-1': 'A', 'usr-3': 'C', 'usr-4': 'R', 'usr-2': 'C', 'usr-5': null },
      },
      {
        id: 'ac-1c',
        descricao: 'Criar conta no Mercado Livre e cadastrar produtos',
        responsavel: 'Rodrigo Mendes',
        prazo: '31/01/2025',
        status: 'Em Andamento',
        prioridade: 'Alta',
        atribuicoes: { 'usr-1': 'I', 'usr-3': 'C', 'usr-4': 'R', 'usr-2': 'A', 'usr-5': null },
      },
      {
        id: 'ac-1d',
        descricao: 'Definir estrategia de trafego pago (Google + Meta Ads)',
        responsavel: 'Fernanda Oliveira',
        prazo: '15/02/2025',
        status: 'Em Andamento',
        prioridade: 'Media',
        atribuicoes: { 'usr-1': 'A', 'usr-3': 'R', 'usr-4': 'C', 'usr-2': 'I', 'usr-5': null },
      },
      {
        id: 'ac-1e',
        descricao: 'Implementar sistema de logistica reversa',
        responsavel: 'Rodrigo Mendes',
        prazo: '28/02/2025',
        status: 'Pendente',
        prioridade: 'Media',
        atribuicoes: { 'usr-1': 'A', 'usr-3': 'I', 'usr-4': 'R', 'usr-2': 'C', 'usr-5': null },
      },
    ],
  },
  {
    id: 'plan-2',
    titulo: 'Programa de Fidelizacao de Clientes',
    descricao:
      'Estruturar um programa de pontos e beneficios para reter clientes e aumentar o NPS da Confort Maison.',
    okrVinculadoId: 'okr-1',
    okrVinculadoTitulo: 'Tornar-se a marca de decoracao mais lembrada da regiao',
    status: 'Ativo',
    responsavel: 'Ana Beatriz Costa',
    prazoFim: '30/06/2025',
    acoes: [
      {
        id: 'ac-2a',
        descricao: 'Pesquisa de satisfacao com 200 clientes ativos',
        responsavel: 'Ana Beatriz Costa',
        prazo: '15/01/2025',
        status: 'Concluida',
        prioridade: 'Alta',
        atribuicoes: { 'usr-1': 'R', 'usr-3': 'C', 'usr-4': null, 'usr-2': 'I', 'usr-5': 'A' },
      },
      {
        id: 'ac-2b',
        descricao: 'Definir mecanica do programa de fidelidade',
        responsavel: 'Ana Beatriz Costa',
        prazo: '01/02/2025',
        status: 'Em Andamento',
        prioridade: 'Alta',
        atribuicoes: { 'usr-1': 'R', 'usr-3': 'C', 'usr-4': 'C', 'usr-2': 'C', 'usr-5': 'A' },
      },
      {
        id: 'ac-2c',
        descricao: 'Desenvolver app ou cartao de fidelidade',
        responsavel: 'Rodrigo Mendes',
        prazo: '01/04/2025',
        status: 'Pendente',
        prioridade: 'Media',
        atribuicoes: { 'usr-1': 'A', 'usr-3': 'C', 'usr-4': 'R', 'usr-2': 'I', 'usr-5': 'I' },
      },
    ],
  },
  {
    id: 'plan-3',
    titulo: 'Reestruturacao do Processo de Vendas',
    descricao:
      'Mapear, documentar e otimizar o processo comercial da Confort Maison para aumentar a conversao e o ticket medio.',
    status: 'Rascunho',
    responsavel: 'Patricia Sousa',
    prazoFim: '30/06/2025',
    acoes: [
      {
        id: 'ac-3a',
        descricao: 'Mapear o processo de vendas atual (as-is)',
        responsavel: 'Patricia Sousa',
        prazo: '15/04/2025',
        status: 'Pendente',
        prioridade: 'Alta',
        atribuicoes: { 'usr-1': 'A', 'usr-3': null, 'usr-4': null, 'usr-2': 'C', 'usr-5': 'R' },
      },
      {
        id: 'ac-3b',
        descricao: 'Definir novo playbook comercial',
        responsavel: 'Carlos Eduardo Lima',
        prazo: '30/04/2025',
        status: 'Pendente',
        prioridade: 'Alta',
        atribuicoes: { 'usr-1': 'A', 'usr-3': null, 'usr-4': null, 'usr-2': 'R', 'usr-5': 'C' },
      },
    ],
  },
]

const STATUS_STYLES: Record<string, string> = {
  Ativo: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  Concluido: 'bg-green-500/15 text-green-500 border-green-500/30',
  Rascunho: 'bg-secondary text-muted-foreground border-border',
}

const PRIOR_STYLES: Record<string, string> = {
  Alta: 'bg-red-500/15 text-red-500 border-red-500/30',
  Media: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  Baixa: 'bg-green-500/15 text-green-500 border-green-500/30',
}

const ACAO_STATUS_STYLES: Record<string, string> = {
  Pendente: 'bg-secondary text-muted-foreground border-border',
  'Em Andamento': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  Concluida: 'bg-green-500/15 text-green-500 border-green-500/30',
  Bloqueada: 'bg-red-500/15 text-red-500 border-red-500/30',
}

function calcProgress(acoes: Acao[]): number {
  if (acoes.length === 0) return 0
  const done = acoes.filter((a) => a.status === 'Concluida').length
  return Math.round((done / acoes.length) * 100)
}

function PlanoCard({ plano }: { plano: PlanoAcao }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'acoes' | 'raci'>('acoes')
  const progress = calcProgress(plano.acoes)
  const done = plano.acoes.filter((a) => a.status === 'Concluida').length

  const raciAcoes: AcaoRaci[] = plano.acoes.map((a) => ({
    id: a.id,
    descricao: a.descricao,
    status: a.status,
    atribuicoes: a.atribuicoes,
  }))

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left flex flex-col gap-3 p-5 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[11px] border px-2 py-0 ${STATUS_STYLES[plano.status]}`}
              >
                {plano.status}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {plano.acoes.length} acao{plano.acoes.length !== 1 ? 'oes' : ''}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {done} concluida{done !== 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{plano.titulo}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{plano.descricao}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold tabular-nums text-primary">{progress}%</span>
            {expanded ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-1.5" />

        {/* Meta */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Resp.: <span className="text-foreground">{plano.responsavel}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Prazo: <span className="text-foreground">{plano.prazoFim}</span>
          </span>
          {plano.okrVinculadoTitulo && (
            <span className="text-xs text-primary flex items-center gap-1">
              <Link2 size={10} />
              Vinculado: {plano.okrVinculadoTitulo.substring(0, 45)}...
            </span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('acoes')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'acoes'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              Acoes
            </button>
            <button
              onClick={() => setActiveTab('raci')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'raci'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Users size={12} />
              Matriz RACI
            </button>
          </div>

          {/* Acoes tab */}
          {activeTab === 'acoes' && (
            <div className="flex flex-col gap-2">
              {plano.acoes.map((acao) => (
                <div
                  key={acao.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-sm text-foreground leading-snug">{acao.descricao}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{acao.responsavel.split(' ')[0]}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{acao.prazo}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] border px-1.5 py-0 ${PRIOR_STYLES[acao.prioridade]}`}
                      >
                        {acao.prioridade}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] border px-1.5 py-0 whitespace-nowrap shrink-0 ${ACAO_STATUS_STYLES[acao.status]}`}
                  >
                    {acao.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* RACI tab */}
          {activeTab === 'raci' && (
            <MatrizRACI
              acoes={raciAcoes}
              usuarios={USUARIOS_RACI}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function PlanosAcaoPage() {
  const [planos] = useState<PlanoAcao[]>(MOCK_PLANOS)

  const ativos = planos.filter((p) => p.status === 'Ativo').length
  const totalAcoes = planos.reduce((s, p) => s + p.acoes.length, 0)
  const totalConcluidas = planos.reduce(
    (s, p) => s + p.acoes.filter((a) => a.status === 'Concluida').length,
    0
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListChecks size={22} className="text-primary" />
            Planos de Acao
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {planos.length} plano{planos.length !== 1 ? 's' : ''} — Confort Maison
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shrink-0"
        >
          <Plus size={16} />
          Novo Plano
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Planos ativos', value: ativos, color: 'text-blue-500' },
          { label: 'Rascunhos', value: planos.filter((p) => p.status === 'Rascunho').length, color: 'text-muted-foreground' },
          { label: 'Total de acoes', value: totalAcoes, color: 'text-foreground' },
          { label: 'Acoes concluidas', value: totalConcluidas, color: 'text-green-500' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Plans list */}
      <div className="flex flex-col gap-3">
        {planos.map((plano) => (
          <PlanoCard key={plano.id} plano={plano} />
        ))}
      </div>
    </div>
  )
}
