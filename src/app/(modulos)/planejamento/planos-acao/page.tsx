'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, ListChecks, ChevronDown, ChevronUp, Link2, Users, ArrowLeft, Loader2 } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MatrizRACI, type AcaoRaci, type UsuarioRaci } from '@/components/planejamento/MatrizRACI'
import { getPlanosAcaoByEmpresa, createPlanoAcao, createAcao, getUsuarios } from '@/lib/api/data-service'

type StatusAcao = 'Pendente' | 'Em Andamento' | 'Concluida' | 'Bloqueada'

interface Acao {
  id: string
  descricao: string
  responsavel: string
  prazo: string
  status: StatusAcao
  prioridade: 'Alta' | 'Media' | 'Baixa'
  atribuicoes: Record<string, import('@/components/planejamento/MatrizRACI').RACIValue>
}

interface PlanoAcao {
  id: string
  titulo: string
  descricao: string
  okrVinculadoId?: string
  okrVinculadoTitulo?: string
  status: 'Ativo' | 'Concluido' | 'Rascunho'
  responsavel: string
  prazoFim: string
  acoes: Acao[]
}

const STATUS_MAP: Record<string, StatusAcao> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluida',
  BLOQUEADA: 'Bloqueada',
}

const STATUS_STYLES: Record<string, string> = {
  Ativo: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  Concluido: 'bg-green-500/15 text-green-500 border-green-500/30',
  Rascunho: 'bg-secondary text-muted-foreground border-border',
}

const PRIOR_STYLES: Record<string, string> = {
  Alta: 'bg-red-500/15 text-red-500 border-red-500/30',
  Media: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  Baixa: 'bg-green-500/15 text-green-500 border-green-500/30',
}

const ACAO_STATUS_STYLES: Record<string, string> = {
  Pendente: 'bg-secondary text-muted-foreground border-border',
  'Em Andamento': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  Concluida: 'bg-green-500/15 text-green-500 border-green-500/30',
  Bloqueada: 'bg-red-500/15 text-red-500 border-red-500/30',
}

function calcProgress(acoes: Acao[]): number {
  if (acoes.length === 0) return 0
  const done = acoes.filter((a) => a.status === 'Concluida').length
  return Math.round((done / acoes.length) * 100)
}

function dbToPlano(row: Record<string, unknown>): PlanoAcao {
  const acoesRaw = (row.Acao as Array<Record<string, unknown>> | undefined) ?? []
  const acoes: Acao[] = acoesRaw.map((a) => ({
    id: a.id as string,
    descricao: a.descricao as string,
    responsavel: '',
    prazo: (a.prazo as string) ?? '',
    status: STATUS_MAP[(a.status as string) ?? 'PENDENTE'] ?? 'Pendente',
    prioridade: 'Media' as const,
    atribuicoes: {},
  }))

  const allDone = acoes.length > 0 && acoes.every((a) => a.status === 'Concluida')

  return {
    id: row.id as string,
    titulo: row.titulo as string,
    descricao: (row.descricao as string) ?? '',
    okrVinculadoId: row.okrId as string | undefined,
    status: allDone ? 'Concluido' : 'Ativo',
    responsavel: '',
    prazoFim: '',
    acoes,
  }
}

