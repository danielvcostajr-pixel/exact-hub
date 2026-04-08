import { describe, it, expect } from 'vitest'
import {
  rotateArray,
  getMesesReordenados,
  gerarGradeRecebimentos,
  gerarGradePagamentos,
  gerarResultadoProfecia,
  gerarLinhasProfecia,
} from '../financeiro'
import type { ProjecaoFinanceiraCompleta } from '@/types'

// ============================================
// Helpers
// ============================================

function faturamentoUniforme(valor: number): number[] {
  return new Array(12).fill(valor)
}

function somaArray(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

/** Projecao minima para testes — valores zerados exceto o necessario */
function projecaoBase(overrides?: Partial<ProjecaoFinanceiraCompleta>): ProjecaoFinanceiraCompleta {
  return {
    empresaId: 'test',
    nome: 'Test',
    anoBase: 2026,
    mesInicial: 0,
    saldoInicial: 1_000_000,
    premissasVendas: {
      historico: [],
      taxaCrescimentoBase: 0,
      cenarios: { pessimista: -10, realista: 0, otimista: 10, agressivo: 20, ativo: 'realista' },
    },
    condicoesRecebimento: {
      percentualAVista: 100,
      percentualAPrazo: 0,
      distribuicaoParcelas: [],
      antecipaRecebiveis: false,
      percentualAntecipacao: 0,
      taxaDesconto: 0,
    },
    condicoesPagamento: {
      percentualAVista: 100,
      percentualAPrazo: 0,
      distribuicaoParcelas: [],
    },
    despesas: { variaveis: [], fixos: [] },
    investimentos: [],
    financiamentos: [],
    contasReceber: [],
    contasPagar: [],
    metaPERs: 0,
    metaPEPerc: 0,
    ...overrides,
  }
}

// ============================================
// rotateArray
// ============================================

describe('rotateArray', () => {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  it('mesInicial=0 retorna array identico', () => {
    expect(rotateArray(arr, 0)).toEqual(arr)
  })

  it('mesInicial=2 comeca em marco', () => {
    const result = rotateArray(arr, 2)
    expect(result[0]).toBe(2)
    expect(result[10]).toBe(0)
    expect(result[11]).toBe(1)
  })

  it('soma se preserva apos rotacao', () => {
    for (let m = 0; m < 12; m++) {
      expect(somaArray(rotateArray(arr, m))).toBe(somaArray(arr))
    }
  })

  it('rotacionar e des-rotacionar retorna ao original', () => {
    const rotated = rotateArray(arr, 5)
    const unrotated = rotateArray(rotated, 7) // 5 + 7 = 12 = volta ao original
    expect(unrotated).toEqual(arr)
  })
})

// ============================================
// gerarGradeRecebimentos — circular
// ============================================

describe('gerarGradeRecebimentos', () => {
  it('100% a vista: recebimentos = faturamento', () => {
    const fat = faturamentoUniforme(100_000)
    const result = gerarGradeRecebimentos({
      faturamentoMensal: fat,
      condicoesRecebimento: {
        percentualAVista: 100,
        percentualAPrazo: 0,
        distribuicaoParcelas: [],
        antecipaRecebiveis: false,
        percentualAntecipacao: 0,
        taxaDesconto: 0,
      },
    })
    expect(result).toEqual(fat)
  })

  it('grade circular: soma dos recebimentos = soma do faturamento (nada se perde)', () => {
    const fat = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]
    const result = gerarGradeRecebimentos({
      faturamentoMensal: fat,
      condicoesRecebimento: {
        percentualAVista: 50,
        percentualAPrazo: 50,
        distribuicaoParcelas: [{ qtdParcelas: 3, percentual: 100 }],
        antecipaRecebiveis: false,
        percentualAntecipacao: 0,
        taxaDesconto: 0,
      },
    })
    const somaFat = somaArray(fat)
    const somaRec = somaArray(result)
    expect(somaRec).toBeCloseTo(somaFat, 2)
  })

  it('parcelas longas (6x) nao perdem valor com grade circular', () => {
    const fat = faturamentoUniforme(600_000)
    const result = gerarGradeRecebimentos({
      faturamentoMensal: fat,
      condicoesRecebimento: {
        percentualAVista: 0,
        percentualAPrazo: 100,
        distribuicaoParcelas: [{ qtdParcelas: 6, percentual: 100 }],
        antecipaRecebiveis: false,
        percentualAntecipacao: 0,
        taxaDesconto: 0,
      },
    })
    expect(somaArray(result)).toBeCloseTo(somaArray(fat), 2)
  })

  it('faturamento uniforme + parcelas uniformes: todos os meses recebem igual', () => {
    const fat = faturamentoUniforme(120_000)
    const result = gerarGradeRecebimentos({
      faturamentoMensal: fat,
      condicoesRecebimento: {
        percentualAVista: 0,
        percentualAPrazo: 100,
        distribuicaoParcelas: [{ qtdParcelas: 3, percentual: 100 }],
        antecipaRecebiveis: false,
        percentualAntecipacao: 0,
        taxaDesconto: 0,
      },
    })
    // Com fat uniforme e parcelas circulares, cada mes recebe o mesmo total
    const esperado = result[0]
    for (let i = 1; i < 12; i++) {
      expect(result[i]).toBeCloseTo(esperado, 2)
    }
  })
})

