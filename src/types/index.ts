// ============================================
// Exact Hub - Tipos do Sistema
// ============================================

// Auth & Users
export type Papel = 'CONSULTOR' | 'CLIENTE' | 'ADMIN'

export interface Usuario {
  id: string
  email: string
  nome: string
  papel: Papel
  avatar?: string | null
  ativo: boolean
  empresaId?: string | null
  empresa?: Empresa | null
}

export interface Empresa {
  id: string
  razaoSocial: string
  nomeFantasia?: string | null
  cnpj?: string | null
  segmento?: string | null
  porte?: string | null
  responsavel?: string | null
  telefone?: string | null
  email?: string | null
  cidade?: string | null
  estado?: string | null
  ativa: boolean
}

// ============================================
// Projecao Financeira — PROFECIA
// ============================================

// --- Cenarios ---
export type CenarioTipo = 'pessimista' | 'realista' | 'otimista' | 'agressivo'

export interface ConfigCenarios {
  pessimista: number  // ex: -14 (%)
  realista: number    // ex: 0 (base)
  otimista: number    // ex: 16
  agressivo: number   // ex: 30
  ativo: CenarioTipo  // cenario selecionado para alimentar PROFECIA
}

// --- Historico e Vendas ---
export interface HistoricoFaturamento {
  id?: string
  mes: number
  ano: number
  valor: number
}

export interface ProjecaoFaturamento {
  mes: number
  ano: number
  valorPessimista: number
  valorRealista: number
  valorOtimista: number
  valorAgressivo: number
}

export interface PremissasVendas {
  historico: HistoricoFaturamento[]
  taxaCrescimentoBase: number  // % de crescimento sobre LTM
  cenarios: ConfigCenarios
}

// --- Condicoes de Recebimento (PMR) ---
export interface CondicoesRecebimento {
  percentualAVista: number       // ex: 38 (%)
  percentualAPrazo: number       // ex: 62 (%), = 100 - aVista
  distribuicaoParcelas: DistribuicaoParcela[]  // como as vendas a prazo se dividem
  antecipaRecebiveis: boolean
  percentualAntecipacao: number  // ex: 95 (%)
  taxaDesconto: number           // ex: 7 (% a.m.)
}

export interface DistribuicaoParcela {
  qtdParcelas: number  // 1, 2, 3... 12
  percentual: number   // % das vendas a prazo nesse numero de parcelas
}

// --- Condicoes de Pagamento (PMP) ---
export interface CondicoesPagamento {
  percentualAVista: number
  percentualAPrazo: number
  distribuicaoParcelas: DistribuicaoParcela[]
}

// --- Grade de Recebimentos/Pagamentos ---
export interface GradeDistribuicao {
  mesOrigem: number       // mes da venda/compra (0-11)
  mesRecebimento: number  // mes em que o dinheiro entra/sai (0-17, pode passar 12)
  valor: number
}

// --- Custos e Despesas ---
export type CategoriaDespesa =
  | 'pessoal'
  | 'diretoria'
  | 'comercial'
  | 'administrativo'
  | 'financeiro'
  | 'tributarias'

export interface GastoVariavel {
  id?: string
  nome: string
  percentual: number  // % do faturamento
  categoria: string   // impostos, comissoes, transacoes, cmv, outros
}

export interface ReajusteMensal {
  mesInicio: number  // 0-11 (a partir de qual mês o novo valor se aplica)
  novoValor: number  // novo valor mensal a partir deste mês
}

export interface GastoFixo {
  id?: string
  nome: string
  valor: number         // valor base mensal em R$
  categoria: CategoriaDespesa
  reajustes?: ReajusteMensal[]  // reajustes mensais opcionais
}

export interface DespesasCompletas {
  variaveis: GastoVariavel[]
  fixos: GastoFixo[]
}

// --- Investimentos e Financiamentos ---
export interface ItemInvestimento {
  id?: string
  descricao: string
  valor: number
  mes: number  // 0-11 (mes de ocorrencia)
  tipo: 'venda_ativos' | 'receita_financeira' | 'investimento_capex'
}

export interface ItemFinanciamento {
  id?: string
  descricao: string
  valor: number
  mes: number           // 0-11 (mês único)
  meses?: number[]      // para recorrente: array de meses (0-11) onde se aplica
  recorrente?: boolean  // flag de recorrência
  tipo: 'captacao' | 'aporte' | 'distribuicao' | 'amortizacao' | 'capital_terceiros' | 'acordo'
}

// --- Contas a Receber/Pagar existentes ---
export interface ContaExistente {
  id?: string
  descricao: string
  valor: number
  mes: number  // 0-11 (mes de vencimento)
}

