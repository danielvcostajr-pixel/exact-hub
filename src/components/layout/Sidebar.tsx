"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  TrendingUp,
  Grid3x3,
  MessageSquare,
  Target,
  CheckSquare,
  Users,
  Settings,
  Zap,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export interface SidebarProps {
  userRole?: "consultor" | "cliente"
  userName?: string
  userEmail?: string
  className?: string
}

interface NavSection {
  label: string
  items: { title: string; href: string; icon: React.ElementType }[]
}

const consultorSections: NavSection[] = [
  {
    label: "Diagnostico",
    items: [
      { title: "Dashboard", href: "/consultor", icon: LayoutDashboard },
      { title: "Projecao Financeira", href: "/projecao-financeira", icon: TrendingUp },
      { title: "Canvas de Negocio", href: "/canvas-negocio", icon: Grid3x3 },
      { title: "Entrevistas", href: "/entrevistas", icon: MessageSquare },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { title: "OKRs", href: "/planejamento/okrs", icon: Target },
      { title: "Rotinas", href: "/planejamento/rotinas", icon: CheckSquare },
      { title: "Planos de Acao", href: "/planejamento/planos-acao", icon: CheckSquare },
    ],
  },
  {
    label: "Execucao",
    items: [
      { title: "Tarefas", href: "/tarefas", icon: CheckSquare },
    ],
  },
  {
    label: "Simuladores",
    items: [
      { title: "Simuladores", href: "/simuladores", icon: Target },
    ],
  },
  {
    label: "Gestao",
    items: [
      { title: "Timesheet", href: "/timesheet", icon: Clock },
    ],
  },
  {
    label: "Acompanhamento",
    items: [
      { title: "Chat", href: "/acompanhamento/chat", icon: MessageSquare },
      { title: "Reunioes", href: "/acompanhamento/reunioes", icon: Users },
      { title: "Relatorios", href: "/acompanhamento/relatorios", icon: LayoutDashboard },
    ],
  },
]

const clienteSections: NavSection[] = [
  {
    label: "Meu Projeto",
    items: [
      { title: "Dashboard", href: "/cliente", icon: LayoutDashboard },
      { title: "Projecao Financeira", href: "/projecao-financeira", icon: TrendingUp },
      { title: "Canvas de Negocio", href: "/canvas-negocio", icon: Grid3x3 },
      { title: "OKRs", href: "/planejamento/okrs", icon: Target },
      { title: "Tarefas", href: "/tarefas", icon: CheckSquare },
      { title: "Chat", href: "/acompanhamento/chat", icon: MessageSquare },
      { title: "Reunioes", href: "/acompanhamento/reunioes", icon: Users },
    ],
  },
]

export function SidebarContent({
  userRole = "consultor",
  userName = "Daniel Vieira",
  className,
}: SidebarProps) {
  const pathname = usePathname()
  const sections = userRole === "consultor" ? consultorSections : clienteSections

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-card border-r border-border",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-exact shadow-lg">
          <Zap className="size-4 text-white" />
        </div>
        <span className="text-base font-bold text-foreground tracking-tight">
          Exact{" "}
          <span className="text-primary">Hub</span>
        </span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        {sections.map((section, sIdx) => (
          <div key={section.label} className="mb-1">
            {sIdx > 0 && <Separator className="my-2" />}
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/consultor" &&
                    item.href !== "/cliente" &&
                    pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                    {isActive && (
                      <div className="ml-auto w-1 h-3.5 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Configuracoes */}
        {userRole === "consultor" && (
          <>
            <Separator className="my-2" />
            <Link
              href="/configuracoes"
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                pathname === "/configuracoes"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
              )}
            >
              <Settings className="size-4 shrink-0" />
              <span>Configuracoes</span>
            </Link>
          </>
        )}
      </ScrollArea>

      {/* User info */}
      <div className="shrink-0 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
