'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { DespesasCompletas, GastoVariavel, GastoFixo, CategoriaDespesa, ReajusteMensal } from '@/types'
import { formatarMoeda } from '@/lib/calculations/financeiro'
import { Plus, Trash2, Percent, DollarSign, Edit2, Check, X, CalendarClock } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MESES_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

interface Props {
  despesas: DespesasCompletas
  onChange: (d: DespesasCompletas) => void
}

const CATEGORIAS_FIXAS: { key: CategoriaDespesa; label: string }[] = [
  { key: 'pessoal',       label: 'Pessoal' },
  { key: 'diretoria',     label: 'Diretoria' },
  { key: 'comercial',     label: 'Comercial' },
  { key: 'administrativo',label: 'Administrativo' },
  { key: 'financeiro',    label: 'Financeiro' },
  { key: 'tributarias',   label: 'Tributárias' },
]

const VARIAVEIS_PADRAO = [
  { categoria: 'impostos',   nome: 'Impostos / Simples' },
  { categoria: 'comissoes',  nome: 'Comissões' },
  { categoria: 'transacoes', nome: 'Custos de Transação' },
  { categoria: 'cmv',        nome: 'CMV / CPV' },
  { categoria: 'outros',     nome: 'Outros' },
]

function newVariavel(nome: string, categoria: string): GastoVariavel {
  return { id: crypto.randomUUID(), nome, percentual: 0, categoria }
}

function newFixo(categoria: CategoriaDespesa): GastoFixo {
  return { id: crypto.randomUUID(), nome: '', valor: 0, categoria }
}

interface FixoRowProps {
  item: GastoFixo
  onUpdate: (item: GastoFixo) => void
  onDelete: () => void
}

