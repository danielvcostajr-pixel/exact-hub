'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  Pencil,
  Trash2,
  Send,
  Bot,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Flag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createTarefa, getCurrentUserId, getUsuariosByEmpresa } from '@/lib/api/data-service'

// ── Types ────────────────────────────────────────────────────────────────────

interface TarefaExtraida {
  id: string
  titulo: string
  descricao: string
  responsavel: string | null
  responsavelId: string | null
  prazo: string | null
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
  categoria: string
  aprovada: boolean
  criada: boolean
  editando: boolean
}

interface AtaReuniao {
  resumo: string
  pauta: string[]
  decisoes: string[]
  tarefas: TarefaExtraida[]
  proximosPassos: string[]
}

interface UsuarioOption {
  id: string
  nome: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  type: 'text' | 'file' | 'ata' | 'status'
  fileName?: string
  ata?: AtaReuniao
}

interface AgentAcompanhamentoProps {
  empresaId: string
  empresaNome: string
  onBack: () => void
}

const PRIORIDADE_COLORS: Record<string, string> = {
  BAIXA: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  MEDIA: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  ALTA: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
  URGENTE: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}

const PRIORIDADE_OPTIONS = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as const

let msgCounter = 0
function genId() {
  return `msg-${Date.now()}-${++msgCounter}`
}

