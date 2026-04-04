'use client'

import { useState } from 'react'
import { Save, RotateCcw, ChevronDown, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { CanvasBoard } from '@/components/canvas/CanvasBoard'
import { BlocoCanvas, BusinessModelCanvasData, CanvasCard } from '@/types'

// Mock companies
const EMPRESAS = [
  { id: 'emp-1', nome: 'Geny Eletrodomesticos' },
  { id: 'emp-2', nome: 'TechSol Sistemas' },
  { id: 'emp-3', nome: 'Construmax Engenharia' },
]

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

const CANVAS_DEMO: BusinessModelCanvasData = {
  empresaId: 'emp-1',
  versao: 1,
  blocos: {
    parceiros: [
      { id: gerarId(), texto: 'Fornecedores de eletrodomésticos', cor: '#8B5CF6', ordem: 0 },
      { id: gerarId(), texto: 'Transportadoras logísticas', cor: '#8B5CF6', ordem: 1 },
      { id: gerarId(), texto: 'Financeiras parceiras', cor: '#8B5CF6', ordem: 2 },
    ],
    atividades: [
      { id: gerarId(), texto: 'Venda e atendimento ao cliente', cor: '#3B82F6', ordem: 0 },
      { id: gerarId(), texto: 'Gestão de estoque', cor: '#3B82F6', ordem: 1 },
      { id: gerarId(), texto: 'Entrega e instalação', cor: '#3B82F6', ordem: 2 },
    ],
    recursos: [
      { id: gerarId(), texto: 'Lojas físicas (12 unidades)', cor: '#06B6D4', ordem: 0 },
      { id: gerarId(), texto: 'Equipe de vendas treinada', cor: '#06B6D4', ordem: 1 },
      { id: gerarId(), texto: 'Sistema ERP', cor: '#06B6D4', ordem: 2 },
    ],
    proposta: [
      { id: gerarId(), texto: 'Melhor preço da região com garantia estendida', cor: '#F17522', ordem: 0 },
      { id: gerarId(), texto: 'Entrega e instalação grátis', cor: '#F17522', ordem: 1 },
      { id: gerarId(), texto: 'Crédito facilitado para todos os perfis', cor: '#F17522', ordem: 2 },
    ],
    relacionamento: [
      { id: gerarId(), texto: 'Atendimento presencial humanizado', cor: '#10B981', ordem: 0 },
      { id: gerarId(), texto: 'Pós-venda via WhatsApp', cor: '#10B981', ordem: 1 },
    ],
    canais: [
      { id: gerarId(), texto: 'Lojas físicas na Paraíba', cor: '#F59E0B', ordem: 0 },
      { id: gerarId(), texto: 'E-commerce próprio', cor: '#F59E0B', ordem: 1 },
      { id: gerarId(), texto: 'Marketplaces (Mercado Livre)', cor: '#F59E0B', ordem: 2 },
    ],
    segmentos: [
      { id: gerarId(), texto: 'Famílias classe B/C', cor: '#EF4444', ordem: 0 },
      { id: gerarId(), texto: 'Pequenos empreendedores', cor: '#EF4444', ordem: 1 },
      { id: gerarId(), texto: 'Construtoras e imobiliárias', cor: '#EF4444', ordem: 2 },
    ],
    custos: [
      { id: gerarId(), texto: 'Aluguel das lojas (R$ 280k/mês)', cor: '#EC4899', ordem: 0 },
      { id: gerarId(), texto: 'Folha de pagamento', cor: '#EC4899', ordem: 1 },
      { id: gerarId(), texto: 'Compra de estoque', cor: '#EC4899', ordem: 2 },
      { id: gerarId(), texto: 'Logística e frete', cor: '#EC4899', ordem: 3 },
    ],
    receitas: [
      { id: gerarId(), texto: 'Venda de eletrodomésticos (principal)', cor: '#10B981', ordem: 0 },
      { id: gerarId(), texto: 'Garantia estendida e seguros', cor: '#10B981', ordem: 1 },
      { id: gerarId(), texto: 'Serviço de instalação', cor: '#10B981', ordem: 2 },
    ],
  },
}

export default function CanvasNegocioPage() {
  const [empresaSelecionada, setEmpresaSelecionada] = useState(EMPRESAS[0])
  const [canvas, setCanvas] = useState<BusinessModelCanvasData>(CANVAS_DEMO)
  const [versao, setVersao] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  function handleAddCard(bloco: BlocoCanvas) {
    const novoCard: CanvasCard = {
      id: gerarId(),
      texto: 'Nova ideia...',
      ordem: canvas.blocos[bloco].length,
    }
    setCanvas((prev) => ({
      ...prev,
      blocos: {
        ...prev.blocos,
        [bloco]: [...prev.blocos[bloco], novoCard],
      },
    }))
  }

  function handleUpdateCard(bloco: BlocoCanvas, id: string, texto: string) {
    setCanvas((prev) => ({
      ...prev,
      blocos: {
        ...prev.blocos,
        [bloco]: prev.blocos[bloco].map((c) => (c.id === id ? { ...c, texto } : c)),
      },
    }))
  }

  function handleRemoveCard(bloco: BlocoCanvas, id: string) {
    setCanvas((prev) => ({
      ...prev,
      blocos: {
        ...prev.blocos,
        [bloco]: prev.blocos[bloco].filter((c) => c.id !== id),
      },
    }))
  }

  function handleSave() {
    setSalvando(true)
    setTimeout(() => {
      setSalvando(false)
      setSavedAt(new Date().toLocaleTimeString('pt-BR'))
    }, 800)
  }

  function handleNovaVersao() {
    const novaVersao = versao + 1
    setVersao(novaVersao)
    setCanvas((prev) => ({ ...prev, versao: novaVersao }))
    setSavedAt(null)
  }

  function handleReset() {
    setCanvas(canvasVazio(empresaSelecionada.id))
    setVersao(1)
    setSavedAt(null)
  }

  const totalCards = Object.values(canvas.blocos).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="flex flex-col gap-4 p-6 min-h-screen bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Canvas de Negocio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Business Model Canvas — {totalCards} itens mapeados
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Company selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-sm px-3 h-8 transition-colors"
            >
              {empresaSelecionada.nome}
              <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="border-border bg-card"
              align="end"
            >
              {EMPRESAS.map((emp) => (
                <DropdownMenuItem
                  key={emp.id}
                  onClick={() => setEmpresaSelecionada(emp)}
                  className="text-foreground hover:bg-secondary cursor-pointer"
                >
                  {emp.nome}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
              <span className="text-[11px] text-muted-foreground">Salvo às {savedAt}</span>
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
