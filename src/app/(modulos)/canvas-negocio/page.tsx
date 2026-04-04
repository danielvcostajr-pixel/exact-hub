'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Save, RotateCcw, GitBranch, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CanvasBoard } from '@/components/canvas/CanvasBoard'
import { BlocoCanvas, BusinessModelCanvasData, CanvasCard } from '@/types'
import { useClienteContext } from '@/hooks/useClienteContext'
import { getCanvasByEmpresa, saveCanvas } from '@/lib/api/data-service'

function gerarId() {
  return Math.random().toString(36).substring(2, 10)
}

function canvasVazio(empresaId: string): BusinessModelCanvasData {
  return {
    empresaId,
    versao: 1,
    blocos: {
      parceiros: [],
      atividades: [],
      recursos: [],
      proposta: [],
      relacionamento: [],
      canais: [],
      segmentos: [],
      custos: [],
      receitas: [],
    },
  }
}

export default function CanvasNegocioPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [canvas, setCanvas] = useState<BusinessModelCanvasData | null>(null)
  const [versao, setVersao] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // Load canvas from Supabase when client changes
  const loadCanvas = useCallback(async (empresaId: string) => {
    setCarregando(true)
    setSavedAt(null)
    try {
      const data = await getCanvasByEmpresa(empresaId)
      if (data && data.blocos) {
        setCanvas({
          empresaId,
          versao: data.versao || 1,
          blocos: data.blocos as BusinessModelCanvasData['blocos'],
        })
        setVersao(data.versao || 1)
      } else {
        setCanvas(canvasVazio(empresaId))
        setVersao(1)
      }
    } catch (err) {
      console.error('Erro ao carregar canvas:', err)
      setCanvas(canvasVazio(empresaId))
      setVersao(1)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (clienteAtivo) {
      loadCanvas(clienteAtivo.id)
    } else {
      setCanvas(null)
    }
  }, [clienteAtivo, loadCanvas])

  function handleAddCard(bloco: BlocoCanvas) {
    if (!canvas) return
    const novoCard: CanvasCard = {
      id: gerarId(),
      texto: 'Nova ideia...',
      ordem: canvas.blocos[bloco].length,
    }
    setCanvas((prev) => prev ? ({
      ...prev,
      blocos: {
        ...prev.blocos,
        [bloco]: [...prev.blocos[bloco], novoCard],
      },
    }) : prev)
  }

  function handleUpdateCard(bloco: BlocoCanvas, id: string, texto: string) {
    setCanvas((prev) => prev ? ({
      ...prev,
      blocos: {
        ...prev.blocos,
        [bloco]: prev.blocos[bloco].map((c) => (c.id === id ? { ...c, texto } : c)),
      },
    }) : prev)
  }

  function handleRemoveCard(bloco: BlocoCanvas, id: string) {
    setCanvas((prev) => prev ? ({
      ...prev,
      blocos: {
        ...prev.blocos,
        [bloco]: prev.blocos[bloco].filter((c) => c.id !== id),
      },
    }) : prev)
  }

  async function handleSave() {
    if (!canvas || !clienteAtivo) return
    setSalvando(true)
    try {
      await saveCanvas(clienteAtivo.id, canvas.blocos as unknown as Record<string, unknown>)
      setSavedAt(new Date().toLocaleTimeString('pt-BR'))
    } catch (err) {
      console.error('Erro ao salvar canvas:', err)
    } finally {
      setSalvando(false)
    }
  }

  function handleNovaVersao() {
    const novaVersao = versao + 1
    setVersao(novaVersao)
    setCanvas((prev) => prev ? ({ ...prev, versao: novaVersao }) : prev)
    setSavedAt(null)
  }

  function handleReset() {
    if (!clienteAtivo) return
    setCanvas(canvasVazio(clienteAtivo.id))
    setVersao(1)
    setSavedAt(null)
  }

  // No client selected
  if (!isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 p-6">
        <p className="text-muted-foreground">Selecione um cliente no seletor acima para visualizar os dados.</p>
      </div>
    )
  }

  // Loading
  if (carregando || !canvas) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 p-6">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carregando canvas...</p>
      </div>
    )
  }

  const totalCards = Object.values(canvas.blocos).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="flex flex-col gap-4 p-6 min-h-screen bg-background">
      {/* Back button + client name */}
      <div className="flex items-center gap-3">
        <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        {clienteAtivo && (
          <span className="text-sm text-primary font-medium">
            {clienteAtivo.nome}
          </span>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Canvas de Negocio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Business Model Canvas — {totalCards} itens mapeados
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Version badge */}
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="border-border text-muted-foreground gap-1"
            >
              <GitBranch size={11} />
              v{versao}
            </Badge>
            {savedAt && (
              <span className="text-[11px] text-muted-foreground">Salvo as {savedAt}</span>
            )}
          </div>

          {/* Actions */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleNovaVersao}
            className="border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground gap-1.5"
          >
            <GitBranch size={14} />
            Nova Versao
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground gap-1.5"
          >
            <RotateCcw size={14} />
            Limpar
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={salvando}
            className="bg-primary hover:bg-primary/90 text-white gap-1.5"
          >
            <Save size={14} />
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Canvas Board */}
      <CanvasBoard
        data={canvas}
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onRemoveCard={handleRemoveCard}
      />

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap pt-2">
        <span className="text-[11px] text-muted-foreground/50">Dica:</span>
        <span className="text-[11px] text-muted-foreground/50">Clique em qualquer card para editar</span>
        <span className="text-[11px] text-muted-foreground/50">•</span>
        <span className="text-[11px] text-muted-foreground/50">Passe o mouse para deletar</span>
        <span className="text-[11px] text-muted-foreground/50">•</span>
        <span className="text-[11px] text-muted-foreground/50">Clique + para adicionar novo item</span>
      </div>
    </div>
  )
}
