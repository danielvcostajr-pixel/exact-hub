'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, RotateCcw, Copy, ArrowLeft } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RotinaCard, type Rotina } from '@/components/planejamento/RotinaCard'
import { ROTINAS_TEMPLATES, type RotinaTemplate } from '@/lib/templates/rotinas'

function gerarId() {
  return Math.random().toString(36).substring(2, 10)
}

function templateParaRotina(tpl: RotinaTemplate): Rotina {
  return {
    id: gerarId(),
    nome: tpl.nome,
    descricao: tpl.descricao,
    categoria: tpl.categoria as Rotina['categoria'],
    frequencia: tpl.frequencia as Rotina['frequencia'],
    diaExecucao: tpl.diaExecucao,
    proximaExecucao: 'A definir',
    itens: tpl.itens.map((it) => ({
      id: gerarId(),
      descricao: it.descricao,
      obrigatorio: it.obrigatorio,
      tipo: it.tipo,
      dica: it.dica,
    })),
  }
}

const FREQ_COLORS: Record<string, string> = {
  DIARIA: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  SEMANAL: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  QUINZENAL: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  MENSAL: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
}

const FREQ_LABELS: Record<string, string> = {
  DIARIA: 'Diaria',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
}

const CAT_COLORS: Record<string, string> = {
  Financeiro: 'bg-green-500/15 text-green-600 border-green-500/30',
  Comercial: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  Operacional: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
  RH: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
  Marketing: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
}

export default function RotinasPage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [finalizadas, setFinalizadas] = useState<Set<string>>(new Set())

  function handleFinalizar(rotinaId: string) {
    setFinalizadas((prev) => { const next = new Set(Array.from(prev)); next.add(rotinaId); return next })
  }

  function handleUsarTemplate(tpl: RotinaTemplate) {
    const novaRotina = templateParaRotina(tpl)
    setRotinas((prev) => [novaRotina, ...prev])
  }

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw size={22} className="text-primary" />
            Rotinas e Itens de Controle
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rotinas.length} rotina{rotinas.length !== 1 ? 's' : ''} ativa{rotinas.length !== 1 ? 's' : ''} — {clienteAtivo?.nome ?? 'Cliente'}
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shrink-0"
        >
          <Plus size={16} />
          Nova Rotina
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="minhas" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="minhas"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground"
          >
            Minhas Rotinas
            <Badge
              variant="outline"
              className="ml-2 border-border text-muted-foreground text-[10px] px-1.5 py-0 h-4"
            >
              {rotinas.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground"
          >
            Templates
            <Badge
              variant="outline"
              className="ml-2 border-border text-muted-foreground text-[10px] px-1.5 py-0 h-4"
            >
              {ROTINAS_TEMPLATES.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Minhas Rotinas */}
        <TabsContent value="minhas" className="mt-4">
          <div className="flex flex-col gap-3">
            {rotinas.map((rotina) => (
              <RotinaCard
                key={rotina.id}
                rotina={rotina}
                onFinalizar={handleFinalizar}
              />
            ))}
            {rotinas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
                <RotateCcw size={36} className="text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhuma rotina criada</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Crie uma rotina ou use um template
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ROTINAS_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground leading-snug">{tpl.nome}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{tpl.descricao}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[11px] border px-2 py-0 ${FREQ_COLORS[tpl.frequencia]}`}
                  >
                    {FREQ_LABELS[tpl.frequencia]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[11px] border px-2 py-0 ${CAT_COLORS[tpl.categoria]}`}
                  >
                    {tpl.categoria}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {tpl.itens.length} itens
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {tpl.itens.slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-muted-foreground/50 text-xs mt-0.5">•</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{it.descricao}</span>
                      {it.obrigatorio && (
                        <span className="text-red-500 text-xs font-bold shrink-0">*</span>
                      )}
                    </div>
                  ))}
                  {tpl.itens.length > 3 && (
                    <span className="text-xs text-muted-foreground/50 ml-3">
                      + {tpl.itens.length - 3} mais...
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleUsarTemplate(tpl)}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-1.5 h-8 text-xs"
                  >
                    <Copy size={12} />
                    Usar Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
