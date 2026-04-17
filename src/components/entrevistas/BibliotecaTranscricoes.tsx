'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Upload, FileText, Loader2, Sparkles, AlertCircle, Trash2, MessageSquare,
  Plus, Check, Send, X, User, Calendar, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  listarTranscricoesEntrevistas,
  criarTranscricaoEntrevista,
  deletarTranscricaoEntrevista,
  atualizarAnaliseTranscricao,
  type TranscricaoEntrevista,
} from '@/lib/api/data-service'

type AnaliseResult = {
  resumoExecutivo: string
  totalEntrevistados: number
  temperaturaEmocional: string
  convergencias: { tema: string; frequencia: number; descricao: string; citacoes: string[] }[]
  divergencias: { tema: string; visaoA: string; visaoB: string; interpretacao: string }[]
  sinaisFracos: { tema: string; descricao: string; gravidade: string; acaoInvestigativa: string }[]
  ausenciasSignificativas: string[]
  prioridades: {
    titulo: string
    categoria: string
    descricao: string
    frequencia: number
    impactoSeNaoResolver: string
    impactoSeResolver: string
    primeiroPasso: string
    investigarMais: string
  }[]
  oportunidades: {
    talentosSubutilizados: string[]
    quickWins: string[]
    forcasAPreservar: string[]
    ideiasColaboradores: string[]
  }
  alertasEticos: string[]
}

