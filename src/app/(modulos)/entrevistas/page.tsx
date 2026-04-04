'use client'

import { useState } from 'react'
import { Plus, ClipboardList, MessageSquare, BarChart3, Eye, Send, CheckCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FormQuestionario } from '@/components/entrevistas/FormQuestionario'
import { RespostaCard } from '@/components/entrevistas/RespostaCard'
import { AnalisePareto } from '@/components/entrevistas/AnalisePareto'
import { Entrevista, RespostaEntrevista, StatusEntrevista } from '@/types'

// Mock data
const ENTREVISTAS_MOCK: Entrevista[] = [
  {
    id: 'ent-1',
    empresaId: 'emp-1',
    titulo: 'Diagnostico Organizacional Q1 2025',
    descricao: 'Mapeamento dos processos e alinhamento estrategico da equipe de lideranca.',
    status: 'ANALISADA',
    perguntas: [
      { id: 'p1', texto: 'Como voce avalia a clareza dos processos internos?', categoria: 'Processos', tipo: 'escala' },
      { id: 'p2', texto: 'Quais sao os principais gargalos de produtividade?', categoria: 'Processos', tipo: 'aberta' },
      { id: 'p3', texto: 'O quanto a equipe esta alinhada com os objetivos estrategicos?', categoria: 'Estrategia', tipo: 'escala' },
      { id: 'p4', texto: 'Como avalia as ferramentas tecnologicas disponíveis?', categoria: 'Tecnologia', tipo: 'escala' },
    ],
    analise: {
      resumoExecutivo:
        'A analise de 8 entrevistas revelou que gestao de processos e comunicacao interna concentram 67% das queixas, configurando os pontos criticos prioritarios. A lideranca e vista positivamente por 85% dos respondentes.',
      temas: [
        { tema: 'Gestao de Processos', frequencia: 7, percentual: 29.2, acumulado: 29.2, categoria: 'Processos' },
        { tema: 'Comunicacao Interna', frequencia: 5, percentual: 20.8, acumulado: 50.0, categoria: 'Pessoas' },
        { tema: 'Tecnologia Desatualizada', frequencia: 4, percentual: 16.7, acumulado: 66.7, categoria: 'Tecnologia' },
        { tema: 'Metas Pouco Claras', frequencia: 3, percentual: 12.5, acumulado: 79.2, categoria: 'Estrategia' },
        { tema: 'Treinamento Insuficiente', frequencia: 3, percentual: 12.5, acumulado: 91.7, categoria: 'Pessoas' },
        { tema: 'Outros', frequencia: 2, percentual: 8.3, acumulado: 100, categoria: 'Outros' },
      ],
      pontosCriticos: [
        'Falta de padronizacao nos processos operacionais — cada gestor adota praticas diferentes',
        'Comunicacao entre setores e fragil, gerando retrabalho e perda de informacoes',
        'Sistema ERP desatualizado compromete a agilidade operacional',
      ],
      pontosPositivos: [
        'Lideranca e reconhecida como acessivel e engajada pela maioria dos colaboradores',
        'Cultura de comprometimento com o cliente e forte em toda a organizacao',
        'Equipe demonstra alto potencial de adaptacao a mudancas',
      ],
      recomendacoes: [
        'Mapear e padronizar os 5 processos mais criticos nos proximos 90 dias',
        'Implementar reunioes semanais de alinhamento entre areas (Daily de 15min)',
        'Avaliar upgrade do ERP ou integracao com ferramentas complementares',
        'Criar programa de treinamento trimestral com foco em processos e tecnologia',
      ],
    },
    criadoPorId: 'usr-1',
  },
  {
    id: 'ent-2',
    empresaId: 'emp-1',
    titulo: 'Pesquisa de Clima — Equipe de Vendas',
    descricao: 'Avaliacao do ambiente de trabalho e satisfacao da equipe comercial.',
    status: 'ATIVA',
    perguntas: [
      { id: 'p5', texto: 'Como voce avalia seu nivel de satisfacao no trabalho?', categoria: 'Pessoas', tipo: 'escala' },
      { id: 'p6', texto: 'Voce tem as ferramentas necessarias para atingir suas metas?', categoria: 'Tecnologia', tipo: 'multipla_escolha', opcoes: ['Sim, totalmente', 'Parcialmente', 'Nao'] },
      { id: 'p7', texto: 'O que pode ser melhorado no processo de vendas?', categoria: 'Processos', tipo: 'aberta' },
    ],
    criadoPorId: 'usr-1',
  },
  {
    id: 'ent-3',
    empresaId: 'emp-1',
    titulo: 'Mapeamento de Competencias — Gerencias',
    descricao: 'Identificacao de gaps de competencia entre os gestores de nivel gerencial.',
    status: 'RASCUNHO',
    perguntas: [],
    criadoPorId: 'usr-1',
  },
]

const RESPOSTAS_MOCK: RespostaEntrevista[] = [
  {
    id: 'res-1',
    entrevistaId: 'ent-1',
    respondente: 'Carlos Mendes',
    cargo: 'Gerente de Operacoes',
    area: 'Operacoes',
    respostas: { p1: 4, p2: 'O maior gargalo e a falta de um processo padronizado para entrada de pedidos. Cada loja faz de um jeito diferente.', p3: 6, p4: 3 },
  },
  {
    id: 'res-2',
    entrevistaId: 'ent-1',
    respondente: 'Ana Paula Rocha',
    cargo: 'Coordenadora Financeira',
    area: 'Financeiro',
    respostas: { p1: 6, p2: 'A comunicacao entre vendas e financeiro e muito falha. Recebo fechamentos com dados errados frequentemente.', p3: 7, p4: 5 },
  },
  {
    id: 'res-3',
    entrevistaId: 'ent-1',
    respondente: 'Roberto Lima',
    cargo: 'Supervisor de Vendas',
    area: 'Comercial',
    respostas: { p1: 5, p2: 'Nao temos um CRM adequado. Usamos planilhas que frequentemente se perdem ou ficam desatualizadas.', p3: 8, p4: 4 },
  },
]

