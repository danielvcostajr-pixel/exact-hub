'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RotateCcw, Copy, Loader2, X, Trash2 } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { RotinaCard, type Rotina } from '@/components/planejamento/RotinaCard'
import { ROTINAS_TEMPLATES, type RotinaTemplate } from '@/lib/templates/rotinas'
import { getRotinasByEmpresa, createRotina, createItemControle, deleteRotina, getCurrentUserId } from '@/lib/api/data-service'

const FREQ_COLORS: Record<string, string> = {
  DIARIA: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  SEMANAL: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  QUINZENAL: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  MENSAL: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
}

const FREQ_LABELS: Record<string, string> = {
  DIARIA: 'Diaria',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
}

const CAT_COLORS: Record<string, string> = {
  Financeiro: 'bg-green-500/15 text-green-600 border-green-500/30',
  Comercial: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  Operacional: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
  RH: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
  Marketing: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
}

function gerarId() {
  return Math.random().toString(36).substring(2, 10)
}

function dbToRotina(row: Record<string, unknown>): Rotina {
  const itens = (row.ItemControle as Array<Record<string, unknown>> | undefined) ?? []
  return {
    id: row.id as string,
    nome: row.nome as string,
    descricao: (row.descricao as string) ?? '',
    categoria: (row.categoria as Rotina['categoria']) ?? 'Operacional',
    frequencia: (row.frequencia as Rotina['frequencia']) ?? 'SEMANAL',
    diaExecucao: row.hora ? `${row.hora}` : row.diaSemana != null ? `Dia ${row.diaSemana}` : row.diaMes != null ? `Dia ${row.diaMes}` : 'A definir',
    proximaExecucao: 'A definir',
    itens: itens.map((it) => ({
      id: it.id as string,
      descricao: it.descricao as string,
      obrigatorio: (it.obrigatorio as boolean) ?? false,
      tipo: (it.tipo as 'CHECK' | 'NUMERO' | 'TEXTO') ?? 'CHECK',
      dica: it.dica as string | undefined,
    })),
  }
}