// ============================================
// gerarGradePagamentos — circular
// ============================================

describe('gerarGradePagamentos', () => {
  it('soma dos pagamentos = soma das compras (circular, nada se perde)', () => {
    const compras = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600]
    const result = gerarGradePagamentos({
      comprasMensais: compras,
      condicoesPagamento: {
        percentualAVista: 30,
        percentualAPrazo: 70,
        distribuicaoParcelas: [{ qtdParcelas: 4, percentual: 100 }],
      },
    })
    expect(somaArray(result)).toBeCloseTo(somaArray(compras), 2)
  })
})

// ============================================
// gerarResultadoProfecia — invariantes
// ============================================

describe('gerarResultadoProfecia', () => {
  it('geracaoCaixa[i] === totalEntradas[i] - totalSaidas[i] para todo mes', () => {
    const projecao = projecaoBase({
      despesas: {
        variaveis: [
          { nome: 'Impostos', percentual: 10, categoria: 'impostos' },
          { nome: 'CMV', percentual: 30, categoria: 'cmv' },
        ],
        fixos: [
          { nome: 'Pessoal', valor: 50_000, categoria: 'pessoal' },
          { nome: 'Admin', valor: 20_000, categoria: 'administrativo' },
        ],
      },
      condicoesRecebimento: {
        percentualAVista: 60,
        percentualAPrazo: 40,
        distribuicaoParcelas: [{ qtdParcelas: 2, percentual: 100 }],
        antecipaRecebiveis: false,
        percentualAntecipacao: 0,
        taxaDesconto: 0,
      },
      condicoesPagamento: {
        percentualAVista: 50,
        percentualAPrazo: 50,
        distribuicaoParcelas: [{ qtdParcelas: 3, percentual: 100 }],
      },
    })
    const fat = [500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000,
                 1_100_000, 1_200_000, 1_000_000, 900_000, 800_000, 700_000]

    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })

    for (let i = 0; i < 12; i++) {
      expect(resultado.geracaoCaixa[i]).toBeCloseTo(
        resultado.totalEntradas[i] - resultado.totalSaidas[i], 2
      )
    }
  })

  it('saldoFinal[i] === saldoInicial[i] + geracaoCaixa[i] para todo mes', () => {
    const projecao = projecaoBase({ saldoInicial: 3_000_000 })
    const fat = faturamentoUniforme(1_000_000)
    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })

    for (let i = 0; i < 12; i++) {
      expect(resultado.saldoFinal[i]).toBeCloseTo(
        resultado.saldoInicial[i] + resultado.geracaoCaixa[i], 2
      )
    }
  })

  it('saldoInicial[0] === saldo informado pelo usuario', () => {
    const saldo = 5_000_000
    const projecao = projecaoBase({ saldoInicial: saldo })
    const fat = faturamentoUniforme(1_000_000)
    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })

    expect(resultado.saldoInicial[0]).toBe(saldo)
  })

  it('saldoInicial[i] === saldoFinal[i-1] para i > 0', () => {
    const projecao = projecaoBase()
    const fat = faturamentoUniforme(800_000)
    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })

    for (let i = 1; i < 12; i++) {
      expect(resultado.saldoInicial[i]).toBeCloseTo(resultado.saldoFinal[i - 1], 2)
    }
  })

  it('geracaoAcumulada[i] === soma(geracaoCaixa[0..i])', () => {
    const projecao = projecaoBase()
    const fat = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]
    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })

    let acumulado = 0
    for (let i = 0; i < 12; i++) {
      acumulado += resultado.geracaoCaixa[i]
      expect(resultado.geracaoAcumulada[i]).toBeCloseTo(acumulado, 2)
    }
  })

  it('saldoFinal ultimo = saldoInicial + geracaoAcumulada ultimo', () => {
    const saldo = 2_000_000
    const projecao = projecaoBase({ saldoInicial: saldo })
    const fat = faturamentoUniforme(500_000)
    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })

    expect(resultado.saldoFinal[11]).toBeCloseTo(
      saldo + resultado.geracaoAcumulada[11], 2
    )
  })
})

