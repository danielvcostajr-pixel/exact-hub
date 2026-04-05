"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Plus, Search, UserCheck, UserX, Pencil, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllUsuarios, updateUsuario, toggleUsuarioAtivo, getAllEmpresasAdmin } from "@/lib/api/data-service"
import { createClient } from "@/lib/supabase/client"

const papelColors: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-500 border-red-500/30",
  CONSULTOR: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  CLIENTE: "bg-green-500/15 text-green-500 border-green-500/30",
}

export default function AdminUsuariosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [usuarios, setUsuarios] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterPapel, setFilterPapel] = useState("TODOS")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingUser, setEditingUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [newUser, setNewUser] = useState({ email: "", nome: "", papel: "CONSULTOR", empresaId: "" })

  const loadData = useCallback(async () => {
    try {
      const [u, e] = await Promise.all([getAllUsuarios(), getAllEmpresasAdmin()])
      setUsuarios(u ?? [])
      setEmpresas(e ?? [])
    } catch (err) {
      console.error("Erro:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = usuarios.filter(u => {
    const matchSearch = u.nome?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchPapel = filterPapel === "TODOS" || u.papel === filterPapel
    return matchSearch && matchPapel
  })

  async function handleCreateUser() {
    if (!newUser.email || !newUser.nome) return
    setSaving(true)
    try {
      const supabase = createClient()
      // Insert directly in Usuario table (auth user created on first login)
      await supabase.from('Usuario').insert({
        email: newUser.email, nome: newUser.nome,
        papel: newUser.papel, empresaId: newUser.empresaId || null, ativo: true,
      })
      setDialogOpen(false)
      setNewUser({ email: "", nome: "", papel: "CONSULTOR", empresaId: "" })
      await loadData()
    } catch (err) {
      console.error("Erro ao criar usuario:", err)
      alert("Erro ao criar usuario.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAtivo(id: string) {
    try {
      await toggleUsuarioAtivo(id)
      await loadData()
    } catch (err) {
      console.error("Erro:", err)
    }
  }

  async function handleSaveEdit() {
    if (!editingUser) return
    setSaving(true)
    try {
      await updateUsuario(editingUser.id, {
        nome: editingUser.nome,
        papel: editingUser.papel,
        empresaId: editingUser.empresaId || null,
      })
      setEditDialogOpen(false)
      setEditingUser(null)
      await loadData()
    } catch (err) {
      console.error("Erro:", err)
      alert("Erro ao salvar.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="size-6 text-blue-500" />
            Gestao de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{usuarios.length} usuarios cadastrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white gap-2">
          <Plus className="size-4" /> Novo Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        {["TODOS", "ADMIN", "CONSULTOR", "CLIENTE"].map(p => (
          <button
            key={p}
            onClick={() => setFilterPapel(p)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              filterPapel === p ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground border-border hover:border-primary/20"
            }`}
          >
            {p === "TODOS" ? "Todos" : p}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Nome</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Email</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Papel</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Empresa</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{u.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${papelColors[u.papel] ?? ''}`}>
                      {u.papel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {u.empresa?.nomeFantasia || u.empresa?.razaoSocial || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {u.ativo ? (
                      <span className="flex items-center gap-1 text-green-500 text-xs"><UserCheck className="size-3" /> Ativo</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs"><UserX className="size-3" /> Inativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingUser({ ...u }); setEditDialogOpen(true) }}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleAtivo(u.id)}
                        className={`p-1.5 rounded transition-colors ${u.ativo ? 'hover:bg-red-500/10 text-muted-foreground hover:text-red-500' : 'hover:bg-green-500/10 text-muted-foreground hover:text-green-500'}`}
                      >
                        {u.ativo ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuario encontrado</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Nome *</Label>
              <Input value={newUser.nome} onChange={e => setNewUser(p => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Papel</Label>
              <Select value={newUser.papel} onValueChange={v => setNewUser(p => ({ ...p, papel: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSULTOR">Consultor</SelectItem>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Empresa (opcional)</Label>
              <Select value={newUser.empresaId} onValueChange={v => setNewUser(p => ({ ...p, empresaId: v }))}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {empresas.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nomeFantasia || e.razaoSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={saving || !newUser.email || !newUser.nome} className="bg-primary text-white">
              {saving ? "Criando..." : "Criar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={editingUser.nome ?? ''} onChange={e => setEditingUser((p: typeof editingUser) => ({ ...p, nome: e.target.value }))} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={editingUser.email ?? ''} disabled className="h-9 opacity-60" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Papel</Label>
                <Select value={editingUser.papel} onValueChange={v => setEditingUser((p: typeof editingUser) => ({ ...p, papel: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSULTOR">Consultor</SelectItem>
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Empresa</Label>
                <Select value={editingUser.empresaId ?? 'none'} onValueChange={v => setEditingUser((p: typeof editingUser) => ({ ...p, empresaId: v === 'none' ? null : v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {empresas.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nomeFantasia || e.razaoSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-primary text-white">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
