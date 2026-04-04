'use client'

import { useState } from 'react'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Entrevista, Pergunta } from '@/types'

interface FormQuestionarioProps {
  open: boolean
  onClose: () => void
  onSave: (entrevista: Entrevista) => void
  empresaId: string
}

function gerarId() {
  return Math.random().toString(36).substring(2, 10)
}

const PERGUNTAS_AMOSTRA: Pergunta[] = [
  {
    id: gerarId(),
    texto: 'Como voce avalia a clareza dos processos internos da empresa?',
    categoria: 'Processos',
    tipo: 'escala',
  },
  {
    id: gerarId(),
    texto: 'Quais sao os principais gargalos que atrapalham sua produtividade?',
    categoria: 'Processos',
    tipo: 'aberta',
  },
  {
    id: gerarId(),
    texto: 'Como voce avalia o alinhamento da equipe com os objetivos estrategicos?',
    categoria: 'Estrategia',
    tipo: 'escala',
  },
  {
    id: gerarId(),
    texto: 'Qual e o seu nivel de satisfacao com as ferramentas tecnologicas disponíveis?',
    categoria: 'Tecnologia',
    tipo: 'escala',
  },
  {
    id: gerarId(),
    texto: 'Quais aspectos da cultura organizacional precisam ser melhorados?',
    categoria: 'Pessoas',
    tipo: 'aberta',
  },
]

export function FormQuestionario({ open, onClose, onSave, empresaId }: FormQuestionarioProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [gerando, setGerando] = useState(false)

  function resetForm() {
    setTitulo('')
    setDescricao('')
    setPerguntas([])
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function addPergunta() {
    const nova: Pergunta = {
      id: gerarId(),
      texto: '',
      categoria: 'Estrategia',
      tipo: 'aberta',
    }
    setPerguntas((prev) => [...prev, nova])
  }

  function updatePergunta(id: string, field: keyof Pergunta, value: string | string[] | null) {
    if (value === null) return
    setPerguntas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  function removePergunta(id: string) {
    setPerguntas((prev) => prev.filter((p) => p.id !== id))
  }

  function handleGerarComIA() {
    setGerando(true)
    setTimeout(() => {
      setPerguntas(PERGUNTAS_AMOSTRA.map((p) => ({ ...p, id: gerarId() })))
      if (!titulo) setTitulo('Diagnostico Organizacional — Entrevista com Equipe')
      if (!descricao)
        setDescricao(
          'Questionario para mapear pontos criticos, oportunidades de melhoria e o nivel de alinhamento estrategico da equipe.'
        )
      setGerando(false)
    }, 1200)
  }

  function handleSave() {
    if (!titulo.trim() || perguntas.length === 0) return
    const novaEntrevista: Entrevista = {
      id: gerarId(),
      empresaId,
      titulo,
      descricao,
      status: 'RASCUNHO',
      perguntas,
      criadoPorId: 'usr-1',
    }
    onSave(novaEntrevista)
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto border"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">Novo Questionario</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs">Titulo *</Label>
            <Input
              placeholder="Ex: Diagnostico de Processos Q1 2025"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="border-border bg-card text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs">Descricao</Label>
            <Textarea
              placeholder="Objetivo e contexto do questionario..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="border-border bg-card text-foreground placeholder:text-muted-foreground/30 resize-none"
            />
          </div>

          {/* Questions section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-xs">
                Perguntas ({perguntas.length})
              </Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGerarComIA}
                  disabled={gerando}
                  className="border-border bg-card text-primary hover:bg-primary/10 hover:border-primary/40 gap-1.5 text-xs"
                >
                  <Sparkles size={12} />
                  {gerando ? 'Gerando...' : 'Gerar com IA'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addPergunta}
                  className="border-border bg-card text-muted-foreground hover:bg-secondary gap-1.5 text-xs"
                >
                  <Plus size={12} />
                  Adicionar
                </Button>
              </div>
            </div>

            {perguntas.length === 0 ? (
              <div
                className="rounded-lg border-dashed border border-border p-6 text-center text-xs text-muted-foreground/50"
              >
                Nenhuma pergunta ainda. Use &ldquo;Gerar com IA&rdquo; ou adicione manualmente.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {perguntas.map((p, idx) => (
                  <div
                    key={p.id}
                    className="rounded-lg border p-3 flex flex-col gap-2"
                    style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground w-5 h-5 rounded flex items-center justify-center bg-secondary shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <Textarea
                        placeholder="Texto da pergunta..."
                        value={p.texto}
                        onChange={(e) => updatePergunta(p.id, 'texto', e.target.value)}
                        rows={2}
                        className="flex-1 border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-xs resize-none"
                      />
                      <button
                        onClick={() => removePergunta(p.id)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20 text-[#4A4C4E] hover:text-red-400 transition-colors shrink-0 mt-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex gap-2 ml-7">
                      <Select
                        value={p.categoria}
                        onValueChange={(v) => updatePergunta(p.id, 'categoria', v)}
                      >
                        <SelectTrigger className="h-7 text-xs border-border bg-card text-muted-foreground flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          {['Estrategia', 'Processos', 'Pessoas', 'Tecnologia', 'Financeiro'].map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-xs text-foreground">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={p.tipo}
                        onValueChange={(v) => updatePergunta(p.id, 'tipo', v as Pergunta['tipo'])}
                      >
                        <SelectTrigger className="h-7 text-xs border-border bg-card text-muted-foreground flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          <SelectItem value="aberta" className="text-xs text-foreground">Aberta</SelectItem>
                          <SelectItem value="escala" className="text-xs text-foreground">Escala (1-10)</SelectItem>
                          <SelectItem value="multipla_escolha" className="text-xs text-foreground">Multipla Escolha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {p.tipo === 'multipla_escolha' && (
                      <div className="ml-7">
                        <Input
                          placeholder="Opcoes separadas por virgula: Opcao A, Opcao B, Opcao C"
                          value={p.opcoes?.join(', ') ?? ''}
                          onChange={(e) => {
                            const opts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            updatePergunta(p.id, 'opcoes', opts)
                          }}
                          className="h-7 text-xs border-border bg-card text-foreground placeholder:text-muted-foreground/50"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="border-border bg-transparent text-muted-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!titulo.trim() || perguntas.length === 0}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Salvar Questionario
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