const STATUS_CONFIG: Record<StatusEntrevista, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  RASCUNHO: { label: 'Rascunho', color: '#B0B0B0', bg: '#1A1C1E', icon: <FileText size={10} /> },
  ATIVA: { label: 'Ativa', color: '#3B82F6', bg: '#3B82F6' + '22', icon: <Send size={10} /> },
  FINALIZADA: { label: 'Finalizada', color: '#10B981', bg: '#10B981' + '22', icon: <CheckCircle size={10} /> },
  ANALISADA: { label: 'Analisada', color: '#F17522', bg: '#F17522' + '22', icon: <BarChart3 size={10} /> },
}

export default function EntrevistasPage() {
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>(ENTREVISTAS_MOCK)
  const [respostas] = useState<RespostaEntrevista[]>(RESPOSTAS_MOCK)
  const [formOpen, setFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('questionarios')
  const [analiseAtiva, setAnaliseAtiva] = useState<string | null>('ent-1')

  function handleSaveEntrevista(entrevista: Entrevista) {
    setEntrevistas((prev) => [entrevista, ...prev])
  }

  function handleVerAnalise(entrevistaId: string) {
    setAnaliseAtiva(entrevistaId)
    setActiveTab('analise')
  }

  const entrevistaComAnalise = entrevistas.find((e) => e.id === analiseAtiva)

  return (
    <div className="flex flex-col gap-5 p-6 min-h-screen bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entrevistas com Equipe</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {entrevistas.length} questionarios criados • {respostas.length} respostas coletadas
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white gap-2"
          size="sm"
        >
          <Plus size={15} />
          Novo Questionario
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="questionarios"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground gap-1.5"
          >
            <ClipboardList size={13} />
            Questionarios
          </TabsTrigger>
          <TabsTrigger
            value="respostas"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground gap-1.5"
          >
            <MessageSquare size={13} />
            Respostas
          </TabsTrigger>
          <TabsTrigger
            value="analise"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground gap-1.5"
          >
            <BarChart3 size={13} />
            Analise
          </TabsTrigger>
        </TabsList>

        {/* Tab: Questionarios */}
        <TabsContent value="questionarios" className="mt-4">
          <div className="flex flex-col gap-3">
            {entrevistas.map((ent) => {
              const statusCfg = STATUS_CONFIG[ent.status]
              const respostasCount = respostas.filter((r) => r.entrevistaId === ent.id).length
              return (
                <div
                  key={ent.id}
                  className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: statusCfg.bg }}
                    >
                      <span style={{ color: statusCfg.color }}>{statusCfg.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{ent.titulo}</p>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                        >
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </div>
                      {ent.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ent.descricao}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-muted-foreground/50">{ent.perguntas.length} perguntas</span>
                        <span className="text-[11px] text-muted-foreground/50">•</span>
                        <span className="text-[11px] text-muted-foreground/50">{respostasCount} respostas</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ent.analise && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerAnalise(ent.id!)}
                        className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5 text-xs"
                      >
                        <BarChart3 size={12} />
                        Ver Analise
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground hover:bg-secondary gap-1.5 text-xs"
                    >
                      <Eye size={12} />
                      Abrir
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab: Respostas */}
        <TabsContent value="respostas" className="mt-4">
          {entrevistas
            .filter((ent) => respostas.some((r) => r.entrevistaId === ent.id))
            .map((ent) => {
              const respostasEnt = respostas.filter((r) => r.entrevistaId === ent.id)
              return (
                <div key={ent.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">{ent.titulo}</h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-border text-muted-foreground"
                    >
                      {respostasEnt.length} respostas
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-3">
                    {respostasEnt.map((resp) => (
                      <RespostaCard
                        key={resp.id}
                        resposta={resp}
                        perguntas={ent.perguntas}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

          {respostas.length === 0 && (
            <div
              className="rounded-lg border-dashed border p-8 text-center"
              style={{ borderColor: '#2A2C2E' }}
            >
              <MessageSquare size={24} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/50">Nenhuma resposta coletada ainda</p>
            </div>
          )}
        </TabsContent>

        {/* Tab: Analise */}
        <TabsContent value="analise" className="mt-4">
          {entrevistaComAnalise?.analise ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-muted-foreground">Analise de:</p>
                <p className="text-sm font-semibold text-foreground">{entrevistaComAnalise.titulo}</p>
              </div>
              <AnalisePareto analise={entrevistaComAnalise.analise} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Selecione um questionario analisado:</p>
              {entrevistas
                .filter((e) => e.analise)
                .map((ent) => (
                  <button
                    key={ent.id}
                    onClick={() => handleVerAnalise(ent.id!)}
                    className="rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40 transition-colors"
                  >
                    <p className="text-sm font-semibold text-foreground">{ent.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ent.analise!.temas.length} temas identificados</p>
                  </button>
                ))}
              {entrevistas.filter((e) => e.analise).length === 0 && (
                <div
                  className="rounded-lg border-dashed border border-border p-8 text-center"
                >
                  <BarChart3 size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/50">Nenhum questionario foi analisado ainda</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <FormQuestionario
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveEntrevista}
        empresaId="emp-1"
      />
    </div>
  )
}
