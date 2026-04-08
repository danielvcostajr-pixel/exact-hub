'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { ItemInvestimento, ItemFinanciamento, ContaExistente } from '@/types'
import { formatarMoeda } from '@/lib/calculations/financeiro'
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  TrendingUp, Landmark, ArrowDownLeft
} from 'lucide-react'

interface Props {
  investimentos: ItemInvestimento[]
  financiamentos: ItemFinanciamento[]
  contasReceber: ContaExistente[]
  onChangeInv: (i: ItemInvestimento[]) => void
  onChangeFin: (f: ItemFinanciamento[]) => void
  onChangeCR: (c: ContaExistente[]) => void
}

const MESES_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

type TipoInv = ItemInvestimento['tipo']
type TipoFin = ItemFinanciamento['tipo']

const INV_SECOES: { tipo: TipoInv; label: string; hasMes: boolean; labelValor: string }[] = [
  { tipo: 'venda_ativos',       label: 'Venda de Ativos',         hasMes: true,  labelValor: 'Valor (R$)' },
  { tipo: 'receita_financeira', label: 'Receitas Financeiras',    hasMes: false, labelValor: 'Valor Mensal (R$)' },
  { tipo: 'investimento_capex', label: 'Investimentos / CAPEX',   hasMes: true,  labelValor: 'Valor (R$)' },
]

const FIN_SECOES: { tipo: TipoFin; label: string }[] = [
  { tipo: 'captacao',         label: 'Captação de Recursos' },
  { tipo: 'aporte',           label: 'Aportes e Capital Próprio' },
  { tipo: 'distribuicao',     label: 'Distribuições e Retiradas' },
  { tipo: 'amortizacao',      label: 'Amortizações e Parcelamentos' },
  { tipo: 'capital_terceiros',label: 'Capital de Terceiros' },
  { tipo: 'acordo',           label: 'Acordos e Indenizações' },
]

function MesSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={v => onChange(parseInt(v))}>
      <SelectTrigger className="h-8 text-sm bg-background border-border text-foreground" style={{ minWidth: 110 }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-card border border-border">
        {MESES_LABELS.map((m, i) => (
          <SelectItem key={i} value={String(i)} className="text-foreground">{m}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ValorInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <CurrencyInput
      value={value}
      onChange={onChange}
      className="h-8"
    />
  )
}

function DescricaoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Descrição"
      className="h-8 text-sm flex-1 bg-background border-border text-foreground"
    />
  )
}

interface CollapsibleSectionProps {
  label: string
  count: number
  total: number
  children: React.ReactNode
}

function CollapsibleSection({ label, count, total, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors bg-card"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} className="text-muted-foreground" />}
          <span className="text-sm font-medium text-foreground">{label}</span>
          {count > 0 && (
            <Badge
              className="text-[10px] h-4 px-1"
              style={{ backgroundColor: 'rgba(241,117,34,0.2)', color: 'hsl(var(--primary))', border: 'none' }}
            >
              {count}
            </Badge>
          )}
        </div>
        {total > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatarMoeda(total)}
          </span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-background">
          {children}
        </div>
      )}
    </div>
  )
}

