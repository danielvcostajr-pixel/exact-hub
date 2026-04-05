'use client'

import { useState, useEffect } from 'react'
import { History, Trash2, ChevronDown, ChevronUp, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSimuladorHistorico, deleteSimulacao } from '@/lib/api/data-service'

interface SimulacaoItem {
  id: string
  nome: string
  createdAt: string
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
}

interface SimulacaoHistoricoProps {
  empresaId: string
  tipo: string
  onLoad: (inputs: Record<string, unknown>, outputs: Record<string, unknown>) => void
  refreshKey?: number // increment to trigger refresh
}

export function SimulacaoHistorico({ empresaId, tipo, onLoad, refreshKey }: SimulacaoHistoricoProps) {
  const [historico, setHistorico] = useState<SimulacaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!empresaId) return
    async function load() {
      setLoading(true)
      try {
        const data = await getSimuladorHistorico(empresaId, tipo)
        setHistorico((data ?? []) as SimulacaoItem[])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [empresaId, tipo, refreshKey])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteSimulacao(id)
      setHistorico(prev => prev.filter(h => h.id !== id))
    } catch { /* ignore */ }
    finally { setDeletingId(null) }
  }

  if (loading) return null
  if (historico.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Simulacoes Anteriores</span>
          <span className="text-xs text-muted-foreground">({historico.length})</span>
        </div>
        {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {historico.map((item) => {
            const dt = new Date(item.createdAt)
            const dateStr = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            return (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/20 transition-colors group">
                <button
                  onClick={() => onLoad(item.inputs, item.outputs)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                >
                  <Clock className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.nome || 'Simulacao'}</p>
                    <p className="text-[10px] text-muted-foreground">{dateStr} as {timeStr}</p>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                >
                  {deletingId === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