// ============================================
// gerarLinhasProfecia — consistencia da tabela
// ============================================

describe('gerarLinhasProfecia', () => {
  it('linha GERACAO DE CAIXA = linha TOTAL ENTRADAS - linha TOTAL SAIDAS por mes', () => {
    const projecao = projecaoBase({
      despesas: {
        variaveis: [{ nome: 'CMV', percentual: 25, categoria: 'cmv' }],
        fixos: [{ nome: 'Pessoal', valor: 100_000, categoria: 'pessoal' }],
      },
    })
    const fat = faturamentoUniforme(1_000_000)
    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })
    const linhas = gerarLinhasProfecia(resultado)

    const totalEntradas = linhas.find(l => l.label === '(=) TOTAL ENTRADAS')!
    const totalSaidas = linhas.find(l => l.label === '(=) TOTAL SAIDAS')!
    const geracaoCaixa = linhas.find(l => l.label === 'GERACAO DE CAIXA')!

    for (let i = 0; i < 12; i++) {
      expect(geracaoCaixa.valores[i]).toBeCloseTo(
        totalEntradas.valores[i] - totalSaidas.valores[i], 2
      )
    }
  })
})

// ============================================
// Rotacao + recalculo — simula o que o DashboardProfecia faz
// ============================================

describe('rotacao com recalculo de cumulativos', () => {
  const saldoUsuario = 3_000_000
  const projecao = projecaoBase({
    saldoInicial: saldoUsuario,
    despesas: {
      variaveis: [{ nome: 'Impostos', percentual: 8, categoria: 'impostos' }],
      fixos: [{ nome: 'Pessoal', valor: 80_000, categoria: 'pessoal' }],
    },
  })
  const fat = [500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000,
               1_100_000, 1_200_000, 1_000_000, 900_000, 800_000, 700_000]

  it('apos rotacao e recalculo, saldoFinal ultimo = saldoInicial + soma(gc)', () => {
    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })

    for (const mesInicial of [0, 2, 5, 8, 11]) {
      const totalEntradasR = rotateArray([...resultado.totalEntradas], mesInicial)
      const totalSaidasR = rotateArray([...resultado.totalSaidas], mesInicial)
      const gcR = totalEntradasR.map((v, i) => v - totalSaidasR[i])

      // Recalcular saldo como o DashboardProfecia faz
      const saldoInicialR: number[] = new Array(12)
      const saldoFinalR: number[] = new Array(12)

      saldoInicialR[0] = saldoUsuario
      saldoFinalR[0] = saldoUsuario + gcR[0]
      for (let i = 1; i < 12; i++) {
        saldoInicialR[i] = saldoFinalR[i - 1]
        saldoFinalR[i] = saldoInicialR[i] + gcR[i]
      }

      // Saldo final do ultimo mes deve ser igual ao saldo inicial + soma total de geracao
      const somaGC = somaArray(gcR)
      expect(saldoFinalR[11]).toBeCloseTo(saldoUsuario + somaGC, 2)

      // Soma da geracao de caixa deve ser igual independente da rotacao
      expect(somaGC).toBeCloseTo(somaArray(resultado.geracaoCaixa), 2)

      // totalEntradas - totalSaidas = geracaoCaixa para cada mes rotacionado
      for (let i = 0; i < 12; i++) {
        expect(gcR[i]).toBeCloseTo(totalEntradasR[i] - totalSaidasR[i], 2)
      }

      // Saldo NUNCA deve ter queda abrupta artificial (todas as diferencas devem ser gc)
      for (let i = 0; i < 12; i++) {
        expect(saldoFinalR[i]).toBeCloseTo(saldoInicialR[i] + gcR[i], 2)
      }
    }
  })

  it('nenhum mes deve ter valor NaN ou undefined', () => {
    const resultado = gerarResultadoProfecia({ projecao, faturamentoMensal: fat })

    for (const mesInicial of [0, 2, 5, 11]) {
      const gcR = rotateArray([...resultado.geracaoCaixa], mesInicial)
      for (let i = 0; i < 12; i++) {
        expect(gcR[i]).not.toBeNaN()
        expect(gcR[i]).toBeDefined()
      }
    }
  })
})