export function BibliotecaTranscricoes({
  empresaId,
  nomeEmpresa,
  onChanged,
}: {
  empresaId: string
  nomeEmpresa?: string
  onChanged?: (total: number) => void
}) {
  const [transcricoes, setTranscricoes] = useState<TranscricaoEntrevista[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [analiseOpen, setAnaliseOpen] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [analiseExibida, setAnaliseExibida] = useState<AnaliseResult | null>(null)
  const [analisando, setAnalisando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    try {
      const data = await listarTranscricoesEntrevistas(empresaId)
      setTranscricoes(data)
      onChanged?.(data.length)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [empresaId, onChanged])

  useEffect(() => {
    carregar()
  }, [carregar])

  const toggleSelecao = (id: string) => {
    setSelecionadas((prev) => {
      const nxt = new Set(prev)
      if (nxt.has(id)) nxt.delete(id)
      else nxt.add(id)
      return nxt
    })
  }

  const selecionarTodas = () => {
    if (selecionadas.size === transcricoes.length) {
      setSelecionadas(new Set())
    } else {
      setSelecionadas(new Set(transcricoes.map((t) => t.id)))
    }
  }

  const deletar = async (id: string) => {
    if (!confirm('Remover esta transcrição?')) return
    try {
      await deletarTranscricaoEntrevista(id)
      setTranscricoes((prev) => {
        const novo = prev.filter((t) => t.id !== id)
        onChanged?.(novo.length)
        return novo
      })
      setSelecionadas((prev) => {
        const nxt = new Set(prev)
        nxt.delete(id)
        return nxt
      })
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  const abrirChat = () => {
    if (selecionadas.size === 0) {
      setErro('Selecione pelo menos uma transcrição para conversar.')
      return
    }
    setErro(null)
    setChatOpen(true)
  }

  const analisarSelecionadas = async () => {
    if (selecionadas.size === 0) {
      setErro('Selecione pelo menos uma transcrição para analisar.')
      return
    }
    setErro(null)
    setAnalisando(true)
    try {
      const entrevistasParaAnalise = transcricoes
        .filter((t) => selecionadas.has(t.id))
        .map((t) => ({
          respondente: t.respondente,
          cargo: t.cargo,
          area: t.area,
          texto: t.textoExtraido,
        }))

      const res = await fetch('/api/entrevistas/analisar-transcricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entrevistas: entrevistasParaAnalise,
          nomeEmpresa,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha na análise')
      setAnaliseExibida(data.analise)
      setAnaliseOpen(true)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setAnalisando(false)
    }
  }

  const entrevistasSelecionadasData = transcricoes.filter((t) => selecionadas.has(t.id))

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de ações */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Biblioteca de Entrevistas
          </h3>
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
            {transcricoes.length} entrevista{transcricoes.length !== 1 ? 's' : ''}
          </Badge>
          {selecionadas.size > 0 && (
            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
              {selecionadas.size} selecionada{selecionadas.size !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {transcricoes.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={selecionarTodas}
              className="border-border text-muted-foreground gap-1.5 text-xs"
            >
              <Check size={12} />
              {selecionadas.size === transcricoes.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={abrirChat}
            disabled={selecionadas.size === 0}
            className="border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 gap-1.5 text-xs"
          >
            <MessageSquare size={12} />
            Conversar com seleção
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={analisarSelecionadas}
            disabled={selecionadas.size === 0 || analisando}
            className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5 text-xs"
          >
            {analisando ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            Analisar seleção
          </Button>
          <Button
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs"
          >
            <Plus size={12} />
            Subir Entrevista
          </Button>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 flex items-start gap-2">
          <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Lista / empty */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={18} className="animate-spin text-primary" />
        </div>
      ) : transcricoes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <Upload size={22} className="text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Nenhuma entrevista salva</p>
          <p className="text-xs text-muted-foreground mt-1">
            Suba o PDF/DOCX de uma entrevista e ela fica na biblioteca para consulta posterior.
          </p>
          <Button
            onClick={() => setUploadOpen(true)}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white gap-1.5 mt-4"
          >
            <Plus size={13} />
            Subir Primeira Entrevista
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {transcricoes.map((t) => {
            const sel = selecionadas.has(t.id)
            return (
              <div
                key={t.id}
                className={`rounded-lg border p-3 bg-card transition-all cursor-pointer ${
                  sel
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-border hover:border-primary/40'
                }`}
                onClick={() => toggleSelecao(t.id)}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      sel ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    }`}
                  >
                    {sel && <Check size={10} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                          <User size={11} className="shrink-0" />
                          {t.respondente}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {t.cargo && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-border text-muted-foreground"
                            >
                              {t.cargo}
                            </Badge>
                          )}
                          {t.area && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-border text-muted-foreground"
                            >
                              {t.area}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletar(t.id)
                        }}
                        className="text-muted-foreground/60 hover:text-red-500 shrink-0"
                        title="Remover"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <FileText size={10} />
                        {t.nomeArquivo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span>{(t.textoExtraido.length / 1000).toFixed(1)}k chars</span>
                    </div>
                    {t.notas && (
                      <p className="text-[10px] text-muted-foreground italic mt-1 line-clamp-1">
                        {t.notas}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        empresaId={empresaId}
        onSaved={(t) => {
          setTranscricoes((prev) => {
            const novo = [t, ...prev]
            onChanged?.(novo.length)
            return novo
          })
          setUploadOpen(false)
        }}
      />

      {chatOpen && (
        <ChatDialog
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          entrevistas={entrevistasSelecionadasData}
        />
      )}

      {analiseOpen && analiseExibida && (
        <AnaliseDialog
          open={analiseOpen}
          onClose={() => setAnaliseOpen(false)}
          analise={analiseExibida}
          entrevistasIds={Array.from(selecionadas)}
        />
      )}
    </div>
  )
}

// ── Upload Dialog ────────────────────────────────────────────────────────────

function UploadDialog({
  open,
  onClose,
  empresaId,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  empresaId: string
  onSaved: (t: TranscricaoEntrevista) => void
}) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [respondente, setRespondente] = useState('')
  const [cargo, setCargo] = useState('')
  const [area, setArea] = useState('')
  const [notas, setNotas] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setArquivo(null)
      setRespondente('')
      setCargo('')
      setArea('')
      setNotas('')
      setErro(null)
    }
  }, [open])

  const salvar = async () => {
    if (!arquivo) {
      setErro('Selecione um arquivo.')
      return
    }
    if (!respondente.trim()) {
      setErro('Informe o nome do entrevistado.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      // 1) Extrair texto via API
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      const res = await fetch('/api/entrevistas/extrair-texto', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao extrair texto')

      // 2) Salvar no banco
      const salvo = await criarTranscricaoEntrevista({
        empresaId,
        respondente: respondente.trim(),
        cargo: cargo.trim() || undefined,
        area: area.trim() || undefined,
        nomeArquivo: data.nomeArquivo,
        textoExtraido: data.texto,
        notas: notas.trim() || null,
      })

      onSaved(salvo)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Upload size={16} />
            Subir Entrevista
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            O arquivo (PDF, DOCX ou TXT) será lido, o texto extraído e salvo na biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Arquivo *</Label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:bg-secondary file:text-foreground file:cursor-pointer hover:file:bg-secondary/80"
            />
            {arquivo && (
              <p className="text-[10px] text-muted-foreground/70">
                {arquivo.name} &middot; {(arquivo.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Entrevistado *</Label>
              <Input
                value={respondente}
                onChange={(e) => setRespondente(e.target.value)}
                placeholder="Nome completo"
                className="bg-background border-border text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cargo</Label>
              <Input
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Gerente"
                className="bg-background border-border text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Área</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ex: Comercial"
                className="bg-background border-border text-sm"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Contexto da entrevista, tom do entrevistado, observações..."
                className="bg-background border-border text-xs min-h-[60px]"
              />
            </div>
          </div>
        </div>

        {erro && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 flex items-start gap-2">
            <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">{erro}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            disabled={salvando}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            {salvando ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload size={13} />
                Salvar na biblioteca
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Chat Dialog ──────────────────────────────────────────────────────────────

type ChatMsg = { role: 'user' | 'assistant'; content: string }

function ChatDialog({
  open,
  onClose,
  entrevistas,
}: {
  open: boolean
  onClose: () => void
  entrevistas: TranscricaoEntrevista[]
}) {
  const [mensagens, setMensagens] = useState<ChatMsg[]>([])
  const [pergunta, setPergunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const enviar = async () => {
    if (!pergunta.trim()) return
    setErro(null)
    const perg = pergunta.trim()
    setMensagens((prev) => [...prev, { role: 'user', content: perg }])
    setPergunta('')
    setEnviando(true)

    try {
      const res = await fetch('/api/entrevistas/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entrevistas: entrevistas.map((e) => ({
            respondente: e.respondente,
            cargo: e.cargo,
            area: e.area,
            texto: e.textoExtraido,
          })),
          historico: mensagens,
          pergunta: perg,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha no chat')
      setMensagens((prev) => [...prev, { role: 'assistant', content: data.resposta }])
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] bg-card border-border flex flex-col p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <MessageSquare size={16} />
            Conversar com entrevistas
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {entrevistas.length} entrevista{entrevistas.length !== 1 ? 's' : ''}:{' '}
            {entrevistas.map((e) => e.respondente).join(', ')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {mensagens.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-10">
              <Sparkles size={22} className="text-primary/60" />
              <p className="text-sm text-muted-foreground max-w-md">
                Pergunte qualquer coisa sobre essas entrevistas. Exemplos:
              </p>
              <ul className="text-xs text-muted-foreground/80 space-y-1">
                <li>&ldquo;O que o fulano achou da liderança?&rdquo;</li>
                <li>&ldquo;Quais são os pontos em comum entre os entrevistados?&rdquo;</li>
                <li>&ldquo;Quem falou sobre processos de venda?&rdquo;</li>
                <li>&ldquo;Resuma os principais pontos de dor.&rdquo;</li>
              </ul>
            </div>
          )}

          {mensagens.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {enviando && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-lg px-4 py-2.5 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Pensando...</span>
              </div>
            </div>
          )}

          {erro && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 flex items-start gap-2">
              <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{erro}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border flex gap-2">
          <Textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!enviando) enviar()
              }
            }}
            placeholder="Pergunte sobre as entrevistas..."
            className="bg-background border-border text-sm min-h-[44px] max-h-[120px] resize-none"
          />
          <Button
            onClick={enviar}
            disabled={enviando || !pergunta.trim()}
            className="bg-primary hover:bg-primary/90 text-white self-end"
          >
            <Send size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Analise Dialog ───────────────────────────────────────────────────────────

function AnaliseDialog({
  open,
  onClose,
  analise,
  entrevistasIds,
}: {
  open: boolean
  onClose: () => void
  analise: AnaliseResult
  entrevistasIds: string[]
}) {
  // salvar análise na primeira transcrição selecionada (se única) — opcional
  useEffect(() => {
    if (entrevistasIds.length === 1) {
      atualizarAnaliseTranscricao(entrevistasIds[0], analise).catch(() => {})
    }
  }, [analise, entrevistasIds])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <BarChart3 size={16} />
            Análise Consolidada
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {analise.totalEntrevistados} entrevistas analisadas &middot;{' '}
            {analise.temperaturaEmocional}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {analise.alertasEticos?.length > 0 && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={13} className="text-red-500" />
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Alertas éticos
                </h4>
              </div>
              <ul className="list-disc pl-5 text-xs text-red-700 dark:text-red-400 space-y-1">
                {analise.alertasEticos.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <Secao titulo="Resumo Executivo">
            <p className="text-sm text-foreground whitespace-pre-line">{analise.resumoExecutivo}</p>
          </Secao>

          {analise.prioridades?.length > 0 && (
            <Secao titulo="Prioridades (Pareto 80/20)">
              <div className="space-y-2">
                {analise.prioridades.map((p, i) => (
                  <div key={i} className="rounded-md border border-border bg-background p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h5 className="text-sm font-semibold text-foreground">
                        {i + 1}. {p.titulo}
                      </h5>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                          {p.categoria}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                          {p.frequencia} menções
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.descricao}</p>
                    <div className="rounded bg-primary/5 border border-primary/20 p-2 text-[11px]">
                      <span className="font-semibold text-primary">Primeiro passo: </span>
                      <span className="text-foreground">{p.primeiroPasso}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Secao>
          )}

          {analise.convergencias?.length > 0 && (
            <Secao titulo="Convergências">
              <div className="space-y-2">
                {analise.convergencias.map((c, i) => (
                  <div key={i} className="rounded-md border border-border bg-background p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-sm font-semibold text-foreground">{c.tema}</h5>
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                        {c.frequencia} menções
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{c.descricao}</p>
                    {c.citacoes?.slice(0, 2).map((cit, j) => (
                      <p key={j} className="text-[11px] text-foreground italic pl-3 border-l-2 border-primary/30 mb-0.5">
                        &ldquo;{cit}&rdquo;
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </Secao>
          )}

          {analise.divergencias?.length > 0 && (
            <Secao titulo="Divergências">
              <div className="space-y-2">
                {analise.divergencias.map((d, i) => (
                  <div key={i} className="rounded-md border border-border bg-background p-3 space-y-1.5">
                    <h5 className="text-sm font-semibold text-foreground">{d.tema}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-blue-500/5 border border-blue-500/20 p-2">
                        <p className="font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Visão A</p>
                        <p className="text-foreground">{d.visaoA}</p>
                      </div>
                      <div className="rounded bg-amber-500/5 border border-amber-500/20 p-2">
                        <p className="font-semibold text-amber-600 dark:text-amber-400 mb-0.5">Visão B</p>
                        <p className="text-foreground">{d.visaoB}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">
                      {d.interpretacao}
                    </p>
                  </div>
                ))}
              </div>
            </Secao>
          )}

          {analise.oportunidades && (
            <Secao titulo="Oportunidades">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <OpList titulo="Quick wins" items={analise.oportunidades.quickWins} />
                <OpList titulo="Forças a preservar" items={analise.oportunidades.forcasAPreservar} />
                <OpList
                  titulo="Talentos subutilizados"
                  items={analise.oportunidades.talentosSubutilizados}
                />
                <OpList
                  titulo="Ideias dos colaboradores"
                  items={analise.oportunidades.ideiasColaboradores}
                />
              </div>
            </Secao>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="gap-1.5">
            <X size={13} />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <h4 className="text-sm font-semibold text-foreground mb-2">{titulo}</h4>
      {children}
    </div>
  )
}

function OpList({ titulo, items }: { titulo: string; items?: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-foreground mb-1">{titulo}</p>
      {!items || items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/50">Nenhum identificado</p>
      ) : (
        <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-0.5">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
