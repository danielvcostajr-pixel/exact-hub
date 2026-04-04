'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, ClipboardList, MessageSquare, BarChart3, Eye, Send, CheckCircle, FileText, ArrowLeft } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { getEntrevistasByEmpresa } from '@/lib/api/data-service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FormQuestionario } from '@/components/entrevistas/FormQuestionario'
import { RespostaCard } from '@/components/entrevistas/RespostaCard'
import { AnalisePareto } from '@/components/entrevistas/AnalisePareto'
import { Entrevista, RespostaEntrevista, StatusEntrevista } from '@/types'

const STATUS_CONFIG: Record<StatusEntrevista, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  RASCUNHO: { label: 'Rascunho', color: '#B0B0B0', bg: '#1A1C1E', icon: <FileText size={10} /> },
  ATIVA: { label: 'Ativa', color: '#3B82F6', bg: '#3B82F6' + '22', icon: <Send size={10} /> },
  FINALIZADA: { label: 'Finalizada', color: '#10B981', bg: '#10B981' + '22', icon: <CheckCircle size={10} /> },
  ANALISADA: { label: 'Analisada', color: '#F17522', bg: '#F17522' + '22', icon: <BarChart3 size={10} /> },
}

export default function EntrevistasPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([])
  const [respostas] = useState<RespostaEntrevista[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('questionarios')
  const [analiseAtiva, setAnaliseAtiva] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clienteAtivo) {
      setLoading(true)
      getEntrevistasByEmpresa(clienteAtivo.id)
        .then((data) => {
          setEntrevistas(data as unknown as Entrevista[])
        })
        .catch(() => setEntrevistas([]))
        .finally(() => setLoading(false))
    }
  }, [clienteAtivo])

  function handleSaveEntrevista(entrevista: Entrevista) {
    setEntrevistas((prev) => [entrevista, ...prev])
  }

  function handleVerAnalise(entrevistaId: string) {
    setAnaliseAtiva(entrevistaId)
    setActiveTab('analise')
  }

  const entrevistaComAnalise = entrevistas.find((e) => e.id === analiseAtiva)

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (entrevistas.length === 0) {
    return (
      <div className="flex flex-col gap-5 p-6 min-h-screen bg-background">
        <div className="flex items-center gap-3">
          <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          {clienteAtivo && (
            <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <ClipboardList size={24} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma entrevista realizada</h3>
            <p className="text-sm text-muted-foreground max-w-md">Crie a primeira entrevista para este cliente.</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gradient-exact text-white mt-2">
            <Plus size={16} />
            Criar Primeira Entrevista
          </Button>
        </div>
        <FormQuestionario
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveEntrevista}
          empresaId={clienteAtivo?.id ?? ''}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6 min-h-screen bg-background">
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
        empresaId={clienteAtivo?.id ?? ''}
      />
    </div>
  )
}