function FixoRow({ item, onUpdate, onDelete }: FixoRowProps) {
  const [editing, setEditing] = useState(item.nome === '')
  const [nome, setNome] = useState(item.nome)
  const [valor, setValor] = useState(String(item.valor || ''))
  const [showReajustes, setShowReajustes] = useState(false)

  // Auto-propagate changes to parent on every keystroke
  function handleNomeChange(v: string) {
    setNome(v)
    onUpdate({ ...item, nome: v, valor: parseFloat(valor) || 0 })
  }

  function handleValorChange(v: string) {
    setValor(v)
    onUpdate({ ...item, nome, valor: parseFloat(v) || 0 })
  }

  function salvar() {
    onUpdate({ ...item, nome, valor: parseFloat(valor) || 0 })
    setEditing(false)
  }

  function cancelar() {
    if (item.nome === '') {
      onDelete()
    } else {
      setNome(item.nome)
      setValor(String(item.valor))
      setEditing(false)
    }
  }

  function addReajuste() {
    const reajustes = item.reajustes ? [...item.reajustes] : []
    reajustes.push({ mesInicio: 0, novoValor: item.valor })
    onUpdate({ ...item, reajustes })
  }

  function updateReajuste(index: number, field: keyof ReajusteMensal, value: number) {
    const reajustes = item.reajustes ? [...item.reajustes] : []
    reajustes[index] = { ...reajustes[index], [field]: value }
    onUpdate({ ...item, reajustes })
  }

  function removeReajuste(index: number) {
    const reajustes = item.reajustes ? [...item.reajustes] : []
    reajustes.splice(index, 1)
    onUpdate({ ...item, reajustes: reajustes.length > 0 ? reajustes : undefined })
  }

  const reajusteCount = item.reajustes?.length ?? 0

  if (editing) {
    return (
      <tr>
        <td className="py-2 pr-2">
          <Input
            autoFocus
            value={nome}
            onChange={e => handleNomeChange(e.target.value)}
            placeholder="Nome do gasto"
            className="h-8 text-sm bg-background border-primary text-foreground"
          />
        </td>
        <td className="py-2 pr-2">
          <CurrencyInput
            value={parseFloat(valor) || 0}
            onChange={v => handleValorChange(String(v))}
            className="h-8"
          />
        </td>
        <td className="py-2">
          <div className="flex gap-1">
            <button onClick={salvar} className="p-1 rounded hover:bg-green-900/30">
              <Check size={13} style={{ color: '#22c55e' }} />
            </button>
            <button onClick={cancelar} className="p-1 rounded hover:bg-red-900/30">
              <X size={13} style={{ color: '#ef4444' }} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr className="group hover:bg-white/5">
        <td className="py-2 pr-2 text-sm text-foreground">
          <div className="flex items-center gap-1.5">
            {item.nome}
            {reajusteCount > 0 && (
              <Badge className="text-[9px] h-4 px-1" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none' }}>
                {reajusteCount} reaj.
              </Badge>
            )}
          </div>
        </td>
        <td className="py-2 pr-2 text-sm tabular-nums text-muted-foreground">{formatarMoeda(item.valor)}/mes</td>
        <td className="py-2">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowReajustes(s => !s)}
              className="p-1 rounded hover:bg-blue-900/30"
              title="Reajustes mensais"
            >
              <CalendarClock size={13} className="text-blue-400" />
            </button>
            <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-white/10">
              <Edit2 size={13} className="text-primary" />
            </button>
            <button onClick={onDelete} className="p-1 rounded hover:bg-red-900/30">
              <Trash2 size={13} style={{ color: '#ef4444' }} />
            </button>
          </div>
        </td>
      </tr>
      {showReajustes && (
        <tr>
          <td colSpan={3} className="pb-3 pt-1">
            <div className="ml-4 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-2">
              <p className="text-[11px] font-medium text-blue-400">Reajustes Mensais</p>
              {(item.reajustes ?? []).map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">A partir de</span>
                  <Select value={String(r.mesInicio)} onValueChange={v => updateReajuste(idx, 'mesInicio', parseInt(v))}>
                    <SelectTrigger className="h-7 w-[90px] text-xs bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
                      {MESES_LABELS.map((m, i) => (
                        <SelectItem key={i} value={String(i)} className="text-xs text-foreground">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-muted-foreground">novo valor:</span>
                  <CurrencyInput
                    value={r.novoValor || 0}
                    onChange={v => updateReajuste(idx, 'novoValor', v)}
                    className="h-7 w-[120px] text-xs"
                  />
                  <button onClick={() => removeReajuste(idx)} className="p-1 rounded hover:bg-red-900/30">
                    <X size={11} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addReajuste} className="text-[11px] h-6 px-2 text-blue-400">
                <Plus size={10} className="mr-1" />
                Adicionar reajuste
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function EtapaDespesas({ despesas, onChange }: Props) {
  // Ensure variaveis are initialized with defaults if empty
  const [localVars, setLocalVars] = useState<GastoVariavel[]>(() => {
    if (despesas.variaveis.length > 0) return despesas.variaveis
    return VARIAVEIS_PADRAO.map(v => newVariavel(v.nome, v.categoria))
  })

  function updateVarExt(updated: GastoVariavel[]) {
    setLocalVars(updated)
    onChange({ ...despesas, variaveis: updated })
  }

  function handleVariavelPerc(id: string, raw: string) {
    const updated = localVars.map(v =>
      v.id === id ? { ...v, percentual: parseFloat(raw) || 0 } : v
    )
    updateVarExt(updated)
  }

  function handleVariavelNome(id: string, nome: string) {
    const updated = localVars.map(v => v.id === id ? { ...v, nome } : v)
    updateVarExt(updated)
  }

  function addVariavel() {
    const nova = newVariavel('Novo Item', 'outros')
    updateVarExt([...localVars, nova])
  }

  function removeVariavel(id: string) {
    updateVarExt(localVars.filter(v => v.id !== id))
  }

  function getFixosByCategoria(cat: CategoriaDespesa): GastoFixo[] {
    return despesas.fixos.filter(f => f.categoria === cat)
  }

  function addFixo(cat: CategoriaDespesa) {
    const novo = newFixo(cat)
    onChange({ ...despesas, fixos: [...despesas.fixos, novo] })
  }

  function updateFixo(updated: GastoFixo) {
    onChange({
      ...despesas,
      fixos: despesas.fixos.map(f => f.id === updated.id ? updated : f),
    })
  }

  function deleteFixo(id: string) {
    onChange({ ...despesas, fixos: despesas.fixos.filter(f => f.id !== id) })
  }

  const totalVarPerc = localVars.reduce((s, v) => s + v.percentual, 0)
  const totalFixosMes = despesas.fixos.reduce((s, f) => s + f.valor, 0)

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="rounded-lg px-4 py-3 flex items-center justify-between bg-card border border-border">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Total Gastos Fixos</span>
        </div>
        <span className="text-lg font-bold tabular-nums text-primary">
          {formatarMoeda(totalFixosMes)}<span className="text-sm font-normal ml-1 text-muted-foreground">/mês</span>
        </span>
      </div>

      {/* Gastos Variáveis */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Percent size={18} className="text-primary" />
            Gastos Variáveis (% do Faturamento)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs pb-2 pr-2 font-semibold text-muted-foreground">Nome</th>
                <th className="text-left text-xs pb-2 pr-2 font-semibold text-muted-foreground">% Faturamento</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {localVars.map(v => (
                <tr key={v.id} className="group border-t border-border">
                  <td className="py-2 pr-2">
                    <Input
                      value={v.nome}
                      onChange={e => handleVariavelNome(v.id!, e.target.value)}
                      className="h-8 text-sm bg-background border-border text-foreground"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <div className="relative max-w-[100px]">
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={v.percentual}
                        onChange={e => handleVariavelPerc(v.id!, e.target.value)}
                        className="pr-7 h-8 text-sm bg-background border-border text-foreground"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => removeVariavel(v.id!)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/30"
                    >
                      <Trash2 size={13} style={{ color: '#ef4444' }} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-border">
                <td className="pt-2 text-xs font-semibold text-muted-foreground">Total</td>
                <td className="pt-2">
                  <Badge
                    style={{
                      backgroundColor: Math.abs(totalVarPerc - 100) < 0.01 && totalVarPerc > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(241,117,34,0.15)',
                      color: Math.abs(totalVarPerc - 100) < 0.01 && totalVarPerc > 0 ? '#22c55e' : 'hsl(var(--primary))',
                      border: 'none',
                    }}
                  >
                    {totalVarPerc.toFixed(1)}%
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
          <Button
            variant="ghost"
            size="sm"
            onClick={addVariavel}
            className="mt-3 text-xs h-7 px-2 text-primary"
          >
            <Plus size={12} className="mr-1" />
            Adicionar linha
          </Button>
        </CardContent>
      </Card>

      {/* Gastos Fixos */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <DollarSign size={18} className="text-primary" />
            Gastos Fixos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pessoal">
            <TabsList
              className="flex flex-wrap h-auto gap-1 mb-4 p-1 rounded-lg bg-background"
            >
              {CATEGORIAS_FIXAS.map(cat => {
                const subtotal = getFixosByCategoria(cat.key).reduce((s, f) => s + f.valor, 0)
                return (
                  <TabsTrigger
                    key={cat.key}
                    value={cat.key}
                    className="text-xs h-7 flex items-center gap-1.5 data-[state=active]:text-foreground text-muted-foreground"
                  >
                    {cat.label}
                    {subtotal > 0 && (
                      <Badge
                        className="text-[10px] h-4 px-1"
                        style={{ backgroundColor: 'rgba(241,117,34,0.2)', color: 'hsl(var(--primary))', border: 'none' }}
                      >
                        {formatarMoeda(subtotal)}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {CATEGORIAS_FIXAS.map(cat => {
              const items = getFixosByCategoria(cat.key)
              const subtotal = items.reduce((s, f) => s + f.valor, 0)
              return (
                <TabsContent key={cat.key} value={cat.key} className="mt-0">
                  <div className="space-y-2">
                    {items.length > 0 && (
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left text-xs pb-2 font-semibold text-muted-foreground">Nome</th>
                            <th className="text-left text-xs pb-2 font-semibold text-muted-foreground">Valor Mensal</th>
                            <th className="w-16" />
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <FixoRow
                              key={item.id}
                              item={item}
                              onUpdate={updateFixo}
                              onDelete={() => deleteFixo(item.id!)}
                            />
                          ))}
                        </tbody>
                      </table>
                    )}

                    {items.length === 0 && (
                      <p className="text-sm py-4 text-center text-muted-foreground/50">
                        Nenhum gasto fixo em {cat.label}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addFixo(cat.key)}
                        className="text-xs h-7 px-2 text-primary"
                      >
                        <Plus size={12} className="mr-1" />
                        Adicionar
                      </Button>
                      {subtotal > 0 && (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          Subtotal: <span className="text-foreground font-semibold">{formatarMoeda(subtotal)}/mês</span>
                        </span>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
