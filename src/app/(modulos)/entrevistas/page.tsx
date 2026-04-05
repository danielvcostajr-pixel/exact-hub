'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, ClipboardList, MessageSquare, BarChart3, Eye, Send, CheckCircle, FileText, ArrowLeft, UserPlus, X, Loader2 } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { getEntrevistasByEmpresa, getRespostasByEntrevista, createResposta } from '@/lib/api/data-service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormQuestionario } from '@/components/entrevistas/FormQuestionario'
import { RespostaCard } from '@/components/entrevistas/RespostaCard'
import { AnalisePareto } from '@/components/entrevistas/AnalisePareto'
import { Entrevista, RespostaEntrevista, StatusEntrevista, Pergunta } from '@/types'

const STATUS_CONFIG: Record<StatusEntrevista, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  RASCUNHO: { label: 'Rascunho', color: '#B0B0B0', bg: '#1A1C1E', icon: <FileText size={10} /> },
  ATIVA: { label: 'Ativa', color: '#3B82F6', bg: '#3B82F6' + '22', icon: <Send size={10} /> },
  FINALIZADA: { label: 'Finalizada', color: '#10B981', bg: '#10B981' + '22', icon: <CheckCircle size={10} /> },
  ANALISADA: { label: 'Analisada', color: '#F17522', bg: '#F17522' + '22', icon: <BarChart3 size={10} /> },
}

// ── Response Collection Dialog ────────────────────────────────────────────────

