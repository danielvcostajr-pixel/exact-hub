import type {
  CondicoesRecebimento,
  CondicoesPagamento,
  ProjecaoFinanceiraCompleta,
  ResultadoProfecia,
  KPIsProfecia,
  LinhaDRE,
  LinhaProfecia,
  GastoFixo,
  GastoVariavel,
  ItemInvestimento,
  ItemFinanciamento,
  DespesasCompletas,
} from '@/types'

// ============================================
// Formatacao
// ============================================

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(valor)
}

export function formatarPercentual(valor: number): string {
  return `${valor.toFixed(1)}%`
}

export const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

// ============================================
// Helpers internos
// ============================================

function zeros(): number[] {
  return new Array(12).fill(0)
}

function soma(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

function somaAcumulada(arr: number[]): number[] {
  const acc: number[] = []
  let running = 0
  for (const v of arr) {
    running += v
    acc.push(running)
  }
  return acc
}

// ============================================
// getValorFixoNoMes - valor de gasto fixo considerando reajustes
// ============================================

export function getValorFixoNoMes(gasto: GastoFixo, mes: number): number {
  if (!gasto.reajustes || gasto.reajustes.length === 0) return gasto.valor
  const sorted = [...gasto.reajustes].sort((a, b) => b.mesInicio - a.mesInicio)
  const aplicavel = sorted.find(r => mes >= r.mesInicio)
  return aplicavel ? aplicavel.novoValor : gasto.valor
}

// ============================================
// valorPorMesFinanciamento - distribui financiamentos incluindo recorrentes
// ============================================

function valorPorMesFinanciamento(items: ItemFinanciamento[]): number[] {
  const arr = zeros()
  for (const item of items) {
    if (item.recorrente && item.meses && item.meses.length > 0) {
      for (const m of item.meses) {
        if (m >= 0 && m < 12) {
          arr[m] += item.valor
        }
      }
    } else {
      if (item.mes >= 0 && item.mes < 12) {
        arr[item.mes] += item.valor
      }
    }
  }
  return arr
}

// ============================================
// gerarGradeRecebimentos
// PMR: distribui faturamento de cada mês nos meses de recebimento
// ============================================

export function gerarGradeRecebimentos(params: {
  faturamentoMensal: number[]
  condicoesRecebimento: CondicoesRecebimento
}): number[] {
  const { faturamentoMensal, condicoesRecebimento } = params
  const {
    percentualAVista,
    percentualAPrazo,
    distribuicaoParcelas,
    antecipaRecebiveis,
    percentualAntecipacao,
    taxaDesconto,
  } = condicoesRecebimento

  // Buffer de 18 posições para recebimentos que podem cair além do mês 11
  const buffer = new Array(18).fill(0)

  const fracAVista = percentualAVista / 100
  const fracAPrazo = percentualAPrazo / 100

  for (let m = 0; m < 12; m++) {
    const fat = faturamentoMensal[m] ?? 0

    // Parcela à vista cai no mesmo mês
    buffer[m] += fat * fracAVista

    // Parcelas a prazo distribuídas conforme distribuicaoParcelas
    const vendasAPrazo = fat * fracAPrazo

    for (const config of distribuicaoParcelas) {
      const { qtdParcelas, percentual } = config
      if (qtdParcelas <= 0 || percentual <= 0) continue

      const valorTotal = vendasAPrazo * (percentual / 100)
      const valorPorParcela = valorTotal / qtdParcelas

      if (antecipaRecebiveis && percentualAntecipacao > 0) {
        // Antecipação: traz todas as parcelas futuras para o mês atual
        // aplicando desconto sobre o valor antecipado
        const fracAntecipa = percentualAntecipacao / 100
        const desconto = taxaDesconto / 100

        // Parcelas que seriam recebidas nos meses m+1..m+qtdParcelas-1 são antecipadas
        // A parcela do próprio mês (m) entra normalmente sem desconto
        // As demais (antecipadas) entram com o fator de desconto
        for (let p = 0; p < qtdParcelas; p++) {
          const mesParcela = m + p
          if (p === 0) {
            // Primeira parcela: já cai no mês corrente, não há antecipação
            buffer[mesParcela] += valorPorParcela
          } else {
            // Parcelas futuras: fracAntecipa é antecipada com desconto, resto no vencimento
            const antecipado = valorPorParcela * fracAntecipa * (1 - desconto)
            const naoAntecipado = valorPorParcela * (1 - fracAntecipa)
            buffer[m] += antecipado           // antecipado cai no mês da venda
            if (mesParcela < 18) {
              buffer[mesParcela] += naoAntecipado
            }
          }
        }
      } else {
        // Sem antecipação: cada parcela cai no mês correspondente
        for (let p = 0; p < qtdParcelas; p++) {
          const mesParcela = m + p
          if (mesParcela < 18) {
            buffer[mesParcela] += valorPorParcela
          }
        }
      }
    }
  }

  // Retorna apenas os 12 meses do período projetado
  return buffer.slice(0, 12)
}

// ============================================
// gerarGradePagamentos
// PMP: distribui compras/CMV nos meses de pagamento
// ============================================

export function gerarGradePagamentos(params: {
  comprasMensais: number[]
  condicoesPagamento: CondicoesPagamento
}): number[] {
  const { comprasMensais, condicoesPagamento } = params
  const { percentualAVista, percentualAPrazo, distribuicaoParcelas } = condicoesPagamento

  const buffer = new Array(18).fill(0)

  const fracAVista = percentualAVista / 100
  const fracAPrazo = percentualAPrazo / 100

  for (let m = 0; m < 12; m++) {
    const compra = comprasMensais[m] ?? 0

    // À vista: paga no mesmo mês
    buffer[m] += compra * fracAVista

    // A prazo: distribui conforme distribuicaoParcelas
    const comprasAPrazo = compra * fracAPrazo

    for (const config of distribuicaoParcelas) {
      const { qtdParcelas, percentual } = config
      if (qtdParcelas <= 0 || percentual <= 0) continue

      const valorTotal = comprasAPrazo * (percentual / 100)
      const valorPorParcela = valorTotal / qtdParcelas

      for (let p = 0; p < qtdParcelas; p++) {
        const mesPagamento = m + p
        if (mesPagamento < 18) {
          buffer[mesPagamento] += valorPorParcela
        }
      }
    }
  }

  return buffer.slice(0, 12)
}

// ============================================
// gerarResultadoProfecia
// Estrutura completa de Fluxo de Caixa PROFECIA
// ============================================

export function gerarResultadoProfecia(params: {
  projecao: ProjecaoFinanceiraCompleta
  faturamentoMensal: number[]
}): ResultadoProfecia {
  const { projecao, faturamentoMensal } = params
  const {
    saldoInicial: saldoInicialParam,
    despesas,
    investimentos,
    financiamentos,
    contasReceber,
    contasPagar,
    condicoesRecebimento,
    condicoesPagamento,
  } = projecao

  // ---- Helpers para agrupar por mês ----
  function valorPorMes<T extends { mes: number; valor: number }>(items: T[]): number[] {
    const arr = zeros()
    for (const item of items) {
      if (item.mes >= 0 && item.mes < 12) {
        arr[item.mes] += item.valor
      }
    }
    return arr
  }

  // ---- Gastos variáveis por categoria ----
  function somaPorCategoria(variaveis: GastoVariavel[], categoria: string): number[] {
    const perc = variaveis
      .filter(g => g.categoria === categoria)
      .reduce((sum, g) => sum + g.percentual, 0) / 100
    return faturamentoMensal.map(fat => fat * perc)
  }

  // ---- Gastos fixos por categoria (com reajustes mensais) ----
  function fixosPorCategoria(fixos: GastoFixo[], categoria: string): number[] {
    const catFixos = fixos.filter(g => g.categoria === categoria)
    const arr: number[] = []
    for (let m = 0; m < 12; m++) {
      arr.push(catFixos.reduce((sum, g) => sum + getValorFixoNoMes(g, m), 0))
    }
    return arr
  }

  // ============================================================
  // SEÇÃO 1 — OPERACIONAL
  // ============================================================

  // CMV para gerar grade de pagamentos
  const percCMV = despesas.variaveis
    .filter(g => g.categoria === 'cmv')
    .reduce((sum, g) => sum + g.percentual, 0) / 100

  const comprasMensais = faturamentoMensal.map(fat => fat * percCMV)

  // Grade de recebimentos (novas vendas)
  const receitasNovasVendas = gerarGradeRecebimentos({
    faturamentoMensal,
    condicoesRecebimento,
  })

  // Contas a receber existentes (CAR): cada entrada no mês de vencimento
  const contasReceberMes = valorPorMes(contasReceber)

  // Outras entradas: gastos variáveis categoria 'outras_entradas' não existe nos tipos,
  // mas seguindo a estrutura de ResultadoProfecia, outrasEntradas fica zerado
  // (pode ser alimentado por extensão futura)
  const outrasEntradas = zeros()

  // Entradas operacionais totais
  const entradasOperacionais = receitasNovasVendas.map(
    (v, i) => v + contasReceberMes[i] + outrasEntradas[i]
  )

  // Saídas variáveis por sub-categoria
  const impostos = somaPorCategoria(despesas.variaveis, 'impostos')
  const custosVendas = somaPorCategoria(despesas.variaveis, 'comissoes')
  const custosTransacoes = somaPorCategoria(despesas.variaveis, 'transacoes')
  const cmvNovasCompras = gerarGradePagamentos({ comprasMensais, condicoesPagamento })
  const outrosCustosVariaveis = somaPorCategoria(despesas.variaveis, 'outros')

  // Contas a pagar existentes (CAP)
  const contasPagarMes = valorPorMes(contasPagar)

  // Saídas variáveis totais
  const saidasVariaveis = impostos.map(
    (v, i) =>
      v +
      custosVendas[i] +
      custosTransacoes[i] +
      cmvNovasCompras[i] +
      outrosCustosVariaveis[i] +
      contasPagarMes[i]
  )

  // Margem de Contribuição Financeira
  const margemContribuicao = entradasOperacionais.map((v, i) => v - saidasVariaveis[i])

  // Saídas fixas por categoria
  const despPessoal = fixosPorCategoria(despesas.fixos, 'pessoal')
  const despDiretoria = fixosPorCategoria(despesas.fixos, 'diretoria')
  const despComercial = fixosPorCategoria(despesas.fixos, 'comercial')
  const despAdministrativo = fixosPorCategoria(despesas.fixos, 'administrativo')
  const despFinanceiro = fixosPorCategoria(despesas.fixos, 'financeiro')
  const despTributarias = fixosPorCategoria(despesas.fixos, 'tributarias')

  const saidasFixas = despPessoal.map(
    (v, i) =>
      v +
      despDiretoria[i] +
      despComercial[i] +
      despAdministrativo[i] +
      despFinanceiro[i] +
      despTributarias[i]
  )

  const fdcOperacional = margemContribuicao.map((v, i) => v - saidasFixas[i])

  // ============================================================
  // SEÇÃO 2 — INVESTIMENTOS
  // ============================================================

  const vendaAtivos = valorPorMes(
    investimentos.filter((inv): inv is ItemInvestimento & { tipo: 'venda_ativos' } =>
      inv.tipo === 'venda_ativos'
    )
  )

  const receitasFinanceiras = valorPorMes(
    investimentos.filter((inv): inv is ItemInvestimento & { tipo: 'receita_financeira' } =>
      inv.tipo === 'receita_financeira'
    )
  )

  const investimentosCapex = valorPorMes(
    investimentos.filter((inv): inv is ItemInvestimento & { tipo: 'investimento_capex' } =>
      inv.tipo === 'investimento_capex'
    )
  )

  const fdcInvestimentos = vendaAtivos.map(
    (v, i) => v + receitasFinanceiras[i] - investimentosCapex[i]
  )

  // ============================================================
  // SEÇÃO 3 — FINANCIAMENTOS
  // ============================================================

  const captacaoRecursos = valorPorMesFinanciamento(
    financiamentos.filter(f => f.tipo === 'captacao')
  )

  const aportes = valorPorMesFinanciamento(
    financiamentos.filter(f => f.tipo === 'aporte')
  )

  const distribuicoes = valorPorMesFinanciamento(
    financiamentos.filter(f => f.tipo === 'distribuicao')
  )

  const amortizacoes = valorPorMesFinanciamento(
    financiamentos.filter(f => f.tipo === 'amortizacao')
  )

  const capitalTerceiros = valorPorMesFinanciamento(
    financiamentos.filter(f => f.tipo === 'capital_terceiros')
  )

  const acordos = valorPorMesFinanciamento(
    financiamentos.filter(f => f.tipo === 'acordo')
  )

  const fdcFinanciamentos = captacaoRecursos.map(
    (v, i) =>
      v +
      aportes[i] -
      distribuicoes[i] -
      amortizacoes[i] -
      capitalTerceiros[i] -
      acordos[i]
  )

  // ============================================================
  // TOTAIS E SALDO
  // ============================================================

  const totalEntradas = entradasOperacionais.map(
    (v, i) =>
      v +
      vendaAtivos[i] +
      receitasFinanceiras[i] +
      captacaoRecursos[i] +
      aportes[i]
  )

  const totalSaidas = saidasVariaveis.map(
    (v, i) =>
      v +
      saidasFixas[i] +
      investimentosCapex[i] +
      distribuicoes[i] +
      amortizacoes[i] +
      capitalTerceiros[i] +
      acordos[i]
  )

  const geracaoCaixa = totalEntradas.map((v, i) => v - totalSaidas[i])

  // Saldo inicial: mês 0 = param, meses seguintes = saldoFinal anterior
  const saldoInicialArr = zeros()
  const saldoFinalArr = zeros()

  saldoInicialArr[0] = saldoInicialParam
  saldoFinalArr[0] = saldoInicialParam + geracaoCaixa[0]

  for (let m = 1; m < 12; m++) {
    saldoInicialArr[m] = saldoFinalArr[m - 1]
    saldoFinalArr[m] = saldoInicialArr[m] + geracaoCaixa[m]
  }

  const geracaoAcumulada = somaAcumulada(geracaoCaixa)

  return {
    // Operacional
    entradasOperacionais,
    receitasNovasVendas,
    contasReceberMes,
    outrasEntradas,

    saidasVariaveis,
    impostos,
    custosVendas,
    custosTransacoes,
    cmvNovasCompras,
    outrosCustosVariaveis,
    contasPagarMes,

    margemContribuicao,

    saidasFixas,
    despPessoal,
    despDiretoria,
    despComercial,
    despAdministrativo,
    despFinanceiro,
    despTributarias,

    fdcOperacional,

    // Investimentos
    vendaAtivos,
    receitasFinanceiras,
    investimentosCapex,
    fdcInvestimentos,

    // Financiamentos
    captacaoRecursos,
    aportes,
    distribuicoes,
    amortizacoes,
    capitalTerceiros,
    acordos,
    fdcFinanciamentos,

    // Totais
    totalEntradas,
    totalSaidas,
    saldoInicial: saldoInicialArr,
    geracaoCaixa,
    saldoFinal: saldoFinalArr,
    geracaoAcumulada,
  }
}

// ============================================
// calcularKPIs
// ============================================

export function calcularKPIs(params: {
  resultado: ResultadoProfecia
  faturamentoMensal: number[]
  metaPERS: number
  metaPEPerc: number
}): KPIsProfecia {
  const { resultado, faturamentoMensal, metaPERS, metaPEPerc } = params

  function percDeFat(arr: number[]): number[] {
    return arr.map((v, i) => {
      const fat = faturamentoMensal[i] ?? 0
      return fat > 0 ? (v / fat) * 100 : 0
    })
  }

  // Ponto de Equilíbrio: PE(R$) = saídasFixas / (margemContrib / faturamento)
  const pontoEquilibrioRS = resultado.saidasFixas.map((fixas, i) => {
    const fat = faturamentoMensal[i] ?? 0
    const mc = resultado.margemContribuicao[i]
    const indiceContrib = fat > 0 ? mc / fat : 0
    return indiceContrib > 0 ? fixas / indiceContrib : 0
  })

  return {
    impostosTotaisPerc: percDeFat(resultado.impostos),
    saidasVariaveisPerc: percDeFat(resultado.saidasVariaveis),
    margemContribuicaoPerc: percDeFat(resultado.margemContribuicao),
    pontoEquilibrioRS,
    fdcOperacionalPerc: percDeFat(resultado.fdcOperacional),
    fdcInvestimentosPerc: percDeFat(resultado.fdcInvestimentos),
    fdcFinanciamentosPerc: percDeFat(resultado.fdcFinanciamentos),
    geracaoCaixaPerc: percDeFat(resultado.geracaoCaixa),
    exposicaoMaximaCaixa: Math.min(...resultado.saldoFinal),
    metaPERS: new Array(12).fill(metaPERS),
    metaPEPerc: new Array(12).fill(metaPEPerc),
  }
}

// ============================================
// gerarDRECompleto
// ============================================

export function gerarDRECompleto(params: {
  faturamentoMensal: number[]
  despesas: DespesasCompletas
  resultado: ResultadoProfecia
  aliquotaIR?: number
}): LinhaDRE[] {
  const { faturamentoMensal, despesas, resultado, aliquotaIR = 0 } = params

  const linhas: LinhaDRE[] = []

  // Receita Bruta
  const receitaBruta = [...faturamentoMensal]
  linhas.push({
    label: 'Receita Bruta',
    valores: receitaBruta,
    total: soma(receitaBruta),
    destaque: true,
    tipo: 'receita',
  })

  // (-) Deduções = impostos
  const deducoes = resultado.impostos
  linhas.push({
    label: '(-) Deducoes / Impostos s/ Receita',
    valores: deducoes,
    total: soma(deducoes),
    indentacao: 1,
    tipo: 'deducao',
  })

  // = Receita Líquida
  const receitaLiquida = receitaBruta.map((v, i) => v - deducoes[i])
  linhas.push({
    label: '= Receita Liquida',
    valores: receitaLiquida,
    total: soma(receitaLiquida),
    destaque: true,
    tipo: 'resultado',
  })

  // (-) Custos Variáveis: CMV + comissões + transações
  const percCMV = despesas.variaveis
    .filter(g => g.categoria === 'cmv')
    .reduce((sum, g) => sum + g.percentual, 0) / 100

  const cmv = faturamentoMensal.map(fat => fat * percCMV)

  linhas.push({
    label: '(-) CMV / CPV',
    valores: cmv,
    total: soma(cmv),
    indentacao: 1,
    tipo: 'deducao',
  })

  linhas.push({
    label: '(-) Custos de Vendas / Comissoes',
    valores: resultado.custosVendas,
    total: soma(resultado.custosVendas),
    indentacao: 1,
    tipo: 'deducao',
  })

  linhas.push({
    label: '(-) Custos de Transacoes',
    valores: resultado.custosTransacoes,
    total: soma(resultado.custosTransacoes),
    indentacao: 1,
    tipo: 'deducao',
  })

  // Outros custos variáveis
  const percOutros = despesas.variaveis
    .filter(g => g.categoria === 'outros')
    .reduce((sum, g) => sum + g.percentual, 0) / 100
  const outrosVar = faturamentoMensal.map(fat => fat * percOutros)
  if (soma(outrosVar) !== 0) {
    linhas.push({
      label: '(-) Outros Custos Variaveis',
      valores: outrosVar,
      total: soma(outrosVar),
      indentacao: 1,
      tipo: 'deducao',
    })
  }

  // = Resultado Bruto / Margem de Contribuição
  const custosVariaveisTotal = cmv.map(
    (v, i) => v + resultado.custosVendas[i] + resultado.custosTransacoes[i] + outrosVar[i]
  )
  const resultadoBruto = receitaLiquida.map((v, i) => v - custosVariaveisTotal[i])
  linhas.push({
    label: '= Resultado Bruto / Margem de Contribuicao',
    valores: resultadoBruto,
    total: soma(resultadoBruto),
    destaque: true,
    tipo: 'resultado',
  })

  // (-) Despesas Fixas por categoria
  const fixas: Array<{ label: string; categoria: string }> = [
    { label: '(-) Despesas de Pessoal', categoria: 'pessoal' },
    { label: '(-) Pro-labore / Diretoria', categoria: 'diretoria' },
    { label: '(-) Despesas Comerciais', categoria: 'comercial' },
    { label: '(-) Despesas Administrativas', categoria: 'administrativo' },
    { label: '(-) Despesas Financeiras', categoria: 'financeiro' },
    { label: '(-) Despesas Tributarias Fixas', categoria: 'tributarias' },
  ]

  for (const { label, categoria } of fixas) {
    const catFixos = despesas.fixos.filter(g => g.categoria === categoria)
    const valores: number[] = []
    for (let m = 0; m < 12; m++) {
      valores.push(catFixos.reduce((sum, g) => sum + getValorFixoNoMes(g, m), 0))
    }
    if (soma(valores) !== 0) {
      linhas.push({
        label,
        valores,
        total: soma(valores),
        indentacao: 1,
        tipo: 'deducao',
      })
    }
  }

  // = EBITDA
  const totalFixasMensal: number[] = []
  for (let m = 0; m < 12; m++) {
    totalFixasMensal.push(despesas.fixos.reduce((sum, g) => sum + getValorFixoNoMes(g, m), 0))
  }
  const ebitda = resultadoBruto.map((v, i) => v - totalFixasMensal[i])
  linhas.push({
    label: '= EBITDA',
    valores: ebitda,
    total: soma(ebitda),
    destaque: true,
    tipo: 'resultado',
  })

  // (+/-) Resultado Não Operacional (venda de ativos - investimentos CAPEX)
  const resultNaoOperacional = resultado.vendaAtivos.map(
    (v, i) => v - resultado.investimentosCapex[i]
  )
  linhas.push({
    label: '(+/-) Resultado Nao Operacional',
    valores: resultNaoOperacional,
    total: soma(resultNaoOperacional),
    indentacao: 1,
    tipo: 'resultado',
  })

  // (+/-) Resultado Financeiro (receitas financeiras - captação líquida)
  const resultFinanceiro = resultado.receitasFinanceiras.map(
    (v, i) =>
      v +
      resultado.captacaoRecursos[i] +
      resultado.aportes[i] -
      resultado.amortizacoes[i] -
      resultado.capitalTerceiros[i]
  )
  linhas.push({
    label: '(+/-) Resultado Financeiro',
    valores: resultFinanceiro,
    total: soma(resultFinanceiro),
    indentacao: 1,
    tipo: 'resultado',
  })

  // = LAIR
  const lair = ebitda.map((v, i) => v + resultNaoOperacional[i] + resultFinanceiro[i])
  linhas.push({
    label: '= LAIR (Lucro Antes do IR)',
    valores: lair,
    total: soma(lair),
    destaque: true,
    tipo: 'resultado',
  })

  // (-) IR/CSLL (somente se LAIR > 0)
  if (aliquotaIR > 0) {
    const irCsll = lair.map(v => (v > 0 ? v * (aliquotaIR / 100) : 0))
    linhas.push({
      label: `(-) IR/CSLL (${aliquotaIR}%)`,
      valores: irCsll,
      total: soma(irCsll),
      indentacao: 1,
      tipo: 'deducao',
    })

    const resultadoLiquido = lair.map((v, i) => v - irCsll[i])
    linhas.push({
      label: '= Resultado Liquido',
      valores: resultadoLiquido,
      total: soma(resultadoLiquido),
      destaque: true,
      tipo: 'resultado',
    })

    // = Resultado Após Invest/Financ (= FDC total)
    const resultadoAposIF = resultadoLiquido.map(
      (v, i) => v + resultado.fdcInvestimentos[i] + resultado.fdcFinanciamentos[i]
    )
    linhas.push({
      label: '= Resultado Apos Invest. / Financ.',
      valores: resultadoAposIF,
      total: soma(resultadoAposIF),
      destaque: true,
      tipo: 'resultado',
    })
  } else {
    // Sem IR: LAIR = Resultado Líquido
    linhas.push({
      label: '= Resultado Liquido',
      valores: lair,
      total: soma(lair),
      destaque: true,
      tipo: 'resultado',
    })

    const resultadoAposIF = lair.map(
      (v, i) => v + resultado.fdcInvestimentos[i] + resultado.fdcFinanciamentos[i]
    )
    linhas.push({
      label: '= Resultado Apos Invest. / Financ.',
      valores: resultadoAposIF,
      total: soma(resultadoAposIF),
      destaque: true,
      tipo: 'resultado',
    })
  }

  // ============================================================
  // INDICADORES (KPIs)
  // ============================================================

  // Separator / header
  linhas.push({
    label: 'INDICADORES',
    valores: zeros(),
    total: 0,
    destaque: true,
    tipo: 'kpi',
  })

  // Margem de Contribuicao (%) = (Receita Liquida - Custos Variaveis) / Receita Bruta * 100
  const margemContribPerc = receitaBruta.map((rb, i) => {
    return rb > 0 ? ((receitaLiquida[i] - custosVariaveisTotal[i]) / rb) * 100 : 0
  })
  const avgMCPerc = soma(receitaBruta) > 0
    ? ((soma(receitaLiquida) - soma(custosVariaveisTotal)) / soma(receitaBruta)) * 100
    : 0
  linhas.push({
    label: 'Margem Contribuicao (%)',
    valores: margemContribPerc,
    total: avgMCPerc,
    tipo: 'kpi',
    indentacao: 1,
  })

  // Ponto de Equilibrio (R$) = Despesas Fixas / (Margem Contribuicao % / 100)
  const pontoEquilibrio = margemContribPerc.map((mc, i) => {
    return mc > 0 ? totalFixasMensal[i] / (mc / 100) : 0
  })
  linhas.push({
    label: 'Ponto de Equilibrio (R$)',
    valores: pontoEquilibrio,
    total: soma(pontoEquilibrio),
    tipo: 'kpi',
    indentacao: 1,
  })

  // EBITDA (%) = EBITDA / Receita Bruta * 100
  const ebitdaPerc = receitaBruta.map((rb, i) => {
    return rb > 0 ? (ebitda[i] / rb) * 100 : 0
  })
  const avgEbitdaPerc = soma(receitaBruta) > 0 ? (soma(ebitda) / soma(receitaBruta)) * 100 : 0
  linhas.push({
    label: 'EBITDA (%)',
    valores: ebitdaPerc,
    total: avgEbitdaPerc,
    tipo: 'kpi',
    indentacao: 1,
  })

  // Margem Liquida (%) = Resultado Liquido / Receita Bruta * 100
  const margemLiqPerc = receitaBruta.map((rb, i) => {
    return rb > 0 ? (lair[i] / rb) * 100 : 0
  })
  const avgMLPerc = soma(receitaBruta) > 0 ? (soma(lair) / soma(receitaBruta)) * 100 : 0
  linhas.push({
    label: 'Margem Liquida (%)',
    valores: margemLiqPerc,
    total: avgMLPerc,
    tipo: 'kpi',
    indentacao: 1,
  })

  return linhas
}

// ============================================
// gerarLinhasProfecia
// Converte ResultadoProfecia em LinhaProfecia[] para tabela
// ============================================

export function gerarLinhasProfecia(resultado: ResultadoProfecia): LinhaProfecia[] {
  const L = (
    label: string,
    valores: number[],
    tipo: LinhaProfecia['tipo'],
    indentacao = 0,
    destaque = false
  ): LinhaProfecia => ({
    label,
    valores,
    total: valores.reduce((a, b) => a + b, 0),
    tipo,
    indentacao,
    destaque,
  })

  return [
    // ── OPERACIONAL ──────────────────────────────────────
    L('ENTRADAS OPERACIONAIS', resultado.entradasOperacionais, 'entrada', 0, true),
    L('(+) Receitas Novas Vendas', resultado.receitasNovasVendas, 'entrada', 1),
    L('(+) Contas a Receber Existentes', resultado.contasReceberMes, 'entrada', 1),
    L('(+) Outras Entradas', resultado.outrasEntradas, 'entrada', 1),

    L('(-) SAIDAS VARIAVEIS', resultado.saidasVariaveis, 'saida', 0, true),
    L('(-) Impostos / Tributos s/ Vendas', resultado.impostos, 'saida', 1),
    L('(-) Custos de Vendas / Comissoes', resultado.custosVendas, 'saida', 1),
    L('(-) Custos de Transacoes', resultado.custosTransacoes, 'saida', 1),
    L('(-) CMV / CPV (Novas Compras)', resultado.cmvNovasCompras, 'saida', 1),
    L('(-) Outros Custos Variaveis', resultado.outrosCustosVariaveis, 'saida', 1),
    L('(-) Contas a Pagar Existentes', resultado.contasPagarMes, 'saida', 1),

    L('= MARGEM DE CONTRIBUICAO FINANCEIRA', resultado.margemContribuicao, 'resultado', 0, true),

    L('(-) SAIDAS FIXAS', resultado.saidasFixas, 'saida', 0, true),
    L('(-) Pessoal / CLT / Beneficios', resultado.despPessoal, 'saida', 1),
    L('(-) Pro-labore / Diretoria', resultado.despDiretoria, 'saida', 1),
    L('(-) Comercial / Marketing', resultado.despComercial, 'saida', 1),
    L('(-) Administrativo', resultado.despAdministrativo, 'saida', 1),
    L('(-) Financeiro', resultado.despFinanceiro, 'saida', 1),
    L('(-) Tributarias Fixas', resultado.despTributarias, 'saida', 1),

    L('= FDC OPERACIONAL', resultado.fdcOperacional, 'resultado', 0, true),

    // ── INVESTIMENTOS ─────────────────────────────────────
    L('INVESTIMENTOS', resultado.fdcInvestimentos, 'resultado', 0, true),
    L('(+) Venda de Ativos', resultado.vendaAtivos, 'entrada', 1),
    L('(+) Receitas Financeiras', resultado.receitasFinanceiras, 'entrada', 1),
    L('(-) Investimentos CAPEX', resultado.investimentosCapex, 'saida', 1),
    L('= FDC INVESTIMENTOS', resultado.fdcInvestimentos, 'resultado', 0, true),

    // ── FINANCIAMENTOS ────────────────────────────────────
    L('FINANCIAMENTOS', resultado.fdcFinanciamentos, 'resultado', 0, true),
    L('(+) Captacao de Recursos', resultado.captacaoRecursos, 'entrada', 1),
    L('(+) Aportes de Capital', resultado.aportes, 'entrada', 1),
    L('(-) Distribuicoes / Dividendos', resultado.distribuicoes, 'saida', 1),
    L('(-) Amortizacoes', resultado.amortizacoes, 'saida', 1),
    L('(-) Capital de Terceiros', resultado.capitalTerceiros, 'saida', 1),
    L('(-) Acordos / Parcelamentos', resultado.acordos, 'saida', 1),
    L('= FDC FINANCIAMENTOS', resultado.fdcFinanciamentos, 'resultado', 0, true),

    // ── TOTAIS / SALDO ────────────────────────────────────
    L('(=) TOTAL ENTRADAS', resultado.totalEntradas, 'entrada', 0, true),
    L('(=) TOTAL SAIDAS', resultado.totalSaidas, 'saida', 0, true),
    L('SALDO INICIAL', resultado.saldoInicial, 'saldo', 0, true),
    L('GERACAO DE CAIXA', resultado.geracaoCaixa, 'resultado', 0, true),
    L('SALDO FINAL', resultado.saldoFinal, 'saldo', 0, true),
    L('GERACAO ACUMULADA', resultado.geracaoAcumulada, 'resultado', 0, false),
  ]
}

// ============================================
// Legacy — mantidos para compatibilidade com módulos existentes
// ============================================

export interface ParcelaFinanciamentoLegacy {
  numero: number
  amortizacao: number
  juros: number
  prestacao: number
  saldoDevedor: number
}

export interface FinanciamentoLegacy {
  valor: number
  taxa: number
  prazo: number
  carencia: number
  tipo: 'SAC' | 'PRICE' | 'BULLET'
}

export function calcularParcelasSAC(financiamento: FinanciamentoLegacy): ParcelaFinanciamentoLegacy[] {
  const { valor, taxa, prazo, carencia } = financiamento
  const taxaMensal = taxa / 100 / 12
  const amortizacaoConstante = valor / prazo
  const parcelas: ParcelaFinanciamentoLegacy[] = []
  let saldo = valor

  for (let i = 1; i <= prazo + carencia; i++) {
    if (i <= carencia) {
      const juros = saldo * taxaMensal
      parcelas.push({ numero: i, amortizacao: 0, juros, prestacao: juros, saldoDevedor: saldo })
    } else {
      const juros = saldo * taxaMensal
      saldo -= amortizacaoConstante
      parcelas.push({
        numero: i,
        amortizacao: amortizacaoConstante,
        juros,
        prestacao: amortizacaoConstante + juros,
        saldoDevedor: Math.max(0, saldo),
      })
    }
  }
  return parcelas
}

export function calcularParcelasPRICE(financiamento: FinanciamentoLegacy): ParcelaFinanciamentoLegacy[] {
  const { valor, taxa, prazo, carencia } = financiamento
  const taxaMensal = taxa / 100 / 12
  const parcelas: ParcelaFinanciamentoLegacy[] = []
  let saldo = valor

  for (let i = 1; i <= carencia; i++) {
    const juros = saldo * taxaMensal
    parcelas.push({ numero: i, amortizacao: 0, juros, prestacao: juros, saldoDevedor: saldo })
  }

  const prestacaoFixa =
    valor * ((taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1))

  for (let i = carencia + 1; i <= prazo + carencia; i++) {
    const juros = saldo * taxaMensal
    const amortizacao = prestacaoFixa - juros
    saldo -= amortizacao
    parcelas.push({
      numero: i,
      amortizacao,
      juros,
      prestacao: prestacaoFixa,
      saldoDevedor: Math.max(0, saldo),
    })
  }
  return parcelas
}

export function calcularParcelasBULLET(financiamento: FinanciamentoLegacy): ParcelaFinanciamentoLegacy[] {
  const { valor, taxa, prazo, carencia } = financiamento
  const taxaMensal = taxa / 100 / 12
  const parcelas: ParcelaFinanciamentoLegacy[] = []
  const totalPeriodos = prazo + carencia

  for (let i = 1; i <= totalPeriodos; i++) {
    const juros = valor * taxaMensal
    const isUltima = i === totalPeriodos
    parcelas.push({
      numero: i,
      amortizacao: isUltima ? valor : 0,
      juros,
      prestacao: isUltima ? valor + juros : juros,
      saldoDevedor: isUltima ? 0 : valor,
    })
  }
  return parcelas
}

export function calcularParcelas(financiamento: FinanciamentoLegacy): ParcelaFinanciamentoLegacy[] {
  switch (financiamento.tipo) {
    case 'SAC':
      return calcularParcelasSAC(financiamento)
    case 'PRICE':
      return calcularParcelasPRICE(financiamento)
    case 'BULLET':
      return calcularParcelasBULLET(financiamento)
  }
}

export function gerarDRE(params: {
  faturamentoMensal: number[]
  aliquotaDeducoes: number
  cmvPercentual: number
  custosFixosMensais: number
  custosVariaveisPercentual: number
  depreciacaoMensal: number
  resultadoFinanceiroMensal: number
  aliquotaIR: number
}): LinhaDRE[] {
  const {
    faturamentoMensal,
    aliquotaDeducoes,
    cmvPercentual,
    custosFixosMensais,
    custosVariaveisPercentual,
    depreciacaoMensal,
    resultadoFinanceiroMensal,
    aliquotaIR,
  } = params

  const receitaBruta = faturamentoMensal
  const deducoes = receitaBruta.map(v => v * (aliquotaDeducoes / 100))
  const receitaLiquida = receitaBruta.map((v, i) => v - deducoes[i])
  const cmv = receitaBruta.map(v => v * (cmvPercentual / 100))
  const lucroBruto = receitaLiquida.map((v, i) => v - cmv[i])
  const despFixas = receitaBruta.map(() => custosFixosMensais)
  const despVariaveis = receitaBruta.map(v => v * (custosVariaveisPercentual / 100))
  const despOperacionais = despFixas.map((v, i) => v + despVariaveis[i])
  const ebitda = lucroBruto.map((v, i) => v - despOperacionais[i])
  const depreciacao = receitaBruta.map(() => depreciacaoMensal)
  const ebit = ebitda.map((v, i) => v - depreciacao[i])
  const resultFinanceiro = receitaBruta.map(() => resultadoFinanceiroMensal)
  const lair = ebit.map((v, i) => v + resultFinanceiro[i])
  const irCsll = lair.map(v => (v > 0 ? v * (aliquotaIR / 100) : 0))
  const lucroLiquido = lair.map((v, i) => v - irCsll[i])

  return [
    { label: 'Receita Bruta', valores: receitaBruta, total: soma(receitaBruta), destaque: true },
    { label: '(-) Deducoes', valores: deducoes, total: soma(deducoes), indentacao: 1 },
    { label: '= Receita Liquida', valores: receitaLiquida, total: soma(receitaLiquida), destaque: true },
    { label: '(-) CMV/CPV', valores: cmv, total: soma(cmv), indentacao: 1 },
    { label: '= Lucro Bruto', valores: lucroBruto, total: soma(lucroBruto), destaque: true },
    { label: '(-) Despesas Operacionais', valores: despOperacionais, total: soma(despOperacionais), indentacao: 1 },
    { label: '= EBITDA', valores: ebitda, total: soma(ebitda), destaque: true },
    { label: '(-) Depreciacoes', valores: depreciacao, total: soma(depreciacao), indentacao: 1 },
    { label: '= EBIT', valores: ebit, total: soma(ebit) },
    { label: '(+/-) Resultado Financeiro', valores: resultFinanceiro, total: soma(resultFinanceiro), indentacao: 1 },
    { label: '= Lucro Antes IR', valores: lair, total: soma(lair), destaque: true },
    { label: '(-) IR/CSLL', valores: irCsll, total: soma(irCsll), indentacao: 1 },
    { label: '= Lucro Liquido', valores: lucroLiquido, total: soma(lucroLiquido), destaque: true },
  ]
}

export function gerarFluxoCaixa(params: {
  saldoInicial: number
  recebimentosMensais: number[]
  pagamentosMensais: number[]
  investimentosMensais: number[]
  parcelasMensais: number[]
}): Array<{ label: string; valores: number[]; total: number; tipo: string }> {
  const { saldoInicial, recebimentosMensais, pagamentosMensais, investimentosMensais, parcelasMensais } = params

  const saldos: number[] = []
  let saldo = saldoInicial

  for (let i = 0; i < 12; i++) {
    const entradas = recebimentosMensais[i] || 0
    const saidas = (pagamentosMensais[i] || 0) + (investimentosMensais[i] || 0) + (parcelasMensais[i] || 0)
    saldo = saldo + entradas - saidas
    saldos.push(saldo)
  }

  return [
    { label: 'Saldo Inicial', valores: [saldoInicial, ...saldos.slice(0, 11)], total: saldoInicial, tipo: 'saldo' },
    { label: '(+) Recebimentos', valores: recebimentosMensais, total: soma(recebimentosMensais), tipo: 'entrada' },
    { label: '(-) Pagamentos Operacionais', valores: pagamentosMensais, total: soma(pagamentosMensais), tipo: 'saida' },
    { label: '(-) Investimentos', valores: investimentosMensais, total: soma(investimentosMensais), tipo: 'saida' },
    { label: '(-) Parcelas Financiamentos', valores: parcelasMensais, total: soma(parcelasMensais), tipo: 'saida' },
    { label: '= Saldo Final', valores: saldos, total: saldos[11] || 0, tipo: 'saldo' },
  ]
}
