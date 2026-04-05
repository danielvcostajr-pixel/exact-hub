"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { Send, Paperclip, ArrowLeft, Loader2, Bot, MessageSquare } from "lucide-react"
import { useClienteContext } from "@/hooks/useClienteContext"
import { getOrCreateConversa, getMensagens, sendMensagem, getCurrentUserId } from "@/lib/api/data-service"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AgentAcompanhamento } from "@/components/chat/AgentAcompanhamento"

interface Mensagem {
  id: string
  conversaId: string
  conteudo: string
  remetenteId: string
  anexosUrls: string[] | null
  createdAt: string
  remetente: {
    id: string
    nome: string
    papel: string
  }
}

type ChatView = "list" | "chat" | "agent"

function getInitials(nome: string): string {
  return nome
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  if (isToday) return time

  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  return `${day} ${time}`
}

export default function ChatPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [view, setView] = useState<ChatView>("list")
  const [conversaId, setConversaId] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get current user id on mount
  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId)
  }, [])

  // Reset view when client changes
  useEffect(() => {
    setView("list")
    setConversaId(null)
    setMensagens([])
  }, [clienteAtivo])

  // Load conversation when switching to chat view
  useEffect(() => {
    if (view !== "chat" || !clienteAtivo) return

    let cancelled = false
    setLoading(true)

    async function init() {
      try {
        const conversa = await getOrCreateConversa(clienteAtivo!.id)
        if (cancelled) return
        setConversaId(conversa.id)

        const msgs = await getMensagens(conversa.id)
        if (cancelled) return
        setMensagens(msgs ?? [])
      } catch (err) {
        console.error("Erro ao carregar conversa:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [view, clienteAtivo])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  const loadMessages = useCallback(async () => {
    if (!conversaId) return
    try {
      const msgs = await getMensagens(conversaId)
      setMensagens(msgs ?? [])
    } catch (err) {
      console.error("Erro ao recarregar mensagens:", err)
    }
  }, [conversaId])

  const handleSend = async () => {
    if (!messageInput.trim() || !conversaId || !currentUserId) return

    const conteudo = messageInput.trim()
    setMessageInput("")
    setSending(true)

    try {
      await sendMensagem({
        conversaId,
        conteudo,
        remetenteId: currentUserId,
      })
      await loadMessages()
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err)
      setMessageInput(conteudo)
    } finally {
      setSending(false)
    }
  }

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  // ── Agent view ─────────────────────────────────────────────────────────

  if (view === "agent" && clienteAtivo) {
    return (
      <AgentAcompanhamento
        empresaId={clienteAtivo.id}
        empresaNome={clienteAtivo.nome}
        onBack={() => setView("list")}
      />
    )
  }

  // ── Chat view ──────────────────────────────────────────────────────────

  if (view === "chat") {
    if (loading) {
      return (
        <div className="flex flex-col h-full bg-background">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
              Voltar
            </button>
            {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
          </div>
          <div className="flex flex-col items-center justify-center py-16 gap-4 flex-1">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando conversa...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </button>
          {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {mensagens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <Send size={24} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma mensagem ainda</h3>
                  <p className="text-sm text-muted-foreground max-w-md">Envie a primeira mensagem para iniciar a conversa.</p>
                </div>
              </div>
            ) : (
              mensagens.map((msg) => {
                const isOwn = msg.remetenteId === currentUserId
                const senderName = msg.remetente?.nome ?? "Desconhecido"
                const senderInitials = getInitials(senderName)

                return (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}
                  >
                    {!isOwn && (
                      <Avatar className="size-7 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                          {senderInitials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                      {!isOwn && (
                        <span className="text-xs text-muted-foreground px-1">{senderName}</span>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          isOwn
                            ? "bg-primary/15 text-foreground rounded-tr-sm border border-primary/20"
                            : "bg-card text-foreground rounded-tl-sm border border-border"
                        )}
                      >
                        {msg.conteudo}
                      </div>
                      <span className="text-[11px] text-muted-foreground px-1">
                        {formatTimestamp(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="shrink-0 p-4 border-t border-border bg-card">
          <div className="flex gap-2 items-end max-w-3xl mx-auto">
            <Button variant="ghost" size="icon" className="shrink-0 size-9 text-muted-foreground hover:text-foreground">
              <Paperclip className="size-4" />
            </Button>
            <Textarea
              placeholder="Digite uma mensagem..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="min-h-[40px] max-h-[120px] resize-none text-sm bg-background"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!messageInput.trim() || sending}
              size="icon"
              className="shrink-0 size-9 bg-primary hover:bg-primary/90"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>
    )
  }

  // ── List view (conversation list with pinned agent) ────────────────────

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome} — Chat</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-4 px-4 space-y-2">
          {/* Pinned Agent - Always at top */}
          <button
            onClick={() => setView("agent")}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
          >
            <div className="size-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
              <Bot className="size-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Agente de Acompanhamento</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">FIXO</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Envie transcricoes de reunioes para extrair e criar tarefas automaticamente
              </p>
            </div>
            <ArrowLeft className="size-4 text-muted-foreground rotate-180 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Regular chat conversation */}
          <button
            onClick={() => setView("chat")}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors text-left group"
          >
            <div className="size-11 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <MessageSquare className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Chat com {clienteAtivo?.nome || 'Cliente'}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conversa direta com o cliente
              </p>
            </div>
            <ArrowLeft className="size-4 text-muted-foreground rotate-180 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  )
}
