"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Calendar, FileText, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

const subNavItems = [
  { title: "Chat", href: "/acompanhamento/chat", icon: MessageSquare },
  { title: "Reunioes", href: "/acompanhamento/reunioes", icon: Calendar },
  { title: "Relatorios Semanais", href: "/acompanhamento/relatorios", icon: FileText },
  { title: "Fechamento Mensal", href: "/acompanhamento/fechamento", icon: BarChart2 },
]

export default function AcompanhamentoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-0 -m-4 md:-m-6 lg:-m-8">
        {/* Sub-navigation */}
        <div className="shrink-0 bg-card border-b border-border px-4 md:px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {subNavItems.map((item) => (
              <SubNavLink key={item.href} {...item} />
            ))}
          </nav>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </DashboardLayout>
  )
}

function SubNavLink({ title, href, icon: Icon }: { title: string; href: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      <Icon className="size-4" />
      {title}
    </Link>
  )
}
