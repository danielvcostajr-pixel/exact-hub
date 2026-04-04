'use client'

import { BlocoCanvas, BusinessModelCanvasData } from '@/types'
import { CanvasBlock } from './CanvasBlock'

interface CanvasBoardProps {
  data: BusinessModelCanvasData
  onAddCard: (bloco: BlocoCanvas) => void
  onUpdateCard: (bloco: BlocoCanvas, id: string, texto: string) => void
  onRemoveCard: (bloco: BlocoCanvas, id: string) => void
}

const BLOCO_CONFIG: Record<BlocoCanvas, { title: string; subtitle?: string; icon: string; color: string }> = {
  parceiros: {
    title: 'Parceiros-Chave',
    subtitle: 'Quem nos ajuda?',
    icon: '🤝',
    color: '#8B5CF6',
  },
  atividades: {
    title: 'Atividades-Chave',
    subtitle: 'O que fazemos?',
    icon: '⚙️',
    color: '#3B82F6',
  },
  recursos: {
    title: 'Recursos-Chave',
    subtitle: 'O que temos?',
    icon: '🔧',
    color: '#06B6D4',
  },
  proposta: {
    title: 'Proposta de Valor',
    subtitle: 'Por que nos escolhem?',
    icon: '💎',
    color: '#F17522',
  },
  relacionamento: {
    title: 'Relacionamento',
    subtitle: 'Como interagimos?',
    icon: '💬',
    color: '#10B981',
  },
  canais: {
    title: 'Canais',
    subtitle: 'Como chegamos?',
    icon: '📡',
    color: '#F59E0B',
  },
  segmentos: {
    title: 'Segmentos de Clientes',
    subtitle: 'Para quem?',
    icon: '👥',
    color: '#EF4444',
  },
  custos: {
    title: 'Estrutura de Custos',
    subtitle: 'Quais são nossos custos?',
    icon: '💸',
    color: '#EC4899',
  },
  receitas: {
    title: 'Fontes de Receita',
    subtitle: 'Como ganhamos dinheiro?',
    icon: '💰',
    color: '#10B981',
  },
}

export function CanvasBoard({ data, onAddCard, onUpdateCard, onRemoveCard }: CanvasBoardProps) {
  const blocos = data.blocos

  function renderBlock(key: BlocoCanvas, className?: string) {
    const config = BLOCO_CONFIG[key]
    return (
      <CanvasBlock
        key={key}
        title={config.title}
        subtitle={config.subtitle}
        blocoKey={key}
        cards={blocos[key]}
        onAddCard={onAddCard}
        onUpdateCard={onUpdateCard}
        onRemoveCard={onRemoveCard}
        icon={config.icon}
        colorAccent={config.color}
        className={className}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Desktop BMC Layout */}
      <div className="hidden lg:flex flex-col gap-2" style={{ minHeight: '580px' }}>
        {/* Top 5 columns */}
        <div className="grid gap-2 flex-1" style={{ gridTemplateColumns: '1fr 1fr 1.3fr 1fr 1fr' }}>
          {/* Column 1: Parceiros */}
          <div className="flex flex-col h-full">
            {renderBlock('parceiros', 'h-full')}
          </div>

          {/* Column 2: Atividades + Recursos */}
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1">{renderBlock('atividades', 'h-full')}</div>
            <div className="flex-1">{renderBlock('recursos', 'h-full')}</div>
          </div>

          {/* Column 3: Proposta de Valor */}
          <div className="flex flex-col h-full">
            {renderBlock('proposta', 'h-full')}
          </div>

          {/* Column 4: Relacionamento + Canais */}
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1">{renderBlock('relacionamento', 'h-full')}</div>
            <div className="flex-1">{renderBlock('canais', 'h-full')}</div>
          </div>

          {/* Column 5: Segmentos */}
          <div className="flex flex-col h-full">
            {renderBlock('segmentos', 'h-full')}
          </div>
        </div>

        {/* Bottom row: Custos + Receitas */}
        <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr', height: '160px' }}>
          {renderBlock('custos', 'h-full')}
          {renderBlock('receitas', 'h-full')}
        </div>
      </div>

      {/* Mobile / Tablet Layout - vertical stack */}
      <div className="flex flex-col gap-2 lg:hidden">
        {(
          [
            'parceiros',
            'atividades',
            'recursos',
            'proposta',
            'relacionamento',
            'canais',
            'segmentos',
            'custos',
            'receitas',
          ] as BlocoCanvas[]
        ).map((key) => (
          <div key={key} style={{ minHeight: '140px' }}>
            {renderBlock(key, 'h-full')}
          </div>
        ))}
      </div>
    </div>
  )
}
