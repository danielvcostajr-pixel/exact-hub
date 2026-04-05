import type {
  HistoricoFaturamento,
  ProjecaoFaturamento,
  ConfigCenarios,
  CenarioTipo,
} from '@/types'

// ============================================
// Helpers
// ============================================

/**
 * Calcula a média dos últimos N meses do histórico (LTM = Last Twelve Months).
 * Retorna 0 se não houver dados.
 */
function calcularMediaLTM(historico: HistoricoFaturamento[], meses = 12): number {
  if (historico.length === 0) return 0

  const ordenado = [...historico].sort(
    (a, b) => b.ano * 12 + b.mes - (a.ano * 12 + a.mes)
  )
  const ltm = ordenado.slice(0, meses)
  const total = ltm.reduce((sum, h) => sum + h.valor, 0)
  return total / ltm.length
}

/**
 * Calcula fatores de sazonalidade por mês (1–12) a partir do histórico.
 * Fator = média do mês / média geral. Retorna array de 12 valores (índice 0 = Jan).
 * Se não houver dados suficientes, retorna todos os fatores como 1.
 */
function calcularFatoresSazonais(historico: HistoricoFaturamento[]): number[] {
  if (historico.length === 0) return new Array(12).fill(1)

  // Agrupar valores por mês (1–12)
  const porMes: Record<number, number[]> = {}
  for (const h of historico) {
    if (!porMes[h.mes]) porMes[h.mes] = []
    porMes[h.mes].push(h.valor)
  }

  const mediaGeral = historico.reduce((sum, h) => sum + h.valor, 0) / historico.length
  if (mediaGeral === 0) return new Array(12).fill(1)

  return Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const valores = porMes[mes] ?? []
    // Meses sem dados usam a média geral (fator = 1)
    if (valores.length === 0) return 1
    const mediaMes = valores.reduce((sum, v) => sum + v, 0) / valores.length
    return mediaMes / mediaGeral
  })
}

// ============================================
// gerarProjecaoCenarios
// Gera os 4 cenários de faturamento para 12 meses
// ============================================

export function gerarProjecaoCenarios(params: {
  historico: HistoricoFaturamento[]
  anoProjecao: number
  taxaCrescimentoBase: number  // % sobre LTM (cenário realista = base)
  cenarios: ConfigCenarios
}): ProjecaoFaturamento[] {
  const { historico, anoProjecao, taxaCrescimentoBase, cenarios } = params

  const mediaLTM = calcularMediaLTM(historico)
  const fatoresSazonais = calcularFatoresSazonais(historico)

  const projecoes: ProjecaoFaturamento[] = []

  for (let i = 0; i < 12; i++) {
    const mes = i + 1
    const fatorSazonal = fatoresSazonais[i]

    // Base: LTM * fatorSazonal * (1 + crescimentoBase/100)
    const base = mediaLTM * fatorSazonal * (1 + taxaCrescimentoBase / 100)

    // Cada cenário aplica seu delta percentual sobre a base realista
    // cenarios.realista = 0 (nenhum ajuste adicional)
    // cenarios.pessimista = ex: -14 → 14% abaixo do base
    // cenarios.otimista   = ex: +16 → 16% acima do base
    // cenarios.agressivo  = ex: +30 → 30% acima do base
    const valorRealista   = base * (1 + cenarios.realista   / 100)
    const valorPessimista = base * (1 + cenarios.pessimista / 100)
    const valorOtimista   = base * (1 + cenarios.otimista   / 100)
    const valorAgressivo  = base * (1 + cenarios.agressivo  / 100)

    projecoes.push({
      mes,
      ano: anoProjecao,
      valorPessimista,
      valorRealista,
      valorOtimista,
      valorAgressivo,
    })
  }

  return projecoes
}

// ============================================
// getFaturamentoCenario
// Extrai o array de 12 valores para o cenário selecionado
// ============================================

export function getFaturamentoCenario(
  projecoes: ProjecaoFaturamento[],
  cenario: CenarioTipo
): number[] {
  const sorted = [...projecoes].sort((a, b) => a.mes - b.mes)

  switch (cenario) {
    case 'pessimista':
      return sorted.map(p => p.valorPessimista)
    case 'realista':
      return sorted.map(p => p.valorRealista)
    case 'otimista':
      return sorted.map(p => p.valorOtimista)
    case 'agressivo':
      return sorted.map(p => p.valorAgressivo)
  }
}

// ============================================
// Legacy — mantido para compatibilidade com página existente
// ============================================

export function gerarProjecaoCenariosLegacy(params: {
  historico: HistoricoFaturamento[]
  anoProjecao: number
  crescimentoOtimista: number
  crescimentoRealista: number
  crescimentoPessimista: number
  sazonalidade?: number[]
}): ProjecaoFaturamento[] {
  const {
    historico,
    anoProjecao,
    crescimentoOtimista,
    crescimentoRealista,
    crescimentoPessimista,
    sazonalidade,
  } = params

  const mediaBase = calcularMediaLTM(historico)
  const fatoresSazonais = sazonalidade ?? calcularFatoresSazonais(historico)

  return Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const fatorSazonal = fatoresSazonais[i] ?? 1
    const base = mediaBase * fatorSazonal

    return {
      mes,
      ano: anoProjecao,
      valorPessimista: base * (1 + crescimentoPessimista / 100),
      valorRealista:   base * (1 + crescimentoRealista   / 100),
      valorOtimista:   base * (1 + crescimentoOtimista   / 100),
      valorAgressivo:  base * (1 + crescimentoOtimista   / 100), // fallback: igual ao otimista
    }
  })
}

/**
 * Retro-compatibilidade: a página existente chama gerarFaturamentoMensal
 * com 'otimista' | 'realista' | 'pessimista'.
 */
export function gerarFaturamentoMensal(
  projecoes: ProjecaoFaturamento[],
  cenario: 'otimista' | 'realista' | 'pessimista'
): number[] {
  const sorted = [...projecoes].sort((a, b) => a.mes - b.mes)
  switch (cenario) {
    case 'otimista':
      return sorted.map(p => p.valorOtimista)
    case 'realista':
      return sorted.map(p => p.valorRealista)
    case 'pessimista':
      return sorted.map(p => p.valorPessimista)
  }
}