export function AgentAcompanhamento({ empresaId, empresaNome, onBack }: AgentAcompanhamentoProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: genId(),
      role: 'agent',
      content:
        `Ola! Sou o Agente de Acompanhamento e Execucao.\n\nEnvie a **transcricao de uma reuniao** (arquivo PDF, DOCX, TXT, CSV ou cole o texto diretamente) e eu vou:\n\n1. Identificar todas as atividades e tarefas\n2. Estruturar com responsavel, prazo e prioridade\n3. Aguardar sua aprovacao antes de criar as tarefas\n\nVoce pode editar qualquer campo antes de aprovar.`,
      type: 'text',
    },
  ])
  const [textInput, setTextInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([])
  const [usuariosLoaded, setUsuariosLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load users for the empresa (lazy)
  const loadUsuarios = useCallback(async () => {
    if (usuariosLoaded) return
    try {
      const data = await getUsuariosByEmpresa(empresaId)
      setUsuarios((data ?? []).map((u) => ({ id: u.id, nome: u.nome })))
      setUsuariosLoaded(true)
    } catch { /* ignore */ }
  }, [empresaId, usuariosLoaded])

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  // ── Convert file to base64 ───────────────────────────────────────────────

  async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  // ── Process transcription (text or file) ────────────────────────────────

  async function processTranscricao(input: { text: string } | { file: File }) {
    setProcessing(true)
    await loadUsuarios()

    const isFile = 'file' in input
    const fileName = isFile ? input.file.name : undefined

    // Add user message
    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: isFile ? `Arquivo enviado: ${input.file.name}` : input.text.slice(0, 200) + (input.text.length > 200 ? '...' : ''),
      type: isFile ? 'file' : 'text',
      fileName,
    }
    setMessages((prev) => [...prev, userMsg])
    scrollToBottom()

    // Add processing message
    const processingMsg: ChatMessage = {
      id: genId(),
      role: 'agent',
      content: isFile
        ? 'Extraindo texto do arquivo e identificando tarefas...'
        : 'Analisando a transcricao e identificando tarefas...',
      type: 'status',
    }
    setMessages((prev) => [...prev, processingMsg])
    scrollToBottom()

    try {
      let body: Record<string, string>
      if (isFile) {
        const base64 = await fileToBase64(input.file)
        body = { fileBase64: base64, fileName: input.file.name }
      } else {
        body = { transcricao: input.text }
      }

      const res = await fetch('/api/agent/analise-reuniao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(err.error || 'Erro ao processar')
      }

      const result = await res.json()
      const tarefas: TarefaExtraida[] = (result.tarefas || []).map(
        (t: { titulo: string; descricao: string; responsavel: string | null; prazo: string | null; prioridade: string; categoria?: string }, i: number) => ({
          id: `tarefa-${Date.now()}-${i}`,
          titulo: t.titulo,
          descricao: t.descricao || '',
          responsavel: t.responsavel,
          responsavelId: null,
          prazo: t.prazo,
          prioridade: (['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'].includes(t.prioridade) ? t.prioridade : 'MEDIA') as TarefaExtraida['prioridade'],
          categoria: t.categoria || 'Geral',
          aprovada: false,
          criada: false,
          editando: false,
        })
      )

      const ata: AtaReuniao = {
        resumo: result.resumo || 'Analise concluida.',
        pauta: result.pauta || [],
        decisoes: result.decisoes || [],
        tarefas,
        proximosPassos: result.proximosPassos || [],
      }

      // Remove processing message, add result
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== processingMsg.id)
        return [
          ...filtered,
          {
            id: genId(),
            role: 'agent' as const,
            content: ata.resumo,
            type: 'ata' as const,
            ata,
          },
        ]
      })
    } catch (err) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== processingMsg.id)
        return [
          ...filtered,
          {
            id: genId(),
            role: 'agent' as const,
            content: `Erro ao processar: ${err instanceof Error ? err.message : 'Erro desconhecido'}. Tente novamente.`,
            type: 'text' as const,
          },
        ]
      })
    } finally {
      setProcessing(false)
      scrollToBottom()
    }
  }

  // ── File upload handler ──────────────────────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await processTranscricao({ file })
  }

  // ── Text send ────────────────────────────────────────────────────────────

  async function handleSend() {
    if (!textInput.trim() || processing) return
    const text = textInput.trim()
    setTextInput('')
    await processTranscricao({ text })
  }

  // ── Task editing helpers ─────────────────────────────────────────────────

  function updateTarefa(msgId: string, tarefaId: string, updates: Partial<TarefaExtraida>) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.ata) return m
        return {
          ...m,
          ata: { ...m.ata, tarefas: m.ata.tarefas.map((t) => (t.id === tarefaId ? { ...t, ...updates } : t)) },
        }
      })
    )
  }

  function removeTarefa(msgId: string, tarefaId: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.ata) return m
        return { ...m, ata: { ...m.ata, tarefas: m.ata.tarefas.filter((t) => t.id !== tarefaId) } }
      })
    )
  }

  // ── Approve & create tasks ───────────────────────────────────────────────

  async function handleAprovarTarefa(msgId: string, tarefa: TarefaExtraida) {
    const userId = await getCurrentUserId()
    if (!userId) return

    try {
      await createTarefa({
        empresaId,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || undefined,
        prioridade: tarefa.prioridade,
        prazo: tarefa.prazo || undefined,
        responsavelId: tarefa.responsavelId || undefined,
        criadoPorId: userId,
        status: 'A_FAZER',
      })
      updateTarefa(msgId, tarefa.id, { aprovada: true, criada: true, editando: false })
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
    }
  }

  async function handleAprovarTodas(msgId: string) {
    const msg = messages.find((m) => m.id === msgId)
    if (!msg?.ata?.tarefas) return
    const pendentes = msg.ata.tarefas.filter((t) => !t.criada)
    for (const tarefa of pendentes) {
      await handleAprovarTarefa(msgId, tarefa)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Bot className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Agente de Acompanhamento</h2>
            <p className="text-[11px] text-muted-foreground">{empresaNome}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'agent' && msg.type === 'status' && (
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 rounded-xl text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  {msg.content}
                </div>
              )}

              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div className="bg-primary/15 border border-primary/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                    {msg.type === 'file' && (
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="size-4 text-primary" />
                        <span className="text-xs font-medium text-primary">{msg.fileName}</span>
                      </div>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              )}

              {msg.role === 'agent' && msg.type === 'text' && (
                <div className="flex gap-2.5">
                  <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-4 text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              )}

              {msg.role === 'agent' && msg.type === 'ata' && msg.ata && (
                <div className="flex gap-2.5">
                  <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Resumo */}
                    <div className="bg-card border border-border rounded-xl px-4 py-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Resumo da Reuniao</h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{msg.ata.resumo}</p>
                    </div>

                    {/* Pauta */}
                    {msg.ata.pauta.length > 0 && (
                      <div className="bg-card border border-border rounded-xl px-4 py-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Pauta Discutida</h4>
                        <ul className="space-y-1">
                          {msg.ata.pauta.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex gap-2">
                              <span className="text-muted-foreground shrink-0">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Decisoes */}
                    {msg.ata.decisoes.length > 0 && (
                      <div className="bg-card border border-border rounded-xl px-4 py-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Decisoes Tomadas</h4>
                        <ul className="space-y-1">
                          {msg.ata.decisoes.map((d, i) => (
                            <li key={i} className="text-sm text-foreground flex gap-2">
                              <CheckCircle className="size-3.5 text-green-500 shrink-0 mt-0.5" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tarefas por categoria */}
                    {msg.ata.tarefas.length > 0 && (
                      <div className="bg-card border border-border rounded-xl px-4 py-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          Atividades Identificadas ({msg.ata.tarefas.length})
                        </h4>
                        <p className="text-[11px] text-muted-foreground mb-3">
                          Revise, edite e aprove as tarefas antes de criar na plataforma.
                        </p>
                      </div>
                    )}

                    {/* Group tasks by category */}
                    {(() => {
                      const categories = new Map<string, TarefaExtraida[]>()
                      for (const t of msg.ata.tarefas) {
                        const cat = t.categoria || 'Geral'
                        if (!categories.has(cat)) categories.set(cat, [])
                        categories.get(cat)!.push(t)
                      }
                      return Array.from(categories.entries()).map(([cat, tarefas]) => (
                        <div key={cat} className="space-y-2">
                          {categories.size > 1 && (
                            <h5 className="text-xs font-semibold text-primary uppercase tracking-wide px-1">{cat}</h5>
                          )}
                          {tarefas.map((tarefa) => (
                            <TarefaCard
                              key={tarefa.id}
                              tarefa={tarefa}
                              usuarios={usuarios}
                              msgId={msg.id}
                              onUpdate={updateTarefa}
                              onRemove={removeTarefa}
                              onAprovar={handleAprovarTarefa}
                            />
                          ))}
                        </div>
                      ))
                    })()}

                    {/* Proximos passos */}
                    {msg.ata.proximosPassos.length > 0 && (
                      <div className="bg-card border border-border rounded-xl px-4 py-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Proximos Passos</h4>
                        <ul className="space-y-1">
                          {msg.ata.proximosPassos.map((p, i) => (
                            <li key={i} className="text-sm text-foreground flex gap-2">
                              <span className="text-primary shrink-0">→</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Approve all button */}
                    {msg.ata.tarefas.some((t) => !t.criada) && (
                      <Button
                        onClick={() => handleAprovarTodas(msg.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="size-4 mr-2" />
                        Aprovar Todas ({msg.ata.tarefas.filter((t) => !t.criada).length} pendentes)
                      </Button>
                    )}

                    {msg.ata.tarefas.length > 0 && msg.ata.tarefas.every((t) => t.criada) && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400">
                        <CheckCircle className="size-4" />
                        Todas as tarefas foram criadas com sucesso!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="shrink-0 p-4 border-t border-border bg-card">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.md"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 size-9 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            title="Enviar arquivo (PDF, DOCX, TXT, CSV)"
          >
            <Upload className="size-4" />
          </Button>
          <Textarea
            placeholder="Cole a transcricao da reuniao aqui..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="min-h-[40px] max-h-[120px] resize-none text-sm bg-background"
            rows={1}
            disabled={processing}
          />
          <Button
            onClick={handleSend}
            disabled={!textInput.trim() || processing}
            size="icon"
            className="shrink-0 size-9 bg-primary hover:bg-primary/90"
          >
            {processing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Envie um arquivo ou cole o texto da transcricao | Enter para enviar
        </p>
      </div>
    </div>
  )
}

// ── TarefaCard component ───────────────────────────────────────────────────

function TarefaCard({
  tarefa,
  usuarios,
  msgId,
  onUpdate,
  onRemove,
  onAprovar,
}: {
  tarefa: TarefaExtraida
  usuarios: UsuarioOption[]
  msgId: string
  onUpdate: (msgId: string, tarefaId: string, updates: Partial<TarefaExtraida>) => void
  onRemove: (msgId: string, tarefaId: string) => void
  onAprovar: (msgId: string, tarefa: TarefaExtraida) => Promise<void>
}) {
  const [criando, setCriando] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleAprovar() {
    setCriando(true)
    await onAprovar(msgId, tarefa)
    setCriando(false)
  }

  if (tarefa.criada) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
        <CheckCircle className="size-4 text-green-600 dark:text-green-400 shrink-0" />
        <span className="text-green-700 dark:text-green-400 truncate">{tarefa.titulo}</span>
        <span className="text-[10px] text-green-600/70 dark:text-green-500/70 ml-auto shrink-0">Criada</span>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/30">
        <button onClick={() => setExpanded((p) => !p)} className="flex-1 flex items-center gap-2 text-left min-w-0">
          {expanded ? <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />}
          <span className="text-sm font-medium text-foreground truncate">{tarefa.titulo}</span>
        </button>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORIDADE_COLORS[tarefa.prioridade]}`}>
          {tarefa.prioridade}
        </span>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => onUpdate(msgId, tarefa.id, { editando: !tarefa.editando })}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => onRemove(msgId, tarefa.id)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Expandable details / edit form */}
      {(expanded || tarefa.editando) && (
        <div className="px-3 py-3 space-y-2.5 border-t border-border">
          {tarefa.editando ? (
            <>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium">Titulo</label>
                <Input
                  value={tarefa.titulo}
                  onChange={(e) => onUpdate(msgId, tarefa.id, { titulo: e.target.value })}
                  className="h-8 text-sm mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium">Descricao</label>
                <Textarea
                  value={tarefa.descricao}
                  onChange={(e) => onUpdate(msgId, tarefa.id, { descricao: e.target.value })}
                  className="min-h-[60px] text-sm mt-0.5"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">Responsavel</label>
                  <select
                    value={tarefa.responsavelId || ''}
                    onChange={(e) => {
                      const u = usuarios.find((u) => u.id === e.target.value)
                      onUpdate(msgId, tarefa.id, {
                        responsavelId: e.target.value || null,
                        responsavel: u?.nome || tarefa.responsavel,
                      })
                    }}
                    className="w-full h-8 text-sm border border-input rounded-md bg-background px-2 mt-0.5"
                  >
                    <option value="">
                      {tarefa.responsavel ? `${tarefa.responsavel} (nao vinculado)` : 'Selecionar...'}
                    </option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">Prazo</label>
                  <Input
                    type="date"
                    value={tarefa.prazo || ''}
                    onChange={(e) => onUpdate(msgId, tarefa.id, { prazo: e.target.value || null })}
                    className="h-8 text-sm mt-0.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium">Prioridade</label>
                <div className="flex gap-1.5 mt-0.5">
                  {PRIORIDADE_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => onUpdate(msgId, tarefa.id, { prioridade: p })}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                        tarefa.prioridade === p
                          ? PRIORIDADE_COLORS[p] + ' ring-2 ring-offset-1 ring-primary/30'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              {tarefa.descricao && (
                <p className="text-xs text-muted-foreground">{tarefa.descricao}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {tarefa.responsavel && (
                  <span className="flex items-center gap-1">
                    <User className="size-3" /> {tarefa.responsavel}
                  </span>
                )}
                {tarefa.prazo && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" /> {new Date(tarefa.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Flag className="size-3" /> {tarefa.prioridade}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approve button */}
      <div className="flex gap-2 px-3 py-2 border-t border-border bg-secondary/20">
        <Button
          onClick={handleAprovar}
          disabled={criando}
          size="sm"
          className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
        >
          {criando ? (
            <Loader2 className="size-3 animate-spin mr-1" />
          ) : (
            <CheckCircle className="size-3 mr-1" />
          )}
          Aprovar e Criar Tarefa
        </Button>
      </div>
    </div>
  )
}
