"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { Send, Paperclip, ArrowLeft, Loader2 } from "lucide-react"
import { useClienteContext } from "@/hooks/useClienteContext"
import { getOrCreateConversa, getMensagens, sendMensagem, getCurrentUserId } from "@/lib/api/data-service"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

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

  // Load or create conversation when clienteAtivo changes
  useEffect(() => {
    if (!clienteAtivo) {
      setConversaId(null)
      setMensagens([])
      return
    }

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
  }, [clienteAtivo])

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
      setMessageInput(conteudo) // restore input on error
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

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </Link>
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
        <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Voltar
        </Link>
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
