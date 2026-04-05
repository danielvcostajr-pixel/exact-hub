"use client"

import { useState, useEffect, useCallback } from "react"
import { Building2, Plus, Search, Pencil, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { getAllEmpresasAdmin, createEmpresa, updateEmpresa } from "@/lib/api/data-service"

export default function AdminEmpresasPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("TODAS")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingEmpresa, setEditingEmpresa] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [newEmpresa, setNewEmpresa] = useState({
    razaoSocial: "", nomeFantasia: "", cnpj: "", segmento: "", porte: "",
    responsavel: "", telefone: "", email: "", cidade: "", estado: "",
  })

  const loadData = useCallback(async () => {
    try {
      const data = await getAllEmpresasAdmin()
      setEmpresas(data ?? [])
    } catch (err) {
      console.error("Erro:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = empresas.filter(e => {
    const matchSearch = (e.razaoSocial ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.nomeFantasia ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.cnpj ?? '').includes(search)
    const matchStatus = filterStatus === "TODAS" || (filterStatus === "ATIVAS" ? e.ativa : !e.ativa)
    return matchSearch && matchStatus
  })

  async function handleCreate() {
    if (!newEmpresa.razaoSocial) return
    setSaving(true)
    try {
      await createEmpresa(newEmpresa)
      setDialogOpen(false)
      setNewEmpresa({ razaoSocial: "", nomeFantasia: "", cnpj: "", segmento: "", porte: "", responsavel: "", telefone: "", email: "", cidade: "", estado: "" })
      await loadData()
    } catch (err) {
      console.error("Erro:", err)
      alert("Erro ao criar empresa.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAtiva(id: string, ativa: boolean) {
    try {
      await updateEmpresa(id, { ativa: !ativa })
      await loadData()
    } catch (err) {
      console.error("Erro:", err)
    }
  }

  async function handleSaveEdit() {
    if (!editingEmpresa) return
    setSaving(true)
    try {
      const { id, createdAt, updatedAt, ...updates } = editingEmpresa
      await updateEmpresa(editingEmpresa.id, updates)
      setEditDialogOpen(false)
      setEditingEmpresa(null)
      await loadData()
    } catch (err) {
      console.error("Erro:", err)
      alert("Erro ao salvar.")
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: "razaoSocial", label: "Razao Social *" },
    { key: "nomeFantasia", label: "Nome Fantasia" },
    { key: "cnpj", label: "CNPJ" },
    { key: "segmento", label: "Segmento" },
    { key: "porte", label: "Porte" },
    { key: "responsavel", label: "Responsavel" },
    { key: "telefone", label: "Telefone" },
    { key: "email", label: "E-mail" },
    { key: "cidade", label: "Cidade" },
    { key: "estado", label: "Estado" },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="size-6 text-purple-500" />
            Gestao de Empresas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{empresas.length} empresas cadastradas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white gap-2">
          <Plus className="size-4" /> Nova Empresa
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        {["TODAS", "ATIVAS", "INATIVAS"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${filterStatus === s ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground border-border"}`}>
            {s === "TODAS" ? "Todas" : s === "ATIVAS" ? "Ativas" : "Inativas"}
          </button>
        ))}
      </div>

      <Card className="rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Empresa</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3 hidden md:table-cell">CNPJ</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3 hidden lg:table-cell">Segmento</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3 hidden lg:table-cell">Responsavel</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{e.nomeFantasia || e.razaoSocial}</span>
                      {e.nomeFantasia && <span className="text-[11px] text-muted-foreground">{e.razaoSocial}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{e.cnpj || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{e.segmento || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{e.responsavel || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${e.ativa ? 'bg-green-500/15 text-green-500 border-green-500/30' : 'bg-red-500/15 text-red-500 border-red-500/30'}`}>
                      {e.ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingEmpresa({ ...e }); setEditDialogOpen(true) }}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => handleToggleAtiva(e.id, e.ativa)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        {e.ativa ? <ToggleRight className="size-4 text-green-500" /> : <ToggleLeft className="size-4 text-red-500" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma empresa encontrada</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            {fields.map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  value={(newEmpresa as Record<string, string>)[f.key] ?? ''}
                  onChange={e => setNewEmpresa(p => ({ ...p, [f.key]: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !newEmpresa.razaoSocial} className="bg-primary text-white">
              {saving ? "Criando..." : "Criar Empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Empresa</DialogTitle></DialogHeader>
          {editingEmpresa && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
              {fields.map(f => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={editingEmpresa[f.key] ?? ''}
                    onChange={e => setEditingEmpresa((p: typeof editingEmpresa) => ({ ...p, [f.key]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
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
