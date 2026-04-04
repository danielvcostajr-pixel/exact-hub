'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Download, ChevronDown, Clock, RefreshCw, ArrowLeft } from 'lucide-react'
import { useClienteContext } from '@/hooks/useClienteContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MemoriaViewer } from '@/components/memoria/MemoriaViewer'

const MEMORIA_DEMO = `# Memoria do Cliente — Geny Eletrodomesticos

> Documento consolidado gerado pela Exact BI em 03 de Abril de 2025. Versao 3.

---

## Perfil da Empresa

### Identificacao

**Razao Social:** Geny Comercio de Eletrodomesticos Ltda
**Nome Fantasia:** Geny Eletrodomesticos
**CNPJ:** 12.345.678/0001-90
**Segmento:** Varejo de Eletrodomesticos e Eletronicos
**Porte:** Medio
**Fundacao:** 1987

### Presenca e Estrutura

- 12 lojas fisicas distribuidas no interior da Paraiba
- Sede administrativa em Campina Grande - PB
- E-commerce proprio (lancado em 2022)
- Presenca em marketplaces: Mercado Livre, Shopee

### Lideranca

**Responsavel:** Roberto Ferreira (CEO e Fundador)
**Contato:** roberto@geny.com.br | (83) 9 9999-0000

---

## Diagnostico Financeiro

### Indicadores Principais (2024)

| Indicador | Valor | Variacao |
| Faturamento Bruto | R$ 42,8M | +8% vs 2023 |
| Margem Bruta | 23,4% | -1,2pp |
| EBITDA | R$ 2,1M | -15% vs 2023 |
| Divida Liquida | R$ 8,4M | +22% |
| Giro de Estoque | 45 dias | +8 dias |

### Pontos de Atencao

- **Compressao de margem:** Aumento de custos operacionais nao acompanhado por repasse de preco
- **Ciclo financeiro pressionado:** PMR de 38 dias vs PMP de 25 dias gera necessidade de capital de giro
- **Endividamento crescente:** Captacao em 2024 para expansao impactou estrutura de capital

### Tendencias

O segmento de linha branca apresenta crescimento de 12% no nordeste, porem com competicao crescente de grandes redes nacionais (Magazine Luiza, Casas Bahia). A Geny mantém vantagem competitiva local em credito e relacionamento.

---

## Canvas de Negocio

### Proposta de Valor

O principal diferencial da Geny e a combinacao de **credito facilitado para todos os perfis** com **atendimento humanizado** e **entrega + instalacao gratuita**. Isso cria uma experiencia de compra que grandes redes nacionais nao conseguem replicar localmente.

### Segmentos

- Familias classe B e C (core: 68% do faturamento)
- Pequenos empreendedores (mercadinhos, barbearias, etc.)
- Construtoras e imobiliarias (B2B crescente)

### Recursos-Chave

1. Rede de 12 lojas com localizacao estrategica
2. Relacionamento de 35+ anos com comunidade local
3. Equipe de 280 colaboradores treinados
4. Parceria com 15 financeiras para oferta de credito

---

## Insights das Entrevistas

### Resumo do Diagnostico (Abr/2025)

Foram realizadas **8 entrevistas** com gestores e lideres da organizacao. Os principais temas identificados pela analise de Pareto sao:

- **Gestao de Processos** (29%) — falta de padronizacao operacional entre lojas
- **Comunicacao Interna** (21%) — silos de informacao entre areas
- **Tecnologia** (17%) — sistemas desatualizados limitam crescimento
- **Alinhamento Estrategico** (12%) — metas pouco claras para equipe operacional

### Citacoes Relevantes

> "Cada loja trabalha de um jeito diferente. Nao temos um processo padrao nem mesmo para entrada de pedidos." — Gerente de Operacoes

> "A comunicacao entre vendas e financeiro e muito falha. Recebo fechamentos com dados errados toda semana." — Coordenadora Financeira

### Oportunidades Identificadas

- Implementacao de playbook operacional unificado
- Adocao de CRM para gestao do relacionamento com clientes
- Reunioes semanais de alinhamento entre areas (formato Daily)

---

## Recomendacoes

### Prioritarias (0-90 dias)

1. **Mapeamento e padronizacao de processos criticos** — Iniciar pelos 5 processos com maior impacto operacional
2. **Implementar rituais de comunicacao** — Weekly por area + reuniao geral mensal
3. **Auditoria tecnologica** — Avaliar ERP atual e roadmap de modernizacao

### Medio Prazo (90-180 dias)

- Estruturar area de Business Intelligence com dados integrados
- Lanar programa de capacitacao da equipe (Geny Academy)
- Avaliar expansao para mais 3 cidades do interior

### Indicadores para Acompanhamento

| KPI | Meta | Prazo |
| Margem Bruta | 25% | Dez/2025 |
| Giro de Estoque | 35 dias | Set/2025 |
| NPS | > 70 | Jun/2025 |
| EBITDA | R$ 3,2M | Dez/2025 |
`

