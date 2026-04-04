"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Send, Paperclip, Search, ArrowLeft } from "lucide-react"
import { useClienteContext } from "@/hooks/useClienteContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender: string
  senderInitials: string
  timestamp: string
  isOwn: boolean
}

interface Conversation {
  id: string
  company: string
  companyInitials: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
  messages: Message[]
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    company: "Geny Eletrodomesticos",
    companyInitials: "GE",
    lastMessage: "Perfeito! Vamos revisar o plano na proxima reuniao.",
    lastMessageTime: "10:42",
    unreadCount: 3,
    isOnline: true,
    messages: [
      {
        id: "m1",
        content: "Bom dia! Recebi o relatorio da semana passada. Muito bom trabalho!",
        sender: "Roberto Ferreira",
        senderInitials: "RF",
        timestamp: "09:15",
        isOwn: false,
      },
      {
        id: "m2",
        content: "Obrigado Roberto! Ficamos felizes que gostou. Voce teve chance de analisar as metricas de conversao?",
        sender: "Daniel Vieira",
        senderInitials: "DV",
        timestamp: "09:22",
        isOwn: true,
      },
      {
        id: "m3",
        content: "Sim, olhei sim. A taxa de conversao no e-commerce subiu 2.3 pontos. Estamos no caminho certo.",
        sender: "Roberto Ferreira",
        senderInitials: "RF",
        timestamp: "09:45",
        isOwn: false,
      },
      {
        id: "m4",
        content: "Excelente! Para a proxima sprint, sugiro focarmos na otimizacao do checkout. Os dados indicam abandono na etapa de pagamento.",
        sender: "Daniel Vieira",
        senderInitials: "DV",
        timestamp: "10:10",
        isOwn: true,
      },
      {
        id: "m5",
        content: "Concordo. Ja passei isso para o time de TI. Quando podemos agendar uma reuniao para alinhar os detalhes?",
        sender: "Roberto Ferreira",
        senderInitials: "RF",
        timestamp: "10:35",
        isOwn: false,
      },
      {
        id: "m6",
        content: "Perfeito! Vamos revisar o plano na proxima reuniao.",
        sender: "Roberto Ferreira",
        senderInitials: "RF",
        timestamp: "10:42",
        isOwn: false,
      },
    ],
  },
  {
    id: "2",
    company: "TechVision Solucoes",
    companyInitials: "TV",
    lastMessage: "Precisamos remarcar para semana que vem.",
    lastMessageTime: "Ontem",
    unreadCount: 1,
    isOnline: false,
    messages: [
      {
        id: "m1",
        content: "Daniel, tudo bem? Queria confirmar a reuniao de amanha as 14h.",
        sender: "Carla Mendes",
        senderInitials: "CM",
        timestamp: "14:20",
        isOwn: false,
      },
      {
        id: "m2",
        content: "Oi Carla! Infelizmente tive um compromisso urgente. Podemos remarcar?",
        sender: "Daniel Vieira",
        senderInitials: "DV",
        timestamp: "15:05",
        isOwn: true,
      },
      {
        id: "m3",
        content: "Precisamos remarcar para semana que vem.",
        sender: "Carla Mendes",
        senderInitials: "CM",
        timestamp: "15:30",
        isOwn: false,
      },
    ],
  },
  {
    id: "3",
    company: "Nordeste Distribuidora",
    companyInitials: "ND",
    lastMessage: "Obrigado pelo suporte! O dashboard ficou otimo.",
    lastMessageTime: "Ter",
    unreadCount: 0,
    isOnline: true,
    messages: [
      {
        id: "m1",
        content: "Daniel, o novo dashboard de vendas ficou incrivel! A equipe adorou.",
        sender: "Felipe Santos",
        senderInitials: "FS",
        timestamp: "11:00",
        isOwn: false,
      },
      {
        id: "m2",
        content: "Que otimo, Felipe! Fico feliz que tenha sido util. Qualquer ajuste que precisarem, e so falar.",
        sender: "Daniel Vieira",
        senderInitials: "DV",
        timestamp: "11:15",
        isOwn: true,
      },
      {
        id: "m3",
        content: "Obrigado pelo suporte! O dashboard ficou otimo.",
        sender: "Felipe Santos",
        senderInitials: "FS",
        timestamp: "11:20",
        isOwn: false,
      },
    ],
  },
]

export default function ChatPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [conversations] = useState<Conversation[]>(mockConversations)
  const [activeConversationId, setActiveConversationId] = useState<string>("1")
  const [messageInput, setMessageInput] = useState("")
  const [search, setSearch] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConversationId])

  const handleSend = () => {
    if (!messageInput.trim()) return
    setMessageInput("")
  }

  const filtered = conversations.filter((c) =>
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
      </div>
      <div className="flex flex-1 overflow-hidden">
      {/* Conversation List */}
      <div className="w-72 shrink-0 flex flex-col border-r border-border bg-card">
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-background"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={cn(
                  "w-full text-left rounded-lg p-3 transition-colors",
                  activeConversationId === conv.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-secondary border border-transparent"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {conv.companyInitials}
                      </AvatarFallback>
                    </Avatar>
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">{conv.company}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{conv.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                      {conv.unreadCount > 0 && (
                        <Badge className="shrink-0 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
            <div className="relative">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                  {activeConversation.companyInitials}
                </AvatarFallback>
              </Avatar>
              {activeConversation.isOnline && (
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 ring-2 ring-card" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{activeConversation.company}</p>
              <p className="text-xs text-muted-foreground">
                {activeConversation.isOnline ? (
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-green-500 inline-block" />
                    Online agora
                  </span>
                ) : (
                  "Offline"
                )}
              </p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {activeConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2.5", msg.isOwn ? "flex-row-reverse" : "flex-row")}
                >
                  {!msg.isOwn && (
                    <Avatar className="size-7 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                        {msg.senderInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("flex flex-col gap-1 max-w-[70%]", msg.isOwn ? "items-end" : "items-start")}>
                    {!msg.isOwn && (
                      <span className="text-xs text-muted-foreground px-1">{msg.sender}</span>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        msg.isOwn
                          ? "bg-primary/15 text-foreground rounded-tr-sm border border-primary/20"
                          : "bg-card text-foreground rounded-tl-sm border border-border"
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[11px] text-muted-foreground px-1">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
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
                disabled={!messageInput.trim()}
                size="icon"
                className="shrink-0 size-9 bg-primary hover:bg-primary/90"
              >
                <Send className="size-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">Enter para enviar · Shift+Enter para nova linha</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Selecione uma conversa</p>
        </div>
      )}
      </div>
    </div>
  )
}
