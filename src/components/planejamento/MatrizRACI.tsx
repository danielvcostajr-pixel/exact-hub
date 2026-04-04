'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

export type RACIValue = 'R' | 'A' | 'C' | 'I' | null

export interface AcaoRaci {
  id: string
  descricao: string
  status: 'Pendente' | 'Em Andamento' | 'Concluida' | 'Bloqueada'
  atribuicoes: Record<string, RACIValue> // userId -> RACI
}

export interface UsuarioRaci {
  id: string
  nome: string
  papel?: string
}

interface MatrizRACIProps {
  acoes: AcaoRaci[]
  usuarios: UsuarioRaci[]
  onChange?: (acaoId: string, userId: string, value: RACIValue) => void
  readOnly?: boolean
}

const RACI_CYCLE: (RACIValue)[] = ['R', 'A', 'C', 'I', null]

const RACI_STYLES: Record<string, string> = {
  R: 'bg-blue-500/15 text-blue-500 border-blue-500/40 hover:bg-blue-500/25',
  A: 'bg-orange-500/15 text-orange-500 border-orange-500/40 hover:bg-orange-500/25',
  C: 'bg-green-500/15 text-green-500 border-green-500/40 hover:bg-green-500/25',
  I: 'bg-gray-500/10 text-gray-500 border-gray-500/30 hover:bg-gray-500/20',
}

const STATUS_STYLES: Record<string, string> = {
  Pendente: 'bg-secondary text-muted-foreground border-border',
  'Em Andamento': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  Concluida: 'bg-green-500/15 text-green-500 border-green-500/30',
  Bloqueada: 'bg-red-500/15 text-red-500 border-red-500/30',
}

const RACI_LEGEND = [
  { label: 'R', desc: 'Responsavel (executa)', color: 'text-blue-500' },
  { label: 'A', desc: 'Aprovador (accountable)', color: 'text-orange-500' },
  { label: 'C', desc: 'Consultado (consulted)', color: 'text-green-500' },
  { label: 'I', desc: 'Informado (informed)', color: 'text-gray-500' },
]

function nextRaciValue(current: RACIValue): RACIValue {
  const idx = RACI_CYCLE.indexOf(current)
  return RACI_CYCLE[(idx + 1) % RACI_CYCLE.length]
}

export function MatrizRACI({ acoes, usuarios, onChange, readOnly = false }: MatrizRACIProps) {
  const [data, setData] = useState<AcaoRaci[]>(acoes)

  function handleCellClick(acaoId: string, userId: string) {
    if (readOnly) return
    setData((prev) =>
      prev.map((a) => {
        if (a.id !== acaoId) return a
        const current = a.atribuicoes[userId] ?? null
        return {
          ...a,
          atribuicoes: { ...a.atribuicoes, [userId]: nextRaciValue(current) },
        }
      })
    )
    const acao = data.find((a) => a.id === acaoId)
    const current = acao?.atribuicoes[userId] ?? null
    onChange?.(acaoId, userId, nextRaciValue(current))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Legenda:</span>
        {RACI_LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
            <span className="text-xs text-muted-foreground">— {item.desc}</span>
          </div>
        ))}
        {!readOnly && (
          <span className="text-xs text-muted-foreground/60 ml-2">
            • Clique na celula para ciclar entre R → A → C → I → vazio
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[200px]">
                Acao
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                Status
              </th>
              {usuarios.map((u) => (
                <th
                  key={u.id}
                  className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[90px]"
                >
                  <div className="flex flex-col gap-0.5">
                    <span>{u.nome.split(' ')[0]}</span>
                    {u.papel && (
                      <span className="text-[10px] font-normal normal-case text-muted-foreground/60">
                        {u.papel}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((acao, idx) => (
              <tr
                key={acao.id}
                className={`border-b border-border last:border-0 ${
                  idx % 2 === 0 ? 'bg-background' : 'bg-card/50'
                }`}
              >
                <td className="py-3 px-4 text-foreground text-sm leading-snug">
                  {acao.descricao}
                </td>
                <td className="py-3 px-3">
                  <Badge
                    variant="outline"
                    className={`text-[10px] border px-1.5 py-0 whitespace-nowrap ${STATUS_STYLES[acao.status]}`}
                  >
                    {acao.status}
                  </Badge>
                </td>
                {usuarios.map((u) => {
                  const val = acao.atribuicoes[u.id] ?? null
                  return (
                    <td key={u.id} className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleCellClick(acao.id, u.id)}
                        disabled={readOnly}
                        className={`
                          w-8 h-8 rounded-md border text-xs font-bold transition-colors
                          ${val ? RACI_STYLES[val] : 'border-border text-muted-foreground/20 hover:bg-secondary hover:text-muted-foreground'}
                          ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                        `}
                      >
                        {val ?? '—'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma acao adicionada ao plano
        </div>
      )}
    </div>
  )
}
