'use client'

import Link from 'next/link'
import { Target, DollarSign, TrendingUp, PieChart, ArrowRight } from 'lucide-react'

const SIMULADORES = [
  {
    href: '/simuladores/ponto-equilibrio',
    icon: Target,
    titulo: 'Ponto de Equilibrio',
    descricao: 'Calcule o faturamento minimo necessario para cobrir todos os custos da operacao.',
    cor: 'text-orange-500',
    bgCor: 'bg-orange-500/10',
  },
  {
    href: '/simuladores/precificacao',
    icon: DollarSign,
    titulo: 'Precificacao',
    descricao: 'Defina precos ideais com base em custos, margem desejada e posicionamento de mercado.',
    cor: 'text-blue-500',
    bgCor: 'bg-blue-500/10',
  },
  {
    href: '/simuladores/cenarios',
    icon: TrendingUp,
    titulo: 'Cenarios Financeiros',
    descricao: 'Compare cenarios pessimista, realista e otimista para planejar o futuro do negocio.',
    cor: 'text-green-500',
    bgCor: 'bg-green-500/10',
  },
  {
    href: '/simuladores/roi',
    icon: PieChart,
    titulo: 'ROI de Investimentos',
    descricao: 'Calcule ROI, Payback e VPL para avaliar a viabilidade de novos investimentos.',
    cor: 'text-purple-500',
    bgCor: 'bg-purple-500/10',
  },
]

export default function SimuladoresPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Simuladores</h1>
        <p className="text-muted-foreground mt-1">
          Ferramentas de simulacao financeira para apoiar decisoes estrategicas
        </p>
      </div>

      {/* Grid de simuladores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SIMULADORES.map(({ href, icon: Icon, titulo, descricao, cor, bgCor }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${bgCor} shrink-0`}>
                  <Icon size={22} className={cor} />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                    {titulo}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                    {descricao}
                  </p>
                </div>
              </div>
              <ArrowRight
                size={18}
                className="shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 mt-0.5"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
