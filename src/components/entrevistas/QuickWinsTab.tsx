'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, Plus, Loader2, Check, X, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClienteContext } from '@/hooks/useClienteContext'
import {
  getQuickWinsByEmpresa,
  updateQuickWin,
  createQuickWin,
  deleteQuickWin,
  seedQuickWinsParaEmpresa,
} from '@/lib/api/data-service'
import type { QuickWin, StatusQuickWin } from '@/types'

const STATUS_CONFIG: Record<StatusQuickWin, { label: string; color: string }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  CONCLUIDO: { label: 'Concluido', color: 'bg-green-500/15 text-green-500 border-green-500/30' },
  DESCARTADO: { label: 'Descartado', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

const QUADRANTE_COLORS: Record<string, string> = {
  'PRIORIDADE MAXIMA': 'bg-green-500/15 text-green-500 border-green-500/30',
  'Alta Prioridade': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  'Media Prioridade': 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  'Baixa Prioridade': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const CATEGORIAS = [
  'Gestao de Caixa', 'Eficiencia Operacional', 'Custos Financeiros',
  'Precificacao e Margem', 'Comercial', 'Gestao de Pessoas',
  'Gestao de Estoque', 'Gestao de Fornecedores', 'Tecnologia', 'Compliance',
]

const CAT_COLORS: Record<string, string> = {
  'Gestao de Caixa': 'bg-emerald-500/15 text-emerald-500',
  'Eficiencia Operacional': 'bg-gray-500/15 text-gray-400',
  'Custos Financeiros': 'bg-red-500/15 text-red-400',
  'Precificacao e Margem': 'bg-amber-500/15 text-amber-500',
  'Comercial': 'bg-blue-500/15 text-blue-500',
  'Gestao de Pessoas': 'bg-pink-500/15 text-pink-500',
  'Gestao de Estoque': 'bg-cyan-500/15 text-cyan-500',
  'Gestao de Fornecedores': 'bg-violet-500/15 text-violet-500',
  'Tecnologia': 'bg-indigo-500/15 text-indigo-500',
  'Compliance': 'bg-orange-500/15 text-orange-500',
}

export function QuickWinsTab() {
  const { clienteAtivo } = useClienteContext()
  const [quickWins, setQuickWins] = useState<QuickWin[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS')
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set(CATEGORIAS))
  const [showNovoForm, setShowNovoForm] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoCategoria, setNovoCategoria] = useState(CATEGORIAS[0])
  const [novoImpacto, setNovoImpacto] = useState(7)
  const [novoEsforco, setNovoEsforco] = useState(3)
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  const loadQuickWins = useCallback(async () => {
    if (!clienteAtivo) return
    setLoading(true)
    try {
      const data = await getQuickWinsByEmpresa(clienteAtivo.id)
      setQuickWins((data ?? []) as QuickWin[])
    } catch (err) {
      console.error('Erro ao carregar quick wins:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteAtivo])

  useEffect(() => {
    loadQuickWins()
  }, [loadQuickWins])

  async function handleSeed() {
    if (!clienteAtivo) return
    setSeeding(true)
    try {
      await seedQuickWinsParaEmpresa(clienteAtivo.id)
      await loadQuickWins()
    } catch (err) {
      console.error('Erro ao inicializar quick wins:', err)
      alert('Erro ao inicializar quick wins.')
    } finally {
      setSeeding(false)
    }
  }

  async function handleUpdate(id: string, updates: Record<string, unknown>) {
    try {
      const updated = await updateQuickWin(id, updates)
      setQuickWins((prev) => prev.map((qw) => (qw.id === id ? { ...qw, ...updated } : qw)))
    } catch (err) {
      console.error('Erro ao atualizar quick win:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteQuickWin(id)
      setQuickWins((prev) => prev.filter((qw) => qw.id !== id))
    } catch (err) {
      console.error('Erro ao excluir quick win:', err)
    }
  }

  async function handleCriarNovo() {
    if (!clienteAtivo || !novoTitulo.trim()) return
    setSalvandoNovo(true)
    try {
      await createQuickWin({
        empresaId: clienteAtivo.id,
        titulo: novoTitulo.trim(),
        categoria: novoCategoria,
        impacto: novoImpacto,
        esforco: novoEsforco,
      })
      setNovoTitulo('')
      setShowNovoForm(false)
      await loadQuickWins()
    } catch (err) {
      console.error('Erro ao criar quick win:', err)
    } finally {
      setSalvandoNovo(false)
    }
  }

  function toggleCategoria(cat: string) {
    setCategoriasExpandidas((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Stats
  const total = quickWins.length
  const aplicaveis = quickWins.filter((q) => q.aplicavel).length
  const concluidos = quickWins.filter((q) => q.status === 'CONCLUIDO').length
  const emAndamento = quickWins.filter((q) => q.status === 'EM_ANDAMENTO').length

  // Filtered
  const filtered = quickWins.filter((qw) => {
    if (filtroCategoria !== 'TODAS' && qw.categoria !== filtroCategoria) return false
    if (filtroStatus !== 'TODOS' && qw.status !== filtroStatus) return false
    return true
  })

  // Group by categoria
  const grouped = new Map<string, QuickWin[]>()
  for (const qw of filtered) {
    const arr = grouped.get(qw.categoria) ?? []
    arr.push(qw)
    grouped.set(qw.categoria, arr)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Carregando quick wins...</span>
      </div>
    )
  }

  // Empty state — seed template
  if (quickWins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl gap-4">
        <Zap size={40} className="text-amber-500/50" />
        <div>
          <p className="text-foreground font-medium text-lg">Checklist de Quick Wins</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Inicialize 50 quick wins pre-configurados para avaliar e aplicar durante o diagnostico deste cliente.
          </p>
        </div>
        <Button
          onClick={handleSeed}
          disabled={seeding}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
        >
          {seeding ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {seeding ? 'Inicializando...' : 'Inicializar Quick Wins'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap text-sm">
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" />
          <span className="text-muted-foreground">
            <span className="text-foreground font-semibold">{total}</span> quick wins
          </span>
        </div>
        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground">
          <span className="text-foreground font-medium">{aplicaveis}</span> aplicaveis
        </span>
        <span className="text-muted-foreground">|</span>
        <span className="text-green-500">
          <span className="font-medium">{concluidos}</span> concluidos
        </span>
        <span className="text-muted-foreground">|</span>
        <span className="text-blue-500">
          <span className="font-medium">{emAndamento}</span> em andamento
        </span>
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
        >
          <option value="TODAS">Todas categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
        >
          <option value="TODOS">Todos status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDO">Concluido</option>
          <option value="DESCARTADO">Descartado</option>
        </select>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => setShowNovoForm((p) => !p)}
            className="gap-1.5 h-8 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Plus size={12} />
            Novo Quick Win
          </Button>
        </div>
      </div>

      {/* New quick win form */}
      {showNovoForm && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-foreground">Novo Quick Win</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Titulo do quick win..."
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              className="h-8 text-sm"
            />
            <select
              value={novoCategoria}
              onChange={(e) => setNovoCategoria(e.target.value)}
              className="h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Impacto:</label>
              <select
                value={novoImpacto}
                onChange={(e) => setNovoImpacto(Number(e.target.value))}
                className="h-7 text-xs rounded border border-border bg-card px-1.5 text-foreground w-14"
              >
                {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Esforco:</label>
              <select
                value={novoEsforco}
                onChange={(e) => setNovoEsforco(Number(e.target.value))}
                className="h-7 text-xs rounded border border-border bg-card px-1.5 text-foreground w-14"
              >
                {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={() => setShowNovoForm(false)} className="h-7 text-xs">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCriarNovo}
                disabled={!novoTitulo.trim() || salvandoNovo}
                className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1"
              >
                {salvandoNovo ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grouped list */}
      {Array.from(grouped.entries()).map(([categoria, items]) => (
        <div key={categoria} className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Category header */}
          <button
            onClick={() => toggleCategoria(categoria)}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
          >
            {categoriasExpandidas.has(categoria) ? (
              <ChevronDown size={14} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={14} className="text-muted-foreground" />
            )}
            <Badge variant="outline" className={`text-[11px] border-0 px-2 py-0 ${CAT_COLORS[categoria] ?? 'bg-gray-500/15 text-gray-400'}`}>
              {categoria}
            </Badge>
            <span className="text-xs text-muted-foreground ml-1">
              {items.length} ite{items.length !== 1 ? 'ns' : 'm'}
            </span>
            <span className="text-xs text-green-500 ml-auto">
              {items.filter((i) => i.status === 'CONCLUIDO').length} concluido{items.filter((i) => i.status === 'CONCLUIDO').length !== 1 ? 's' : ''}
            </span>
          </button>

          {/* Items */}
          {categoriasExpandidas.has(categoria) && (
            <div className="border-t border-border">
              {items.map((qw) => (
                <QuickWinRow
                  key={qw.id}
                  qw={qw}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function QuickWinRow({
  qw,
  onUpdate,
  onDelete,
}: {
  qw: QuickWin
  onUpdate: (id: string, updates: Record<string, unknown>) => void
  onDelete: (id: string) => void
}) {
  const [editingObs, setEditingObs] = useState(false)
  const [obs, setObs] = useState(qw.observacoes ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusCfg = STATUS_CONFIG[qw.status]
  const quadColor = QUADRANTE_COLORS[qw.quadrante ?? ''] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  const score = qw.esforco > 0 ? (qw.impacto / qw.esforco).toFixed(1) : '0'

  return (
    <div
      className={`px-4 py-2.5 border-b border-border last:border-b-0 flex flex-col gap-2 transition-colors ${
        !qw.aplicavel ? 'opacity-40' : ''
      } ${qw.status === 'CONCLUIDO' ? 'bg-green-500/5' : qw.status === 'DESCARTADO' ? 'bg-red-500/5' : ''}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Aplicavel toggle */}
        <button
          onClick={() => onUpdate(qw.id, { aplicavel: !qw.aplicavel })}
          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            qw.aplicavel ? 'bg-amber-500 border-amber-500' : 'border-border bg-card'
          }`}
        >
          {qw.aplicavel && <Check size={10} className="text-white" />}
        </button>

        {/* Title */}
        <span className={`text-sm flex-1 min-w-0 ${qw.status === 'CONCLUIDO' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {qw.titulo}
        </span>

        {/* Score */}
        <span className="text-[10px] text-muted-foreground shrink-0" title="Score (Impacto / Esforco)">
          {score}x
        </span>

        {/* Impacto */}
        <div className="flex items-center gap-1 shrink-0" title={`Impacto: ${qw.impacto}`}>
          <span className="text-[10px] text-muted-foreground">I:</span>
          <select
            value={qw.impacto}
            onChange={(e) => onUpdate(qw.id, { impacto: Number(e.target.value) })}
            className="h-6 w-12 text-[11px] rounded border border-border bg-card px-1 text-foreground"
          >
            {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Esforco */}
        <div className="flex items-center gap-1 shrink-0" title={`Esforco: ${qw.esforco}`}>
          <span className="text-[10px] text-muted-foreground">E:</span>
          <select
            value={qw.esforco}
            onChange={(e) => onUpdate(qw.id, { esforco: Number(e.target.value) })}
            className="h-6 w-12 text-[11px] rounded border border-border bg-card px-1 text-foreground"
          >
            {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Quadrante */}
        <Badge variant="outline" className={`text-[10px] border px-1.5 py-0 shrink-0 ${quadColor}`}>
          {qw.quadrante ?? 'N/A'}
        </Badge>

        {/* Status */}
        <select
          value={qw.status}
          onChange={(e) => onUpdate(qw.id, { status: e.target.value })}
          className={`h-6 text-[11px] rounded border px-1.5 shrink-0 ${statusCfg.color}`}
        >
          <option value="PENDENTE">Pendente</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDO">Concluido</option>
          <option value="DESCARTADO">Descartado</option>
        </select>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="destructive" onClick={() => onDelete(qw.id)} className="h-5 text-[10px] px-1.5">
              Sim
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} className="h-5 text-[10px] px-1.5">
              Nao
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Responsavel + Prazo + Obs row */}
      {qw.aplicavel && qw.status !== 'DESCARTADO' && (
        <div className="flex items-center gap-3 ml-7 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Resp:</span>
            <input
              type="text"
              defaultValue={qw.responsavel ?? ''}
              placeholder="—"
              onBlur={(e) => {
                const val = e.target.value.trim()
                if (val !== (qw.responsavel ?? '')) onUpdate(qw.id, { responsavel: val || null })
              }}
              className="h-5 text-[11px] rounded border border-border bg-card px-1.5 text-foreground w-28"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Prazo:</span>
            <input
              type="date"
              defaultValue={qw.prazo ? qw.prazo.split('T')[0] : ''}
              onChange={(e) => onUpdate(qw.id, { prazo: e.target.value || null })}
              className="h-5 text-[11px] rounded border border-border bg-card px-1 text-foreground"
            />
          </div>
          <button
            onClick={() => setEditingObs(!editingObs)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {editingObs ? 'fechar obs' : qw.observacoes ? 'ver obs' : '+ obs'}
          </button>
        </div>
      )}

      {/* Observacoes */}
      {editingObs && (
        <div className="ml-7">
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            onBlur={() => {
              if (obs !== (qw.observacoes ?? '')) onUpdate(qw.id, { observacoes: obs || null })
            }}
            placeholder="Observacoes..."
            className="w-full h-14 text-xs rounded-md border border-border bg-card px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
      )}
    </div>
  )
}
