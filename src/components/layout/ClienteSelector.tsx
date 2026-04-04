"use client"

import { useState, useRef, useEffect } from "react"
import { Users, ChevronDown, X, Search, Check, Loader2 } from "lucide-react"
import { useClienteContext, ClienteInfo } from "@/hooks/useClienteContext"
import { cn } from "@/lib/utils"

const faseBadgeConfig: Record<string, string> = {
  Diagnostico:    "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Planejamento:   "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Execucao:       "bg-green-500/10 text-green-500 border-green-500/20",
  Acompanhamento: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

export function ClienteSelector() {
  const { clienteAtivo, setClienteAtivo, isFiltered, clientes, loading } = useClienteContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus search when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(query.toLowerCase()) ||
    c.fase.toLowerCase().includes(query.toLowerCase())
  )

  function select(cliente: ClienteInfo | null) {
    setClienteAtivo(cliente)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-1.5 border text-sm font-medium transition-all outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          isFiltered
            ? "border-orange-500/60 bg-orange-500/8 text-foreground hover:bg-orange-500/12"
            : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-secondary/60"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {loading ? (
          <>
            <Loader2 className="size-3.5 animate-spin shrink-0" />
            <span className="hidden sm:block">Carregando...</span>
          </>
        ) : isFiltered && clienteAtivo ? (
          <>
            {/* Active client avatar */}
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-500 shrink-0"
            >
              {clienteAtivo.initials}
            </span>
            <span className="max-w-[120px] truncate text-foreground">
              {clienteAtivo.nome}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
            {/* Clear button */}
            <span
              role="button"
              aria-label="Limpar selecao de cliente"
              onClick={(e) => {
                e.stopPropagation()
                select(null)
              }}
              className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-muted-foreground/20 hover:bg-red-500/20 hover:text-red-500 text-muted-foreground transition-colors shrink-0"
            >
              <X className="size-2.5" />
            </span>
          </>
        ) : (
          <>
            <Users className="size-3.5 shrink-0" />
            <span className="hidden sm:block">Todos os Clientes</span>
            <ChevronDown className="size-3.5 shrink-0" />
          </>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            "absolute left-0 top-full mt-2 z-50 w-72",
            "bg-popover border border-border rounded-xl shadow-xl shadow-black/10",
            "animate-in fade-in-0 zoom-in-95 duration-100"
          )}
          role="listbox"
        >
          {/* Search input */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cliente..."
                className={cn(
                  "w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border",
                  "bg-secondary/50 text-foreground placeholder:text-muted-foreground/60",
                  "outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent transition"
                )}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5 pl-0.5">
              Ctrl+K para buscar cliente
            </p>
          </div>

          <div className="border-t border-border">
            {/* "All Clients" option */}
            <button
              onClick={() => select(null)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors hover:bg-secondary/60",
                !isFiltered ? "text-primary" : "text-muted-foreground"
              )}
              role="option"
              aria-selected={!isFiltered}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary shrink-0">
                <Users className="size-3.5 text-muted-foreground" />
              </span>
              <span className="font-medium flex-1 text-left">Todos os Clientes</span>
              {!isFiltered && <Check className="size-3.5 text-primary shrink-0" />}
            </button>

            {/* Divider */}
            <div className="mx-3 border-t border-border/60 my-0.5" />

            {/* Client list */}
            <div className="max-h-60 overflow-y-auto py-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Carregando clientes...</span>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 px-3">
                  Nenhum cliente encontrado
                </p>
              ) : (
                filtered.map((cliente) => {
                  const isActive = clienteAtivo?.id === cliente.id
                  return (
                    <button
                      key={cliente.id}
                      onClick={() => select(cliente)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors hover:bg-secondary/60",
                        isActive ? "text-primary" : "text-foreground"
                      )}
                      role="option"
                      aria-selected={isActive}
                    >
                      {/* Avatar */}
                      <span
                        className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shrink-0",
                          isActive
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {cliente.initials}
                      </span>

                      {/* Name + phase */}
                      <span className="flex flex-col gap-0.5 flex-1 text-left min-w-0">
                        <span className="font-medium text-[13px] truncate">
                          {cliente.nome}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0 rounded-full border self-start",
                            faseBadgeConfig[cliente.fase] ??
                              "bg-secondary text-muted-foreground border-border"
                          )}
                        >
                          {cliente.fase}
                        </span>
                      </span>

                      {isActive && <Check className="size-3.5 text-primary shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