function PlanoCard({ plano, usuarios }: { plano: PlanoAcao; usuarios: UsuarioRaci[] }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'acoes' | 'raci'>('acoes')
  const progress = calcProgress(plano.acoes)
  const done = plano.acoes.filter((a) => a.status === 'Concluida').length

  const raciAcoes: AcaoRaci[] = plano.acoes.map((a) => ({
    id: a.id,
    descricao: a.descricao,
    status: a.status,
    atribuicoes: a.atribuicoes,
  }))

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left flex flex-col gap-3 p-5 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[11px] border px-2 py-0 ${STATUS_STYLES[plano.status]}`}
              >
                {plano.status}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {plano.acoes.length} acao{plano.acoes.length !== 1 ? 'oes' : ''}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {done} concluida{done !== 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{plano.titulo}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{plano.descricao}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold tabular-nums text-primary">{progress}%</span>
            {expanded ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-1.5" />

        {/* Meta */}
        <div className="flex items-center gap-4 flex-wrap">
          {plano.responsavel && (
            <span className="text-xs text-muted-foreground">
              Resp.: <span className="text-foreground">{plano.responsavel}</span>
            </span>
          )}
          {plano.prazoFim && (
            <span className="text-xs text-muted-foreground">
              Prazo: <span className="text-foreground">{plano.prazoFim}</span>
            </span>
          )}
          {plano.okrVinculadoId && (
            <span className="text-xs text-primary flex items-center gap-1">
              <Link2 size={10} />
              Vinculado a OKR
            </span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('acoes')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'acoes'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              Acoes
            </button>
            <button
              onClick={() => setActiveTab('raci')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'raci'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Users size={12} />
              Matriz RACI
            </button>
          </div>

          {/* Acoes tab */}
          {activeTab === 'acoes' && (
            <div className="flex flex-col gap-2">
              {plano.acoes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma acao registrada neste plano.</p>
              )}
              {plano.acoes.map((acao) => (
                <div
                  key={acao.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-sm text-foreground leading-snug">{acao.descricao}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {acao.responsavel && <span className="text-xs text-muted-foreground">{acao.responsavel.split(' ')[0]}</span>}
                      {acao.prazo && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{acao.prazo}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] border px-1.5 py-0 whitespace-nowrap shrink-0 ${ACAO_STATUS_STYLES[acao.status]}`}
                  >
                    {acao.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* RACI tab */}
          {activeTab === 'raci' && (
            <MatrizRACI
              acoes={raciAcoes}
              usuarios={usuarios}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function PlanosAcaoPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [planos, setPlanos] = useState<PlanoAcao[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioRaci[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formTitulo, setFormTitulo] = useState('')
  const [formDescricao, setFormDescricao] = useState('')

  const loadData = useCallback(async () => {
    if (!clienteAtivo) return
    setLoading(true)
    try {
      const [planosData, usuariosData] = await Promise.all([
        getPlanosAcaoByEmpresa(clienteAtivo.id),
        getUsuarios(),
      ])
      setPlanos((planosData ?? []).map((r: Record<string, unknown>) => dbToPlano(r)))
      setUsuarios(
        (usuariosData ?? []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          nome: u.nome as string,
          papel: (u.papel as string) ?? undefined,
        }))
      )
    } catch (err) {
      console.error('Erro ao carregar planos de acao:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteAtivo])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openDialog() {
    setFormTitulo('')
    setFormDescricao('')
    setDialogOpen(true)
  }

  async function handleCriarPlano() {
    if (!clienteAtivo || !formTitulo.trim()) return
    setSaving(true)
    try {
      await createPlanoAcao({
        empresaId: clienteAtivo.id,
        titulo: formTitulo.trim(),
        descricao: formDescricao.trim() || undefined,
      })
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error('Erro ao criar plano:', err)
      alert('Erro ao criar plano de acao.')
    } finally {
      setSaving(false)
    }
  }

  const ativos = planos.filter((p) => p.status === 'Ativo').length
  const totalAcoes = planos.reduce((s, p) => s + p.acoes.length, 0)
  const totalConcluidas = planos.reduce(
    (s, p) => s + p.acoes.filter((a) => a.status === 'Concluida').length,
    0
  )

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListChecks size={22} className="text-primary" />
            Planos de Acao
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {planos.length} plano{planos.length !== 1 ? 's' : ''} — {clienteAtivo?.nome ?? 'Cliente'}
          </p>
        </div>
        <Button
          onClick={openDialog}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shrink-0"
        >
          <Plus size={16} />
          Novo Plano
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Carregando planos...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Planos ativos', value: ativos, color: 'text-blue-500' },
              { label: 'Rascunhos', value: planos.filter((p) => p.status === 'Rascunho').length, color: 'text-muted-foreground' },
              { label: 'Total de acoes', value: totalAcoes, color: 'text-foreground' },
              { label: 'Acoes concluidas', value: totalConcluidas, color: 'text-green-500' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1"
              >
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Plans list */}
          <div className="flex flex-col gap-3">
            {planos.map((plano) => (
              <PlanoCard key={plano.id} plano={plano} usuarios={usuarios} />
            ))}
            {planos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <ListChecks size={24} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum plano de acao criado</h3>
                  <p className="text-sm text-muted-foreground max-w-md">Crie o primeiro plano de acao para este cliente.</p>
                </div>
                <Button onClick={openDialog} className="gradient-exact text-white mt-2">
                  <Plus size={16} />
                  Criar Primeiro Plano
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialog Novo Plano */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Plano de Acao</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plano-titulo">Titulo *</Label>
              <Input
                id="plano-titulo"
                placeholder="Ex: Plano de Expansao Comercial"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plano-desc">Descricao</Label>
              <Textarea
                id="plano-desc"
                placeholder="Descreva o objetivo do plano..."
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                className="resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!formTitulo.trim() || saving}
              onClick={handleCriarPlano}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