function FormResponder({
  open,
  onClose,
  entrevista,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  entrevista: Entrevista | null
  onSaved: (resp: RespostaEntrevista) => void
}) {
  const [respondente, setRespondente] = useState('')
  const [cargo, setCargo] = useState('')
  const [area, setArea] = useState('')
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens with a new entrevista
  useEffect(() => {
    if (open) {
      setRespondente('')
      setCargo('')
      setArea('')
      setAnswers({})
      setError(null)
    }
  }, [open])

  if (!entrevista) return null

  const perguntas: Pergunta[] = entrevista.perguntas ?? []

  function updateAnswer(perguntaId: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [perguntaId]: value }))
  }

  async function handleSubmit() {
    if (!respondente.trim()) {
      setError('Informe o nome do respondente.')
      return
    }

    // Check all questions answered
    const unanswered = perguntas.filter((p) => {
      const val = answers[p.id]
      return val === undefined || val === ''
    })
    if (unanswered.length > 0) {
      setError(`Responda todas as perguntas. Faltam ${unanswered.length}.`)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const data = await createResposta({
        entrevistaId: entrevista.id!,
        respondente: respondente.trim(),
        cargo: cargo.trim() || undefined,
        area: area.trim() || undefined,
        respostas: answers,
      })
      onSaved(data as unknown as RespostaEntrevista)
      onClose()
    } catch (err) {
      setError('Erro ao salvar resposta. Tente novamente.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Coletar Resposta</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {entrevista.titulo} - {perguntas.length} perguntas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Respondent Info */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Dados do Respondente</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nome *</Label>
                <Input
                  value={respondente}
                  onChange={(e) => setRespondente(e.target.value)}
                  placeholder="Nome completo"
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cargo</Label>
                <Input
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Gerente"
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Area</Label>
                <Input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ex: Comercial"
                  className="bg-card border-border"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {perguntas.map((pergunta, idx) => (
              <div key={pergunta.id} className="rounded-lg border border-border bg-background p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-primary mt-0.5">{idx + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{pergunta.texto}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                        {pergunta.categoria}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                        {pergunta.tipo === 'aberta' ? 'Aberta' : pergunta.tipo === 'escala' ? 'Escala 1-10' : 'Multipla Escolha'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pl-5">
                  {pergunta.tipo === 'aberta' && (
                    <Textarea
                      value={(answers[pergunta.id] as string) ?? ''}
                      onChange={(e) => updateAnswer(pergunta.id, e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="bg-card border-border min-h-[80px] text-sm"
                    />
                  )}

                  {pergunta.tipo === 'escala' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => updateAnswer(pergunta.id, n)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                            answers[pergunta.id] === n
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                      <span className="text-[10px] text-muted-foreground/50 ml-2">
                        1 = Muito ruim, 10 = Excelente
                      </span>
                    </div>
                  )}

                  {pergunta.tipo === 'multipla_escolha' && pergunta.opcoes && (
                    <div className="space-y-1.5">
                      {pergunta.opcoes.map((opcao) => (
                        <label
                          key={opcao}
                          className="flex items-center gap-2.5 cursor-pointer group rounded-lg border border-border bg-card px-3 py-2 hover:border-primary/40 transition-colors"
                        >
                          <input
                            type="radio"
                            name={`pergunta-${pergunta.id}`}
                            checked={answers[pergunta.id] === opcao}
                            onChange={() => updateAnswer(pergunta.id, opcao)}
                            className="accent-primary"
                          />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors">{opcao}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {saving ? 'Salvando...' : 'Salvar Resposta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EntrevistasPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([])
  const [respostas, setRespostas] = useState<RespostaEntrevista[]>([])
  const [respostasCounts, setRespostasCounts] = useState<Record<string, number>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [responderOpen, setResponderOpen] = useState(false)
  const [entrevistaParaResponder, setEntrevistaParaResponder] = useState<Entrevista | null>(null)
  const [activeTab, setActiveTab] = useState('questionarios')
  const [analiseAtiva, setAnaliseAtiva] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load entrevistas and their response counts
  const loadData = useCallback(async () => {
    if (!clienteAtivo) return
    setLoading(true)
    try {
      const data = await getEntrevistasByEmpresa(clienteAtivo.id)
      const ents = data as unknown as Entrevista[]
      setEntrevistas(ents)

      // Load response counts for each entrevista
      const counts: Record<string, number> = {}
      const allRespostas: RespostaEntrevista[] = []
      await Promise.all(
        ents.map(async (ent) => {
          if (!ent.id) return
          try {
            const resps = await getRespostasByEntrevista(ent.id)
            counts[ent.id] = resps.length
            allRespostas.push(...(resps as unknown as RespostaEntrevista[]))
          } catch {
            counts[ent.id!] = 0
          }
        })
      )
      setRespostasCounts(counts)
      setRespostas(allRespostas)
    } catch {
      setEntrevistas([])
    } finally {
      setLoading(false)
    }
  }, [clienteAtivo])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleSaveEntrevista(entrevista: Entrevista) {
    setEntrevistas((prev) => [entrevista, ...prev])
  }

  function handleOpenResponder(entrevista: Entrevista) {
    setEntrevistaParaResponder(entrevista)
    setResponderOpen(true)
  }

  function handleRespostaSaved(resp: RespostaEntrevista) {
    setRespostas((prev) => [resp, ...prev])
    setRespostasCounts((prev) => ({
      ...prev,
      [resp.entrevistaId]: (prev[resp.entrevistaId] ?? 0) + 1,
    }))
  }

  function handleVerAnalise(entrevistaId: string) {
    setAnaliseAtiva(entrevistaId)
    setActiveTab('analise')
  }

  const totalRespostas = Object.values(respostasCounts).reduce((a, b) => a + b, 0)
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
            {entrevistas.length} questionarios criados &bull; {totalRespostas} respostas coletadas
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
              const respostasCount = respostasCounts[ent.id!] ?? 0
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
                        <span className="text-[11px] text-muted-foreground/50">&bull;</span>
                        <span className="text-[11px] text-muted-foreground/50">
                          {respostasCount} {respostasCount === 1 ? 'resposta' : 'respostas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenResponder(ent)}
                      className="border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10 gap-1.5 text-xs"
                    >
                      <UserPlus size={12} />
                      Coletar Resposta
                    </Button>
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenResponder(ent)}
                      className="text-xs text-primary hover:text-primary/80 gap-1 ml-auto"
                    >
                      <UserPlus size={12} />
                      Nova Resposta
                    </Button>
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
              <p className="text-xs text-muted-foreground/30 mt-1">
                Use o botao &quot;Coletar Resposta&quot; em um questionario para comecar.
              </p>
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

      {/* Form Dialog - Create Questionario */}
      <FormQuestionario
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveEntrevista}
        empresaId={clienteAtivo?.id ?? ''}
      />

      {/* Form Dialog - Collect Response */}
      <FormResponder
        open={responderOpen}
        onClose={() => {
          setResponderOpen(false)
          setEntrevistaParaResponder(null)
        }}
        entrevista={entrevistaParaResponder}
        onSaved={handleRespostaSaved}
      />
    </div>
  )
}
