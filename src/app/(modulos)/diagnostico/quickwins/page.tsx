'use client'

import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { QuickWinsTab } from '@/components/entrevistas/QuickWinsTab'

export default function QuickWinsPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()

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

      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap size={22} className="text-amber-500" />
          Quick Wins
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Checklist de acoes rapidas de alto impacto — {clienteAtivo?.nome ?? 'Cliente'}
        </p>
      </div>

      <QuickWinsTab />
    </div>
  )
}
