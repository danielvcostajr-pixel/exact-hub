'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Target, ArrowLeft } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { getOKRsByEmpresa } from '@/lib/api/data-service'
import { Button } from '@/components/ui/button'
import { OKRCard, type OKR, type OKRStatus } from '@/components/planejamento/OKRCard'
import { FormOKR, type OKRFormData } from '@/components/planejamento/FormOKR'

function gerarId() {
  return Math.random().toString(36).substring(2, 10)
}

const STATUS_ORDER: OKRStatus[] = ['Ativo', 'Rascunho', 'Concluido', 'Cancelado']

export default function OKRsPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [okrs, setOkrs] = useState<OKR[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clienteAtivo) {
      setLoading(true)
      getOKRsByEmpresa(clienteAtivo.id)
        .then((data) => setOkrs(data as unknown as OKR[]))
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

  function handleUpdateKR(okrId: string, krId: string, novoValor: number) {
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
  }

  function handleSaveOKR(data: OKRFormData) {
    const RESPONSAVEIS: Record<string, string> = {
      'usr-1': 'Ana Beatriz Costa',
      'usr-2': 'Carlos Eduardo Lima',
      'usr-3': 'Fernanda Oliveira',
      'usr-4': 'Rodrigo Mendes',
      'usr-5': 'Patricia Sousa',
    }
    const novoOKR: OKR = {
      id: gerarId(),
      objetivo: data.objetivo,
      descricao: data.descricao,
      status: 'Rascunho',
      prazoInicio: data.prazoInicio,
      prazoFim: data.prazoFim,
      responsavelId: data.responsavelId,
      responsavelNome: RESPONSAVEIS[data.responsavelId] ?? 'Responsavel',
      keyResults: data.keyResults.map((kr) => ({
        ...kr,
        valorAtual: kr.metaInicial,
        responsavelNome: RESPONSAVEIS[kr.responsavelId] ?? 'Responsavel',
      })),
    }
    setOkrs((prev) => [novoOKR, ...prev])
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Client */}
      <div className="flex items-center gap-3">
        <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        {clienteAtivo && (
          <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>
        )}
      </div>
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
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shrink-0"
        >
          <Plus size={16} />
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
          <OKRCard key={okr.id} okr={okr} onUpdateKRValor={handleUpdateKR} />
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
