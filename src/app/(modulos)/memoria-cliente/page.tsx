'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Download, Clock, RefreshCw, ArrowLeft } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { Button } from '@/components/ui/button'
import { MemoriaViewer } from '@/components/memoria/MemoriaViewer'

export default function MemoriaClientePage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [versaoAtual, setVersaoAtual] = useState({ numero: 0, label: 'Nenhuma versao', data: '' })
  const [conteudo, setConteudo] = useState('')
  const [gerando, setGerando] = useState(false)

  function handleGerarMemoria() {
    setGerando(true)
    setTimeout(() => {
      setConteudo(`# Memoria do Cliente — ${clienteAtivo?.nome ?? 'Cliente'}\n\n> Documento gerado automaticamente.\n\n---\n\n_Nenhum dado disponivel ainda. A medida que modulos forem preenchidos, a memoria sera gerada automaticamente._`)
      const novaVersao = { numero: versaoAtual.numero + 1, label: `v${versaoAtual.numero + 1} — Atual`, data: new Date().toLocaleDateString('pt-BR') }
      setVersaoAtual(novaVersao)
      setGerando(false)
    }, 1500)
  }

  function handleExportar() {
    const blob = new Blob([conteudo], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memoria-${clienteAtivo?.nome?.toLowerCase().replace(/\s+/g, '-') ?? 'cliente'}-v${versaoAtual.numero}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6 min-h-screen bg-background">
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
          <h1 className="text-2xl font-bold text-foreground">Memoria do Cliente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Documento consolidado com perfil, diagnostico e recomendacoes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Version info */}
          {versaoAtual.numero > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground px-3 h-8">
              <Clock size={13} />
              {versaoAtual.label}
            </span>
          )}

          {/* Export */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportar}
            className="border-border bg-card text-muted-foreground hover:bg-secondary gap-1.5"
          >
            <Download size={13} />
            Exportar
          </Button>

          {/* Generate */}
          <Button
            size="sm"
            onClick={handleGerarMemoria}
            disabled={gerando}
            className="bg-primary hover:bg-primary/90 text-white gap-1.5"
          >
            {gerando ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            {gerando ? 'Gerando...' : 'Gerar Memoria'}
          </Button>
        </div>
      </div>

      {/* Viewer */}
      {conteudo ? (
        <MemoriaViewer conteudo={conteudo} versao={versaoAtual.numero} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Sparkles size={24} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma memoria gerada para este cliente</h3>
            <p className="text-sm text-muted-foreground max-w-md">Clique em &apos;Gerar Memoria&apos; para criar.</p>
          </div>
        </div>
      )}
    </div>
  )
}
