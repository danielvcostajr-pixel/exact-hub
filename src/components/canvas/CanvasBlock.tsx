'use client'

import { Plus } from 'lucide-react'
import { CanvasCard as CanvasCardType, BlocoCanvas } from '@/types'
import { CanvasCard } from './CanvasCard'

interface CanvasBlockProps {
  title: string
  subtitle?: string
  blocoKey: BlocoCanvas
  cards: CanvasCardType[]
  onAddCard: (bloco: BlocoCanvas) => void
  onUpdateCard: (bloco: BlocoCanvas, id: string, texto: string) => void
  onRemoveCard: (bloco: BlocoCanvas, id: string) => void
  icon?: string
  colorAccent?: string
  className?: string
}

export function CanvasBlock({
  title,
  subtitle,
  blocoKey,
  cards,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  icon,
  colorAccent = '#F17522',
  className = '',
}: CanvasBlockProps) {
  return (
    <div
      className={`flex flex-col rounded-lg border overflow-hidden h-full ${className}`}
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-sm shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h3
              className="text-xs font-semibold uppercase tracking-wide truncate"
              style={{ color: colorAccent }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground bg-secondary rounded px-1.5 py-0.5">
            {cards.length}
          </span>
          <button
            onClick={() => onAddCard(blocoKey)}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#F17522]/20 transition-colors"
            style={{ color: colorAccent }}
            title="Adicionar card"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 flex flex-col gap-1.5 overflow-y-auto min-h-0">
        {cards.length === 0 ? (
          <div
            className="flex-1 flex items-center justify-center text-[11px] text-center rounded-md border-dashed border border-border/50 text-muted-foreground/50 cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => onAddCard(blocoKey)}
          >
            Clique + para adicionar
          </div>
        ) : (
          cards.map((card) => (
            <CanvasCard
              key={card.id}
              card={card}
              onUpdate={(id, texto) => onUpdateCard(blocoKey, id, texto)}
              onRemove={(id) => onRemoveCard(blocoKey, id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