export default function EtapaInvestimentos({
  investimentos, financiamentos, contasReceber,
  onChangeInv, onChangeFin, onChangeCR
}: Props) {
  // --- Investimentos ---
  function addInv(tipo: TipoInv) {
    const novo: ItemInvestimento = {
      id: crypto.randomUUID(),
      descricao: '',
      valor: 0,
      mes: 0,
      tipo,
    }
    onChangeInv([...investimentos, novo])
  }

  function updateInv(id: string, field: keyof ItemInvestimento, value: string | number) {
    onChangeInv(investimentos.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function removeInv(id: string) {
    onChangeInv(investimentos.filter(i => i.id !== id))
  }

  function getInvByTipo(tipo: TipoInv) {
    return investimentos.filter(i => i.tipo === tipo)
  }

  // --- Financiamentos ---
  function addFin(tipo: TipoFin) {
    const novo: ItemFinanciamento = {
      id: crypto.randomUUID(),
      descricao: '',
      valor: 0,
      mes: 0,
      recorrente: false,
      meses: [],
      tipo,
    }
    onChangeFin([...financiamentos, novo])
  }

  function updateFin(id: string, field: keyof ItemFinanciamento, value: string | number | boolean | number[]) {
    onChangeFin(financiamentos.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  function toggleRecorrente(id: string) {
    onChangeFin(financiamentos.map(f => {
      if (f.id !== id) return f
      const novoRecorrente = !f.recorrente
      return {
        ...f,
        recorrente: novoRecorrente,
        meses: novoRecorrente ? [f.mes] : [],
      }
    }))
  }

  function toggleMesFin(id: string, mes: number) {
    onChangeFin(financiamentos.map(f => {
      if (f.id !== id) return f
      const meses = f.meses ? [...f.meses] : []
      const idx = meses.indexOf(mes)
      if (idx >= 0) meses.splice(idx, 1)
      else meses.push(mes)
      return { ...f, meses: meses.sort((a, b) => a - b) }
    }))
  }

  function selecionarTodosMeses(id: string) {
    onChangeFin(financiamentos.map(f => {
      if (f.id !== id) return f
      const allSelected = f.meses?.length === 12
      return { ...f, meses: allSelected ? [] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
    }))
  }

  function removeFin(id: string) {
    onChangeFin(financiamentos.filter(f => f.id !== id))
  }

  function getFinByTipo(tipo: TipoFin) {
    return financiamentos.filter(f => f.tipo === tipo)
  }

  // --- Contas a Receber ---
  function addCR() {
    const nova: ContaExistente = {
      id: crypto.randomUUID(),
      descricao: '',
      valor: 0,
      mes: 0,
    }
    onChangeCR([...contasReceber, nova])
  }

  function updateCR(id: string, field: keyof ContaExistente, value: string | number) {
    onChangeCR(contasReceber.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  function removeCR(id: string) {
    onChangeCR(contasReceber.filter(c => c.id !== id))
  }

  const totalInv = investimentos.reduce((s, i) => s + i.valor, 0)
  const totalFin = financiamentos.reduce((s, f) => s + f.valor, 0)
  const totalCR  = contasReceber.reduce((s, c) => s + c.valor, 0)

  return (
    <div className="space-y-6">
      {/* Investimentos */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <TrendingUp size={18} className="text-primary" />
              Investimentos
            </CardTitle>
            {totalInv > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                Total: <span className="text-foreground font-semibold">{formatarMoeda(totalInv)}</span>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {INV_SECOES.map(secao => {
            const items = getInvByTipo(secao.tipo)
            return (
              <div key={secao.tipo} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">{secao.label}</h4>
                  {items.length > 0 && (
                    <span className="text-xs tabular-nums text-muted-foreground/50">
                      {formatarMoeda(items.reduce((s, i) => s + i.valor, 0))}
                    </span>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="space-y-2">
                    <div className={`grid gap-2 text-xs font-semibold pb-1 ${secao.hasMes ? 'grid-cols-3' : 'grid-cols-2'} text-muted-foreground/50`}>
                      <span>Descrição</span>
                      <span>{secao.labelValor}</span>
                      {secao.hasMes && <span>Mês</span>}
                    </div>
                    {items.map(item => (
                      <div key={item.id} className={`grid gap-2 items-center ${secao.hasMes ? 'grid-cols-3' : 'grid-cols-2'} pr-8 relative`}>
                        <DescricaoInput
                          value={item.descricao}
                          onChange={v => updateInv(item.id!, 'descricao', v)}
                        />
                        <ValorInput
                          value={item.valor}
                          onChange={v => updateInv(item.id!, 'valor', v)}
                        />
                        {secao.hasMes && (
                          <MesSelect
                            value={item.mes}
                            onChange={v => updateInv(item.id!, 'mes', v)}
                          />
                        )}
                        <button
                          onClick={() => removeInv(item.id!)}
                          className="absolute right-0 p-1 rounded hover:bg-red-900/30"
                        >
                          <Trash2 size={13} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addInv(secao.tipo)}
                  className="text-xs h-7 px-2 text-primary"
                >
                  <Plus size={12} className="mr-1" />
                  Adicionar
                </Button>

                {secao.tipo !== 'investimento_capex' && (
                  <Separator className="bg-border mt-2" />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Financiamentos */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Landmark size={18} className="text-primary" />
              Financiamentos
            </CardTitle>
            {totalFin > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                Total: <span className="text-foreground font-semibold">{formatarMoeda(totalFin)}</span>
              </span>
            )}
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            Clique em cada seção para expandir e cadastrar os itens.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {FIN_SECOES.map(secao => {
            const items = getFinByTipo(secao.tipo)
            const total = items.reduce((s, f) => s + f.valor, 0)
            return (
              <CollapsibleSection
                key={secao.tipo}
                label={secao.label}
                count={items.length}
                total={total}
              >
                <div className="space-y-2">
                  {items.length > 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs font-semibold pb-1 text-muted-foreground/50">
                        <span>Descricao</span>
                        <span>Valor (R$)</span>
                        <span>Mes</span>
                      </div>
                      {items.map(item => (
                        <div key={item.id} className="space-y-2">
                          <div className="grid grid-cols-3 gap-2 items-center pr-8 relative">
                            <DescricaoInput
                              value={item.descricao}
                              onChange={v => updateFin(item.id!, 'descricao', v)}
                            />
                            <ValorInput
                              value={item.valor}
                              onChange={v => updateFin(item.id!, 'valor', v)}
                            />
                            {!item.recorrente ? (
                              <MesSelect
                                value={item.mes}
                                onChange={v => updateFin(item.id!, 'mes', v)}
                              />
                            ) : (
                              <span className="text-xs text-blue-400 font-medium">
                                {item.meses?.length ?? 0} meses
                              </span>
                            )}
                            <button
                              onClick={() => removeFin(item.id!)}
                              className="absolute right-0 p-1 rounded hover:bg-red-900/30"
                            >
                              <Trash2 size={13} style={{ color: '#ef4444' }} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 ml-1">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.recorrente ?? false}
                                onChange={() => toggleRecorrente(item.id!)}
                                className="accent-blue-500 w-3 h-3"
                              />
                              <span className="text-[11px] text-muted-foreground">Recorrente?</span>
                            </label>
                          </div>
                          {item.recorrente && (
                            <div className="ml-1 p-2 rounded-lg border border-blue-500/20 bg-blue-500/5">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-medium text-blue-400">Meses de ocorrencia</span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.meses?.length === 12}
                                    onChange={() => selecionarTodosMeses(item.id!)}
                                    className="accent-blue-500 w-3 h-3"
                                  />
                                  <span className="text-[10px] text-muted-foreground">Selecionar todos</span>
                                </label>
                              </div>
                              <div className="grid grid-cols-6 gap-1">
                                {MESES_LABELS.map((m, i) => {
                                  const selected = item.meses?.includes(i) ?? false
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => toggleMesFin(item.id!, i)}
                                      className={`text-[10px] py-1 px-1.5 rounded transition-all ${
                                        selected
                                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-semibold'
                                          : 'bg-background text-muted-foreground border border-border hover:border-blue-500/30'
                                      }`}
                                    >
                                      {m}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addFin(secao.tipo)}
                    className="text-xs h-7 px-2 mt-1 text-primary"
                  >
                    <Plus size={12} className="mr-1" />
                    Adicionar
                  </Button>
                </div>
              </CollapsibleSection>
            )
          })}
        </CardContent>
      </Card>

      {/* Contas a Receber Existentes (CAR) */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <ArrowDownLeft size={18} style={{ color: '#22c55e' }} />
              Contas a Receber Existentes (CAR)
              {contasReceber.length > 0 && (
                <Badge
                  className="text-[10px]"
                  style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'none' }}
                >
                  {contasReceber.length}
                </Badge>
              )}
            </CardTitle>
            {totalCR > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                Total: <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatarMoeda(totalCR)}</span>
              </span>
            )}
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            Saldos de recebíveis já existentes antes do início da projeção.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {contasReceber.length > 0 && (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs pb-2 font-semibold pr-2 text-muted-foreground">Descrição</th>
                  <th className="text-left text-xs pb-2 font-semibold pr-2 text-muted-foreground">Valor (R$)</th>
                  <th className="text-left text-xs pb-2 font-semibold pr-2 text-muted-foreground">Mês de Recebimento</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {contasReceber.map(conta => (
                  <tr key={conta.id} className="border-t border-border">
                    <td className="py-2 pr-2">
                      <Input
                        value={conta.descricao}
                        onChange={e => updateCR(conta.id!, 'descricao', e.target.value)}
                        placeholder="Descrição"
                        className="h-8 text-sm bg-background border-border text-foreground"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <CurrencyInput
                        value={conta.valor || 0}
                        onChange={v => updateCR(conta.id!, 'valor', v)}
                        className="h-8"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <MesSelect
                        value={conta.mes}
                        onChange={v => updateCR(conta.id!, 'mes', v)}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeCR(conta.id!)}
                        className="p-1 rounded hover:bg-red-900/30"
                      >
                        <Trash2 size={13} style={{ color: '#ef4444' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {contasReceber.length === 0 && (
            <p className="text-sm py-4 text-center text-muted-foreground/50">
              Nenhuma conta a receber cadastrada
            </p>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={addCR}
            className="text-xs h-7 px-2"
            style={{ color: '#22c55e' }}
          >
            <Plus size={12} className="mr-1" />
            Adicionar conta a receber
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
