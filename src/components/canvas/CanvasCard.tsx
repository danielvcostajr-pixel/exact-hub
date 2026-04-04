'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { CanvasCard as CanvasCardType } from '@/types'

interface CanvasCardProps {
  card: CanvasCardType
  onUpdate: (id: string, texto: string) => void
  onRemove: (id: string) => void
}

export function CanvasCard({ card, onUpdate, onRemove }: CanvasCardProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(card.texto)
  const [hovered, setHovered] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editing])

  function handleBlur() {
    setEditing(false)
    if (text.trim() !== card.texto) {
      onUpdate(card.id, text.trim() || card.texto)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setText(card.texto)
      setEditing(false)
    }
  }

  return (
    <div
      className="relative group rounded-md px-2 py-1.5 cursor-pointer transition-colors"
      style={{
        backgroundColor: card.cor ? `${card.cor}22` : 'hsl(var(--secondary))',
        borderLeft: card.cor ? `3px solid ${card.cor}` : '3px solid #2A2C2E',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !editing && setEditing(true)}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-foreground text-xs resize-none outline-none min-h-[40px]"
          rows={2}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <p className="text-xs text-foreground/90 leading-relaxed pr-4">{card.texto}</p>
      )}

      {hovered && !editing && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(card.id)
          }}
          className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center bg-red-500/80 hover:bg-red-500 transition-colors"
        >
          <X size={10} className="text-white" />
        </button>
      )}
    </div>
  )
}
