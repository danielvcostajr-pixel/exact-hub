"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Building2, Shield, UserCheck, UserX, TrendingUp, ArrowUpRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSystemStats, getAllUsuarios, getAllEmpresasAdmin } from "@/lib/api/data-service"

interface Stats {
  totalUsuarios: number
  usuariosAtivos: number
  consultores: number
  clientes: number
  admins: number
  totalEmpresas: number
  empresasAtivas: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentEmpresas, setRecentEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, users, empresas] = await Promise.all([
          getSystemStats(),
          getAllUsuarios(),
          getAllEmpresasAdmin(),
        ])
        setStats(s)
        setRecentUsers((users ?? []).slice(0, 5))
        setRecentEmpresas((empresas ?? []).slice(0, 5))
      } catch (err) {
        console.error("Erro ao carregar stats:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  const papelColors: Record<string, string> = {
    ADMIN: "bg-red-500/15 text-red-500 border-red-500/30",
    CONSULTOR: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    CLIENTE: "bg-green-500/15 text-green-500 border-green-500/30",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="size-6 text-red-500" />
          Painel SuperAdmin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Visao geral do sistema Exact Hub</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Usuarios", value: stats?.totalUsuarios ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Usuarios Ativos", value: stats?.usuariosAtivos ?? 0, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Total Empresas", value: stats?.totalEmpresas ?? 0, icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Empresas Ativas", value: stats?.empresasAtivas ?? 0, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="rounded-xl">
              <CardContent className="px-4 pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</span>
                    <span className="text-3xl font-bold text-foreground">{kpi.value}</span>
                  </div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.bg} shrink-0`}>
                    <Icon className={`size-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Role distribution */}
      <Card className="rounded-xl">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-sm font-semibold">Distribuicao por Papel</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex gap-6">
            {[
              { label: "Consultores", value: stats?.consultores ?? 0, color: "text-blue-500" },
              { label: "Clientes", value: stats?.clientes ?? 0, color: "text-green-500" },
              { label: "Admins", value: stats?.admins ?? 0, color: "text-red-500" },
            ].map(r => (
              <div key={r.label} className="flex flex-col gap-1">
                <span className="text-2xl font-bold tabular-nums text-foreground">{r.value}</span>
                <span className={`text-xs font-medium ${r.color}`}>{r.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <Card className="rounded-xl">
          <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Usuarios Recentes</CardTitle>
            <Link href="/admin/usuarios" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              Ver todos <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 space-y-2">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{u.nome}</span>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${papelColors[u.papel] ?? ''}`}>
                    {u.papel}
                  </Badge>
                  {!u.ativo && <UserX className="size-3.5 text-red-500" />}
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuario</p>}
          </CardContent>
        </Card>

        {/* Recent Empresas */}
        <Card className="rounded-xl">
          <CardHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Empresas Recentes</CardTitle>
            <Link href="/admin/empresas" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              Ver todas <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 space-y-2">
            {recentEmpresas.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{e.nomeFantasia || e.razaoSocial}</span>
                  <span className="text-xs text-muted-foreground">{e.segmento ?? 'Sem segmento'}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${e.ativa ? 'bg-green-500/15 text-green-500 border-green-500/30' : 'bg-red-500/15 text-red-500 border-red-500/30'}`}>
                  {e.ativa ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            ))}
            {recentEmpresas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