const MEMORIA_SIMPLES = `# Memoria do Cliente — Geny Eletrodomesticos

> Versao simplificada gerada automaticamente.

---

## Perfil da Empresa

**Geny Eletrodomesticos** — Rede de varejo com 12 lojas no interior da Paraiba, fundada em 1987.
Faturamento anual de R$ 42,8M com foco em credito facilitado e atendimento local.

## Principais Desafios

- Padronizacao de processos operacionais
- Modernizacao tecnologica
- Melhoria da comunicacao interna

## Proximos Passos

1. Mapear processos criticos
2. Implementar rituais de comunicacao
3. Avaliar solucao de BI integrada
`

const VERSOES = [
  { numero: 3, label: 'v3 — Atual (Abr/2025)', data: '03/04/2025' },
  { numero: 2, label: 'v2 — Jan/2025', data: '15/01/2025' },
  { numero: 1, label: 'v1 — Out/2024', data: '10/10/2024' },
]

export default function MemoriaClientePage() {
  const { clienteAtivo, isFiltered } = useClienteContext()
  const [versaoAtual, setVersaoAtual] = useState(VERSOES[0])
  const [conteudo, setConteudo] = useState(MEMORIA_DEMO)
  const [gerando, setGerando] = useState(false)

  function handleGerarMemoria() {
    setGerando(true)
    setTimeout(() => {
      setConteudo(MEMORIA_DEMO)
      const novaVersao = { numero: versaoAtual.numero + 1, label: `v${versaoAtual.numero + 1} — Atual (Abr/2025)`, data: '03/04/2025' }
      setVersaoAtual(novaVersao)
      setGerando(false)
    }, 1500)
  }

  function handleExportar() {
    const blob = new Blob([conteudo], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memoria-geny-v${versaoAtual.numero}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSelecionarVersao(versao: typeof VERSOES[0]) {
    setVersaoAtual(versao)
    setConteudo(versao.numero === 1 ? MEMORIA_SIMPLES : MEMORIA_DEMO)
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
          {/* Version selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 rounded-md border border-border bg-card text-muted-foreground hover:bg-secondary text-sm px-3 h-8 transition-colors"
            >
              <Clock size={13} />
              {versaoAtual.label}
              <ChevronDown size={12} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="border-border bg-card"
              align="end"
            >
              {VERSOES.map((v) => (
                <DropdownMenuItem
                  key={v.numero}
                  onClick={() => handleSelecionarVersao(v)}
                  className="text-foreground hover:bg-secondary cursor-pointer text-xs"
                >
                  <div>
                    <p>{v.label}</p>
                    <p className="text-muted-foreground/50">{v.data}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* Sections pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          'Perfil da Empresa',
          'Diagnostico Financeiro',
          'Canvas de Negocio',
          'Insights das Entrevistas',
          'Recomendacoes',
        ].map((secao) => (
          <button
            key={secao}
            onClick={() => {
              const id = secao.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-card transition-colors text-muted-foreground hover:text-foreground hover:border-primary/40"
          >
            {secao}
          </button>
        ))}
      </div>

      {/* Viewer */}
      <MemoriaViewer conteudo={conteudo} versao={versaoAtual.numero} />
    </div>
  )
}