export default function RotinasPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [finalizadas, setFinalizadas] = useState<Set<string>>(new Set())

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formNome, setFormNome] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formFrequencia, setFormFrequencia] = useState('SEMANAL')
  const [formCategoria, setFormCategoria] = useState('Operacional')
  const [formHora, setFormHora] = useState('')
  const [formItens, setFormItens] = useState<{ descricao: string; obrigatorio: boolean }[]>([])

  function addChecklistItem() {
    setFormItens((prev) => [...prev, { descricao: '', obrigatorio: false }])
  }

  function removeChecklistItem(index: number) {
    setFormItens((prev) => prev.filter((_, i) => i !== index))
  }

  function updateChecklistItem(index: number, field: 'descricao' | 'obrigatorio', value: string | boolean) {
    setFormItens((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }

  async function handleDeleteRotina(rotinaId: string) {
    if (!confirm('Tem certeza que deseja excluir esta rotina e todo o seu historico?')) return
    try {
      await deleteRotina(rotinaId)
      setRotinas((prev) => prev.filter((r) => r.id !== rotinaId))
    } catch (err) {
      console.error('Erro ao excluir rotina:', err)
      alert('Erro ao excluir rotina.')
    }
  }

  const loadRotinas = useCallback(async () => {
    if (!clienteAtivo) return
    setLoading(true)
    try {
      const data = await getRotinasByEmpresa(clienteAtivo.id)
      setRotinas((data ?? []).map(dbToRotina))
    } catch (err) {
      console.error('Erro ao carregar rotinas:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteAtivo])

  useEffect(() => {
    loadRotinas()
  }, [loadRotinas])

  function handleFinalizar(rotinaId: string) {
    setFinalizadas((prev) => { const next = new Set(Array.from(prev)); next.add(rotinaId); return next })
  }

  async function handleUsarTemplate(tpl: RotinaTemplate) {
    if (!clienteAtivo) return
    setSaving(true)
    try {
      const userId = await getCurrentUserId()
      if (!userId) { alert('Usuario nao autenticado'); return }

      const novaRotina = await createRotina({
        empresaId: clienteAtivo.id,
        nome: tpl.nome,
        descricao: tpl.descricao,
        frequencia: tpl.frequencia,
        categoria: tpl.categoria,
        responsavelId: userId,
      })

      // Create item controle entries
      for (let i = 0; i < tpl.itens.length; i++) {
        await createItemControle({
          rotinaId: novaRotina.id,
          descricao: tpl.itens[i].descricao,
          ordem: i + 1,
          obrigatorio: tpl.itens[i].obrigatorio,
        })
      }

      await loadRotinas()
    } catch (err) {
      console.error('Erro ao usar template:', err)
      alert('Erro ao criar rotina a partir do template.')
    } finally {
      setSaving(false)
    }
  }

  function openDialog() {
    setFormNome('')
    setFormDescricao('')
    setFormFrequencia('SEMANAL')
    setFormCategoria('Operacional')
    setFormHora('')
    setFormItens([])
    setDialogOpen(true)
  }

  async function handleCriarRotina() {
    if (!clienteAtivo || !formNome.trim()) return
    setSaving(true)
    try {
      const userId = await getCurrentUserId()
      if (!userId) { alert('Usuario nao autenticado'); return }

      const novaRotina = await createRotina({
        empresaId: clienteAtivo.id,
        nome: formNome.trim(),
        descricao: formDescricao.trim() || undefined,
        frequencia: formFrequencia,
        categoria: formCategoria,
        hora: formHora || undefined,
        responsavelId: userId,
      })

      // Create checklist items
      const itensValidos = formItens.filter((it) => it.descricao.trim())
      for (let i = 0; i < itensValidos.length; i++) {
        await createItemControle({
          rotinaId: novaRotina.id,
          descricao: itensValidos[i].descricao.trim(),
          ordem: i + 1,
          obrigatorio: itensValidos[i].obrigatorio,
        })
      }

      setDialogOpen(false)
      await loadRotinas()
    } catch (err) {
      console.error('Erro ao criar rotina:', err)
      alert('Erro ao criar rotina.')
    } finally {
      setSaving(false)
    }
  }

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw size={22} className="text-primary" />
            Rotinas e Itens de Controle
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rotinas.length} rotina{rotinas.length !== 1 ? 's' : ''} ativa{rotinas.length !== 1 ? 's' : ''} — {clienteAtivo?.nome ?? 'Cliente'}
          </p>
        </div>
        <Button
          onClick={openDialog}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shrink-0"
        >
          <Plus size={16} />
          Nova Rotina
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Carregando rotinas...</span>
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <Tabs defaultValue="minhas" className="w-full">
          <TabsList className="bg-card border border-border">
            <TabsTrigger
              value="minhas"
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground"
            >
              Minhas Rotinas
              <Badge
                variant="outline"
                className="ml-2 border-border text-muted-foreground text-[10px] px-1.5 py-0 h-4"
              >
                {rotinas.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground"
            >
              Templates
              <Badge
                variant="outline"
                className="ml-2 border-border text-muted-foreground text-[10px] px-1.5 py-0 h-4"
              >
                {ROTINAS_TEMPLATES.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Minhas Rotinas */}
          <TabsContent value="minhas" className="mt-4">
            <div className="flex flex-col gap-3">
              {rotinas.map((rotina) => (
                <div key={rotina.id} className="relative group">
                  <RotinaCard
                    rotina={rotina}
                    onFinalizar={handleFinalizar}
                  />
                  <button
                    onClick={() => handleDeleteRotina(rotina.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 hover:bg-red-500/20 text-red-500 z-10"
                    title="Excluir Rotina"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {rotinas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
                  <RotateCcw size={36} className="text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">Nenhuma rotina criada</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Crie uma rotina ou use um template
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ROTINAS_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground leading-snug">{tpl.nome}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{tpl.descricao}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[11px] border px-2 py-0 ${FREQ_COLORS[tpl.frequencia]}`}
                    >
                      {FREQ_LABELS[tpl.frequencia]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[11px] border px-2 py-0 ${CAT_COLORS[tpl.categoria]}`}
                    >
                      {tpl.categoria}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {tpl.itens.length} itens
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {tpl.itens.slice(0, 3).map((it, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-muted-foreground/50 text-xs mt-0.5">•</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{it.descricao}</span>
                        {it.obrigatorio && (
                          <span className="text-red-500 text-xs font-bold shrink-0">*</span>
                        )}
                      </div>
                    ))}
                    {tpl.itens.length > 3 && (
                      <span className="text-xs text-muted-foreground/50 ml-3">
                        + {tpl.itens.length - 3} mais...
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => handleUsarTemplate(tpl)}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-1.5 h-8 text-xs"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
                      Usar Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog Nova Rotina */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Rotina</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rotina-nome">Nome *</Label>
              <Input
                id="rotina-nome"
                placeholder="Ex: Fechamento Financeiro"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rotina-desc">Descricao</Label>
              <Textarea
                id="rotina-desc"
                placeholder="Descreva a rotina..."
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                className="resize-none h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Frequencia</Label>
                <Select value={formFrequencia} onValueChange={setFormFrequencia}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIARIA">Diaria</SelectItem>
                    <SelectItem value="SEMANAL">Semanal</SelectItem>
                    <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                    <SelectItem value="MENSAL">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Categoria</Label>
                <Select value={formCategoria} onValueChange={setFormCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rotina-hora">Horario (opcional)</Label>
              <Input
                id="rotina-hora"
                type="time"
                value={formHora}
                onChange={(e) => setFormHora(e.target.value)}
              />
            </div>

            {/* Checklist da Rotina */}
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Checklist da Rotina</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addChecklistItem}
                  className="h-7 text-xs text-primary gap-1"
                >
                  <Plus size={12} />
                  Adicionar item
                </Button>
              </div>
              {formItens.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum item adicionado. Clique em &quot;Adicionar item&quot; para incluir itens no checklist.</p>
              )}
              {formItens.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-background p-2.5">
                  <div className="flex flex-col gap-2 flex-1">
                    <Input
                      placeholder={`Item ${idx + 1} — ex: Conferir saldo bancario`}
                      value={item.descricao}
                      onChange={(e) => updateChecklistItem(idx, 'descricao', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`obrigatorio-${idx}`}
                        checked={item.obrigatorio}
                        onCheckedChange={(checked) => updateChecklistItem(idx, 'obrigatorio', !!checked)}
                      />
                      <label htmlFor={`obrigatorio-${idx}`} className="text-xs text-muted-foreground cursor-pointer">
                        Obrigatorio
                      </label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChecklistItem(idx)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0 mt-0.5"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!formNome.trim() || saving}
              onClick={handleCriarRotina}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Criar Rotina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
