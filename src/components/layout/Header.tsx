"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Search, Bell, ChevronDown, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ClienteSelector } from "@/components/layout/ClienteSelector"
import { useClienteContext } from "@/hooks/useClienteContext"
import { createClient } from "@/lib/supabase/client"

interface HeaderProps {
  onMenuClick: () => void
  userRole?: "consultor" | "cliente"
  userName?: string
}

const pageTitles: Record<string, string> = {
  "/consultor": "Dashboard",
  "/projecao-financeira": "Projecao Financeira",
  "/canvas-negocio": "Canvas de Negocio",
  "/entrevistas": "Entrevistas",
  "/memoria-cliente": "Memoria do Cliente",
  "/cliente": "Dashboard",
}

interface SearchResult {
  type: "tarefa" | "okr" | "empresa" | "plano"
  id: string
  title: string
  subtitle: string
  href: string
}

export function Header({ onMenuClick, userRole = "consultor", userName = "" }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const supabase = createClient()
      const q = `%${query}%`
      const results: SearchResult[] = []

      // Search tarefas
      const { data: tarefas } = await supabase.from("Tarefa").select("id, titulo, status").ilike("titulo", q).limit(5)
      tarefas?.forEach(t => results.push({ type: "tarefa", id: t.id, title: t.titulo, subtitle: t.status, href: "/tarefas" }))

      // Search OKRs
      const { data: okrs } = await supabase.from("OKR").select("id, objetivo, status").ilike("objetivo", q).limit(5)
      okrs?.forEach(o => results.push({ type: "okr", id: o.id, title: o.objetivo, subtitle: o.status, href: "/planejamento/okrs" }))

      // Search empresas
      const { data: empresas } = await supabase.from("Empresa").select("id, razaoSocial, nomeFantasia").or(`razaoSocial.ilike.${q},nomeFantasia.ilike.${q}`).limit(5)
      empresas?.forEach(e => results.push({ type: "empresa", id: e.id, title: e.nomeFantasia || e.razaoSocial, subtitle: "Empresa", href: "/consultor" }))

      // Search planos
      const { data: planos } = await supabase.from("PlanoAcao").select("id, titulo").ilike("titulo", q).limit(5)
      planos?.forEach(p => results.push({ type: "plano", id: p.id, title: p.titulo, subtitle: "Plano de Acao", href: "/planejamento/planos-acao" }))

      setSearchResults(results)
    } catch { /* ignore */ }
    finally { setSearching(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery) doSearch(searchQuery) }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, doSearch])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const baseTitle = pageTitles[pathname] ?? "Dashboard"
  const pageTitle = isFiltered && clienteAtivo ? `${baseTitle} — ${clienteAtivo.nome}` : baseTitle

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const typeLabels: Record<string, string> = { tarefa: "Tarefa", okr: "OKR", empresa: "Empresa", plano: "Plano" }
  const typeColors: Record<string, string> = {
    tarefa: "bg-blue-500/15 text-blue-500",
    okr: "bg-green-500/15 text-green-500",
    empresa: "bg-purple-500/15 text-purple-500",
    plano: "bg-orange-500/15 text-orange-500",
  }

  return (
    <header className="flex h-16 items-center gap-3 px-4 md:px-6 bg-background border-b border-border shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-foreground"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex-none">
        <h1 className="text-base font-semibold text-foreground md:text-lg leading-tight max-w-[200px] sm:max-w-xs truncate">
          {pageTitle}
        </h1>
      </div>

      <div className="flex-1 flex items-center">
        {userRole !== "cliente" && <ClienteSelector />}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center relative w-48 lg:w-64 shrink-0" ref={searchRef}>
        <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none z-10" />
        {searching && <Loader2 className="absolute right-2.5 size-3.5 text-muted-foreground animate-spin z-10" />}
        {searchQuery && !searching && (
          <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowResults(false) }} className="absolute right-2.5 z-10 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
        <Input
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }}
          onFocus={() => searchQuery && setShowResults(true)}
          className="pl-8 pr-8 h-8 text-sm"
        />
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
            {searchResults.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => { router.push(r.href); setShowResults(false); setSearchQuery("") }}
                className="w-full text-left px-3 py-2.5 hover:bg-secondary transition-colors flex items-center gap-2 border-b border-border last:border-0"
              >
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${typeColors[r.type] ?? ""}`}>
                  {typeLabels[r.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground">{r.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-50 px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">Nenhum resultado para &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>

      <ThemeToggle />

      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        aria-label="Notificacoes"
      >
        <Bell className="size-4.5" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none hover:bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-ring/50">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium text-foreground max-w-32 truncate">
            {userName}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-muted-foreground">Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/configuracoes")}>Configuracoes</DropdownMenuItem>
          {userRole === "consultor" && (
            <DropdownMenuItem onClick={() => router.push("/admin")}>Painel Admin</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer" onClick={handleSignOut}>
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
