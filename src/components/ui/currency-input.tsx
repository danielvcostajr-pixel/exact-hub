'use client'

import { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

/**
 * Formata um número para o padrão brasileiro: 1.234.567,89
 */
function formatBRL(value: number): string {
  if (value === 0) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Remove tudo que não é dígito e converte para centavos
 */
function parseCents(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
}

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
  className,
  disabled,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = value ? formatBRL(value) : ''

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const cents = parseCents(raw)
      onChange(cents / 100)
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, arrows
      const allowed = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'Home', 'End',
      ]
      if (allowed.includes(e.key)) return

      // Allow Ctrl/Cmd + A, C, V, X
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return

      // Block non-digit
      if (!/^\d$/.test(e.key)) {
        e.preventDefault()
      }
    },
    []
  )

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none text-muted-foreground">
        R$
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground',
          'focus:outline-none focus:ring-1 focus:ring-ring',
          'placeholder:text-muted-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      />
    </div>
  )
}
