'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, Download, Clock, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { Button } from '@/components/ui/button'
import { MemoriaViewer } from '@/components/memoria/MemoriaViewer'
import { getMemoriaByEmpresa, saveMemoria, getCurrentUserId, getCanvasByEmpresa, getOKRsByEmpresa, getProjecaoByEmpresa, getEmpresa } from '@/lib/api/data-service'

export default function MemoriaClientePage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [versaoAtual, setVersaoAtual] = useState({ numero: 0, label: 'Nenhuma versao', data: '' })
  const [conteudo, setConteudo] = useState('')
  const [gerando, setGerando] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load existing memoria from Supabase
  useEffect(() => {
    if (!clienteAtivo) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const mem = await getMemoriaByEmpresa(clienteAtivo!.id)
        if (!cancelled && mem) {
          setConteudo(mem.conteudo)
          setVersaoAtual({ numero: mem.versao, label: `v${mem.versao} — Atual`, data: new Date(mem.updatedAt).toLocaleDateString('pt-BR') })
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [clienteAtivo])

  async function handleGerarMemoria() {
    if (!clienteAtivo) return
    setGerando(true)
    try {
      // Gather data from all modules to build memoria
      const [empresa, canvas, okrs, projecao] = await Promise.all([
        getEmpresa(clienteAtivo.id).catch(() => null),
        getCanvasByEmpresa(clienteAtivo.id).catch(() => null),
        getOKRsByEmpresa(clienteAtivo.id).catch(() => null),
        getProjecaoByEmpresa(clienteAtivo.id).catch(() => null),
      ])

      let md = `# Memoria do Cliente — ${clienteAtivo.nome}\n\n`
      md += `> Documento gerado em ${new Date().toLocaleDateString('pt-BR')}\n\n---\n\n`

      // Empresa info
      if (empresa) {
        md += `## Perfil da Empresa\n\n`
        md += `- **Razao Social:** ${empresa.razaoSocial}\n`
        if (empresa.nomeFantasia) md += `- **Nome Fantasia:** ${empresa.nomeFantasia}\n`
        if (empresa.segmento) md += `- **Segmento:** ${empresa.segmento}\n`
        if (empresa.porte) md += `- **Porte:** ${empresa.porte}\n`
        if (empresa.cidade) md += `- **Localizacao:** ${empresa.cidade}${empresa.estado ? '/' + empresa.estado : ''}\n`
        if (empresa.responsavel) md += `- **Responsavel:** ${empresa.responsavel}\n`
        md += `\n`
      }

      // Canvas
      if (canvas?.blocos) {
        const blocos = canvas.blocos as Record<string, Array<{ texto: string }>>
        const filled = Object.entries(blocos).filter(([, cards]) => Array.isArray(cards) && cards.length > 0)
        if (filled.length > 0) {
          md += `## Canvas de Negocio\n\n`
          const labels: Record<string, string> = { parceiros: 'Parceiros-Chave', atividades: 'Atividades-Chave', recursos: 'Recursos-Chave', proposta: 'Proposta de Valor', relacionamento: 'Relacionamento', canais: 'Canais', segmentos: 'Segmentos', custos: 'Custos', receitas: 'Receitas' }
          for (const [key, cards] of filled) {
            md += `### ${labels[key] ?? key}\n`
            for (const card of cards) md += `- ${card.texto}\n`
            md += `\n`
          }
        }
      }

      // OKRs
      if (okrs && okrs.length > 0) {
        md += `## OKRs\n\n`
        for (const okr of okrs) {
          md += `### ${okr.objetivo} (${okr.status})\n`
          if (okr.descricao) md += `${okr.descricao}\n`
          const krs = (okr as { KeyResult?: Array<{ descricao: string; valorAtual: number; metaAlvo: number; unidade: string }> }).KeyResult
          if (krs && krs.length > 0) {
            for (const kr of krs) md += `- ${kr.descricao}: ${kr.valorAtual}/${kr.metaAlvo} ${kr.unidade}\n`
          }
          md += `\n`
        }
      }

      // Projecao
      if (projecao?.dados) {
        md += `## Projecao Financeira\n\n`
        md += `- **Ano Base:** ${projecao.anoBase}\n`
        md += `- _Dados do PROFECIA disponveis na pagina de Projecao Financeira_\n\n`
      }

      if (!canvas && (!okrs || okrs.length === 0) && !projecao) {
        md += `\n_Nenhum dado disponivel ainda nos modulos. A medida que forem preenchidos, a memoria sera atualizada._\n`
      }

      setConteudo(md)

      // Save to Supabase
      const userId = await getCurrentUserId()
      if (userId) {
        await saveMemoria({ empresaId: clienteAtivo.id, conteudo: md, geradoPorId: userId })
      }

      const novaVersao = { numero: versaoAtual.numero + 1, label: `v${versaoAtual.numero + 1} — Atual`, data: new Date().toLocaleDateString('pt-BR') }
      setVersaoAtual(novaVersao)
    } catch (err) {
      console.error('Erro ao gerar memoria:', err)
    } finally {
      setGerando(false)
    }
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
