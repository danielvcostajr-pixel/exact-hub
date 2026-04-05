"use client"

import { useState, useEffect } from "react"
import { SidebarContent } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { TimerWidget } from "@/components/timesheet/TimerWidget"
import { getCurrentUser } from "@/lib/api/data-service"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: "consultor" | "cliente"
  userName?: string
  userEmail?: string
}

export function DashboardLayout({
  children,
  userRole: propRole,
  userName: propName,
  userEmail: propEmail,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userRole, setUserRole] = useState<"consultor" | "cliente">(propRole ?? "consultor")
  const [userName, setUserName] = useState(propName ?? "")
  const [userEmail, setUserEmail] = useState(propEmail ?? "")

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser()
        if (user) {
          setUserName(user.nome ?? "")
          setUserEmail(user.email ?? "")
          setUserRole(user.papel === "CLIENTE" ? "cliente" : "consultor")
        }
      } catch { /* ignore */ }
    }
    if (!propName) loadUser()
  }, [propName])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col">
        <SidebarContent
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          className="h-full"
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 border-border bg-card">
          <SheetTitle className="sr-only">Menu de Navegacao</SheetTitle>
          <SidebarContent
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
            className="h-full"
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          userRole={userRole}
          userName={userName}
        />

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="h-full p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <TimerWidget />
    </div>
  )
}