// --- Dados Completos da Projecao ---
export interface ProjecaoFinanceiraCompleta {
  id?: string
  empresaId: string
  nome: string
  anoBase: number
  saldoInicial: number
  premissasVendas: PremissasVendas
  condicoesRecebimento: CondicoesRecebimento
  condicoesPagamento: CondicoesPagamento
  despesas: DespesasCompletas
  investimentos: ItemInvestimento[]
  financiamentos: ItemFinanciamento[]
  contasReceber: ContaExistente[]  // CAR - saldos existentes
  contasPagar: ContaExistente[]    // CAP - saldos existentes
  metaPERs: number     // Meta Ponto Equilibrio em R$
  metaPEPerc: number   // Meta PE em %
}

// --- Resultados PROFECIA (Fluxo de Caixa) ---
export interface ResultadoProfecia {
  // Operacional
  entradasOperacionais: number[]     // 12 meses
  receitasNovasVendas: number[]
  contasReceberMes: number[]
  outrasEntradas: number[]

  saidasVariaveis: number[]
  impostos: number[]
  custosVendas: number[]
  custosTransacoes: number[]
  cmvNovasCompras: number[]
  outrosCustosVariaveis: number[]
  contasPagarMes: number[]

  margemContribuicao: number[]       // entradas - saidas variaveis

  saidasFixas: number[]
  despPessoal: number[]
  despDiretoria: number[]
  despComercial: number[]
  despAdministrativo: number[]
  despFinanceiro: number[]
  despTributarias: number[]

  fdcOperacional: number[]           // margem contribuicao - fixas

  // Investimentos
  vendaAtivos: number[]
  receitasFinanceiras: number[]
  investimentosCapex: number[]
  fdcInvestimentos: number[]

  // Financiamentos
  captacaoRecursos: number[]
  aportes: number[]
  distribuicoes: number[]
  amortizacoes: number[]
  capitalTerceiros: number[]
  acordos: number[]
  fdcFinanciamentos: number[]

  // Totais
  totalEntradas: number[]
  totalSaidas: number[]
  saldoInicial: number[]
  geracaoCaixa: number[]
  saldoFinal: number[]
  geracaoAcumulada: number[]
}

// --- KPIs ---
export interface KPIsProfecia {
  impostosTotaisPerc: number[]       // % do faturamento
  saidasVariaveisPerc: number[]
  margemContribuicaoPerc: number[]
  pontoEquilibrioRS: number[]        // PE em R$
  fdcOperacionalPerc: number[]
  fdcInvestimentosPerc: number[]
  fdcFinanciamentosPerc: number[]
  geracaoCaixaPerc: number[]
  exposicaoMaximaCaixa: number       // MIN(saldoFinal) — alerta de liquidez
  metaPERS: number[]
  metaPEPerc: number[]
}

// --- DRE ---
export interface LinhaDRE {
  label: string
  valores: number[]  // 12 meses
  total: number
  destaque?: boolean
  indentacao?: number
  tipo?: 'receita' | 'deducao' | 'resultado' | 'kpi'
}

// --- Linha do Fluxo de Caixa ---
export interface LinhaProfecia {
  label: string
  valores: number[]
  total: number
  tipo: 'entrada' | 'saida' | 'resultado' | 'saldo'
  indentacao?: number
  destaque?: boolean
}

// ============================================
// Business Model Canvas
// ============================================
export interface CanvasCard {
  id: string
  texto: string
  cor?: string
  ordem: number
}

export type BlocoCanvas =
  | 'parceiros'
  | 'atividades'
  | 'recursos'
  | 'proposta'
  | 'relacionamento'
  | 'canais'
  | 'segmentos'
  | 'custos'
  | 'receitas'

export interface BusinessModelCanvasData {
  id?: string
  empresaId: string
  versao: number
  blocos: Record<BlocoCanvas, CanvasCard[]>
}

// ============================================
// Entrevistas
// ============================================
export type StatusEntrevista = 'RASCUNHO' | 'ATIVA' | 'FINALIZADA' | 'ANALISADA'

export interface Pergunta {
  id: string
  texto: string
  categoria: string
  tipo: 'aberta' | 'escala' | 'multipla_escolha'
  opcoes?: string[]
}

export interface Entrevista {
  id?: string
  empresaId: string
  titulo: string
  descricao?: string
  status: StatusEntrevista
  perguntas: Pergunta[]
  analise?: AnaliseEntrevista | null
  criadoPorId: string
}

export interface RespostaEntrevista {
  id?: string
  entrevistaId: string
  respondente: string
  cargo?: string
  area?: string
  respostas: Record<string, string | number>
}

export interface TemaPareto {
  tema: string
  frequencia: number
  percentual: number
  acumulado: number
  categoria: string
}

export interface AnaliseEntrevista {
  resumoExecutivo: string
  temas: TemaPareto[]
  recomendacoes: string[]
  pontosCriticos: string[]
  pontosPositivos: string[]
}

// ============================================
// Memoria do Cliente
// ============================================
export interface MemoriaCliente {
  id?: string
  empresaId: string
  conteudo: string
  versao: number
  geradoPorId: string
}

// ============================================
// Dashboard
// ============================================
export interface EmpresaResumo {
  id: string
  razaoSocial: string
  segmento: string
  progresso: number
  ultimaAtualizacao: string
  modulosAtivos: string[]
}
