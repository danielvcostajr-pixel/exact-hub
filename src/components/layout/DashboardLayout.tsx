"use client"

import { useState } from "react"
import { SidebarContent } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { TimerWidget } from "@/components/timesheet/TimerWidget"
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

// NOTE: userRole defaults to "consultor" until auth role detection is implemented.
// When auth is ready, pass the resolved role from session/JWT here.
export function DashboardLayout({
  children,
  userRole = "consultor",
  userName = "Daniel Vieira",
  userEmail = "daniel@exactbi.com.br",
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar - fixed left */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col">
        <SidebarContent
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          className="h-full"
        />
      </aside>

      {/* Mobile sidebar - sheet overlay */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 border-border bg-card"
        >
          <SheetTitle className="sr-only">Menu de Navegacao</SheetTitle>
          <SidebarContent
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
            className="h-full"
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          userRole={userRole}
          userName={userName}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="h-full p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Floating timer widget — visible on every page when timer is running */}
      <TimerWidget />
    </div>
  )
}
