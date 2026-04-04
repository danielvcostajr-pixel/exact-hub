"use client"

import { usePathname, useRouter } from "next/navigation"
import { Menu, Search, Bell, ChevronDown } from "lucide-react"
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

export function Header({ onMenuClick, userName = "Daniel Vieira" }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { clienteAtivo, isFiltered } = useClienteContext()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const baseTitle = pageTitles[pathname] ?? "Dashboard"
  const pageTitle =
    isFiltered && clienteAtivo
      ? `${baseTitle} — ${clienteAtivo.nome}`
      : baseTitle

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header className="flex h-16 items-center gap-3 px-4 md:px-6 bg-background border-b border-border shrink-0">
      {/* Hamburger - mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-foreground"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Page title */}
      <div className="flex-none">
        <h1 className="text-base font-semibold text-foreground md:text-lg leading-tight max-w-[200px] sm:max-w-xs truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Cliente Selector */}
      <div className="flex-1 flex items-center">
        <ClienteSelector />
      </div>

      {/* Search - hidden on mobile */}
      <div className="hidden md:flex items-center relative w-48 lg:w-64 shrink-0">
        <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar..."
          disabled
          className="pl-8 h-8 text-sm disabled:opacity-60"
        />
      </div>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        aria-label="Notificacoes"
      >
        <Bell className="size-4.5" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
      </Button>

      {/* User avatar dropdown */}
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
          <DropdownMenuLabel className="text-muted-foreground">
            Minha Conta
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuracoes</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500 cursor-pointer"
            onClick={handleSignOut}
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
