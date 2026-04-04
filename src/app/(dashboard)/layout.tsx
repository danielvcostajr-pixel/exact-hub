import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      userRole="consultor"
      userName="Daniel Vieira"
      userEmail="daniel@exactbi.com.br"
    >
      {children}
    </DashboardLayout>
  )
}
