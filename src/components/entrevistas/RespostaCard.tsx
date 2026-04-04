'use client'

import { User, Briefcase, Building2, Clock } from 'lucide-react'
import { RespostaEntrevista, Pergunta } from '@/types'

interface RespostaCardProps {
  resposta: RespostaEntrevista
  perguntas: Pergunta[]
}

function ScaleBar({ value }: { value: number }) {
  const max = 10
  const percent = (value / max) * 100
  const color =
    value <= 3 ? '#EF4444' : value <= 6 ? '#F59E0B' : '#10B981'

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'hsl(var(--secondary))' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold w-6 text-right" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

export function RespostaCard({ resposta, perguntas }: RespostaCardProps) {
  const perguntasMap = Object.fromEntries(perguntas.map((p) => [p.id, p]))

  const dataFormatada = resposta.id
    ? new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
    >
      {/* Respondent header */}
      <div
        className="px-4 py-3 border-b flex items-start justify-between gap-4"
        style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}
          >
            <User size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{resposta.respondente}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {resposta.cargo && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Briefcase size={10} />
                  {resposta.cargo}
                </span>
              )}
              {resposta.area && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Building2 size={10} />
                  {resposta.area}
                </span>
              )}
            </div>
          </div>
        </div>
        {dataFormatada && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/50 shrink-0">
            <Clock size={10} />
            {dataFormatada}
          </div>
        )}
      </div>

      {/* Answers */}
      <div className="divide-y divide-border">
        {Object.entries(resposta.respostas).map(([perguntaId, valor], idx) => {
          const pergunta = perguntasMap[perguntaId]
          if (!pergunta) return null

          return (
            <div key={perguntaId} className="px-4 py-3">
              <div className="flex items-start gap-2 mb-2">
                <span
                  className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}
                >
                  {idx + 1}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">{pergunta.texto}</p>
              </div>

              <div className="ml-7">
                {pergunta.tipo === 'escala' && typeof valor === 'number' ? (
                  <ScaleBar value={valor} />
                ) : pergunta.tipo === 'multipla_escolha' ? (
                  <span
                    className="inline-block text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.13)', color: 'hsl(var(--primary))' }}
                  >
                    {String(valor)}
                  </span>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">{String(valor)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
