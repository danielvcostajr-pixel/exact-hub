'use client'

import { useState, useEffect } from 'react'
import { Plus, Target, Loader2 } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { getOKRsByEmpresa, createOKR, createKeyResult, updateKeyResult, getCurrentUserId } from '@/lib/api/data-service'
import { Button } from '@/components/ui/button'
import { OKRCard, type OKR, type OKRStatus } from '@/components/planejamento/OKRCard'
import { FormOKR, type OKRFormData } from '@/components/planejamento/FormOKR'

const STATUS_ORDER: OKRStatus[] = ['Ativo', 'Rascunho', 'Concluido', 'Cancelado']

// Map Supabase status enum to display status
function mapStatus(status: string): OKRStatus {
  const map: Record<string, OKRStatus> = {
    RASCUNHO: 'Rascunho',
    ATIVO: 'Ativo',
    CONCLUIDO: 'Concluido',
    CANCELADO: 'Cancelado',
  }
  return map[status] ?? 'Rascunho'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOKRFromDB(d: any): OKR {
  return {
    id: d.id,
    objetivo: d.objetivo,
    descricao: d.descricao ?? '',
    status: mapStatus(d.status),
    prazoInicio: d.prazoInicio ? new Date(d.prazoInicio).toLocaleDateString('pt-BR') : '',
    prazoFim: d.prazoFim ? new Date(d.prazoFim).toLocaleDateString('pt-BR') : '',
    responsavelId: d.responsavelId ?? '',
    responsavelNome: d.responsavel?.nome ?? d.responsavelNome ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyResults: (d.KeyResult ?? []).map((kr: any) => ({
      id: kr.id,
      descricao: kr.descricao,
      metaInicial: kr.metaInicial ?? 0,
      metaAlvo: kr.metaAlvo ?? 100,
      valorAtual: kr.valorAtual ?? 0,
      unidade: kr.unidade ?? '%',
      responsavelId: kr.responsavelId ?? '',
      responsavelNome: kr.responsavel?.nome ?? '',
    })),
  }
}

export default function OKRsPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [okrs, setOkrs] = useState<OKR[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (clienteAtivo) {
      setLoading(true)
      getOKRsByEmpresa(clienteAtivo.id)
        .then((data) => {
          if (data) setOkrs(data.map(mapOKRFromDB))
        })
        .catch(() => setOkrs([]))
        .finally(() => setLoading(false))
    }
  }, [clienteAtivo])

  const statusCounts = okrs.reduce(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
    {} as Record<string, number>
  )
  const ativos = okrs.filter((o) => o.status === 'Ativo')
  const avgProgress =
    ativos.length > 0
      ? Math.round(
          ativos.reduce((acc, okr) => {
            const krs = okr.keyResults
            if (krs.length === 0) return acc
            const avg =
              krs.reduce((s, kr) => {
                const range = kr.metaAlvo - kr.metaInicial
                if (range === 0) return s + 100
                return s + Math.min(100, Math.max(0, ((kr.valorAtual - kr.metaInicial) / range) * 100))
              }, 0) / krs.length
            return acc + avg
          }, 0) / ativos.length
        )
      : 0

  async function handleUpdateKR(okrId: string, krId: string, novoValor: number) {
    // Update locally first
    setOkrs((prev) =>
      prev.map((okr) =>
        okr.id === okrId
          ? {
              ...okr,
              keyResults: okr.keyResults.map((kr) =>
                kr.id === krId ? { ...kr, valorAtual: novoValor } : kr
              ),
            }
          : okr
      )
    )
    // Persist to Supabase
    try {
      await updateKeyResult(krId, { valorAtual: novoValor })
    } catch (err) {
      console.error('Erro ao atualizar KR:', err)
    }
  }

  async function handleSaveOKR(data: OKRFormData) {
    if (!clienteAtivo) return
    setSaving(true)
    try {
      // Get current user id for responsavelId
      const userId = await getCurrentUserId()
      const responsavelId = data.responsavelId || userId || 'system'

      const created = await createOKR({
        empresaId: clienteAtivo.id,
        objetivo: data.objetivo,
        descricao: data.descricao,
        prazoInicio: data.prazoInicio,
        prazoFim: data.prazoFim,
        responsavelId,
        status: 'ATIVO',
      })

      // Create Key Results
      if (data.keyResults && data.keyResults.length > 0) {
        for (const kr of data.keyResults) {
          await createKeyResult({
            okrId: created.id,
            descricao: kr.descricao,
            metaInicial: kr.metaInicial,
            metaAlvo: kr.metaAlvo,
            valorAtual: kr.metaInicial,
            unidade: kr.unidade,
            responsavelId: kr.responsavelId || responsavelId,
          })
        }
      }

      // Reload from DB to get complete data
      const fresh = await getOKRsByEmpresa(clienteAtivo.id)
      if (fresh) setOkrs(fresh.map(mapOKRFromDB))
      setFormOpen(false)
    } catch (err) {
      console.error('Erro ao criar OKR:', err)
      alert('Erro ao salvar OKR. Verifique os dados e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const sortedOkrs = [...okrs].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  )

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando OKRs...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target size={22} className="text-primary" />
            OKRs — Objetivos e Resultados-Chave
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clienteAtivo?.nome ?? 'Cliente'} — {okrs.length} objetivo{okrs.length !== 1 ? 's' : ''} cadastrado{okrs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shrink-0"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Novo OKR
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ativos', value: statusCounts['Ativo'] ?? 0, color: 'text-blue-500' },
          { label: 'Rascunhos', value: statusCounts['Rascunho'] ?? 0, color: 'text-muted-foreground' },
          { label: 'Concluidos', value: statusCounts['Concluido'] ?? 0, color: 'text-green-500' },
          { label: 'Progresso medio', value: `${avgProgress}%`, color: 'text-primary', icon: true },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className={`text-2xl font-bold tabular-nums ${item.color}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* OKR List */}
      <div className="flex flex-col gap-3">
        {sortedOkrs.map((okr) => (
          <OKRCard key={okr.id} okr={okr} empresaId={clienteAtivo!.id} onUpdateKRValor={handleUpdateKR} />
        ))}
        {okrs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Target size={24} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum OKR definido</h3>
              <p className="text-sm text-muted-foreground max-w-md">Defina o primeiro objetivo para este cliente.</p>
            </div>
            <Button onClick={() => setFormOpen(true)} className="gradient-exact text-white mt-2">
              <Plus size={16} />
              Criar Primeiro OKR
            </Button>
          </div>
        )}
      </div>

      <FormOKR open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSaveOKR} />
    </div>
  )
}
